import { expect, test } from "@playwright/test";
import worker from "../dist/worker.js";

const get = (path: string, method = "GET") => worker.fetch(new Request(`http://worker.test${path}`, { method }));

test("GET /health reports the name and version", async () => {
  const res = await get("/health");
  expect(res.status).toBe(200);
  expect(await res.json()).toEqual({ ok: true, name: "agentic-design", version: expect.stringMatching(/^\d+\.\d+\.\d+/) });
});

test("GET /api/v1/tokens returns the same body as the CLI", async () => {
  const res = await get("/api/v1/tokens");
  expect(res.status).toBe(200);
  expect(res.headers.get("content-type")).toBe("application/json");
  const cli = await import("node:child_process").then((m) => JSON.parse(m.execFileSync("node", ["dist/cli.js", "tokens", "--format", "json"], { encoding: "utf8" })));
  expect(await res.json()).toEqual(cli);
});

test("an unknown path is 404 for any method", async () => {
  expect((await get("/nope")).status).toBe(404);
  expect((await get("/nope", "POST")).status).toBe(404);
});

test("a known path with the wrong method is 405", async () => {
  expect((await get("/api/v1/tokens", "POST")).status).toBe(405);
  expect((await get("/health", "DELETE")).status).toBe(405);
});
