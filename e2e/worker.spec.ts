import { type ChildProcess, execFileSync, spawn } from "node:child_process";
import { closeSync, openSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@playwright/test";

// The Worker runs under wrangler dev, the real runtime, and the test talks to it over HTTP.
const port = Number(process.env.WORKER_TEST_PORT ?? 8791);
const base = `http://127.0.0.1:${port}`;
let server: ChildProcess;
const logPath = join(tmpdir(), "agentic-design-wrangler.log");

test.beforeAll(async () => {
  test.setTimeout(120_000);
  const log = openSync(logPath, "w");
  server = spawn("npx", ["wrangler", "dev", "--port", String(port), "--ip", "127.0.0.1"], {
    env: { ...process.env, WRANGLER_SEND_METRICS: "false", CI: "1" },
    stdio: ["ignore", log, log],
    detached: true,
  });
  closeSync(log);
  for (let i = 0; i < 120; i++) {
    // If the server we spawned has died, a /health answer comes from a stale server on this port.
    if (server.exitCode !== null) break;
    try {
      if ((await fetch(`${base}/health`)).ok) return;
    } catch {
      // The server is not up yet.
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`wrangler dev did not start:\n${readFileSync(logPath, "utf8").slice(-1500)}`);
});

// wrangler starts child processes. Kill the whole group so no server outlives the test.
test.afterAll(() => {
  try {
    if (server?.pid) process.kill(-server.pid, "SIGTERM");
  } catch {
    // The server already exited.
  }
});

const send = (path: string, method = "GET") => fetch(`${base}${path}`, { method });

test("GET /health reports the name and version", async () => {
  const res = await send("/health");
  expect(res.status).toBe(200);
  expect(await res.json()).toEqual({ ok: true, name: "agentic-design", version: expect.stringMatching(/^\d+\.\d+\.\d+/) });
});

test("GET /api/v1/tokens returns the same body as the CLI", async () => {
  const res = await send("/api/v1/tokens");
  expect(res.status).toBe(200);
  expect(res.headers.get("content-type")).toBe("application/json");
  const cli = JSON.parse(execFileSync("node", ["dist/cli.js", "tokens", "--format", "json"], { encoding: "utf8" }));
  expect(await res.json()).toEqual(cli);
});

test("HEAD works for a probe and has no body", async () => {
  const res = await send("/health", "HEAD");
  expect(res.status).toBe(200);
  expect(await res.text()).toBe("");
});

test("an unknown path is 404 for any method", async () => {
  expect((await send("/nope")).status).toBe(404);
  expect((await send("/nope", "POST")).status).toBe(404);
});

test("a known path with the wrong method is 405 and says which methods work", async () => {
  const res = await send("/api/v1/tokens", "POST");
  expect(res.status).toBe(405);
  expect(res.headers.get("allow")).toBe("GET, HEAD");
  expect((await send("/health", "DELETE")).status).toBe(405);
});
