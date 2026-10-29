import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "@playwright/test";

// The built bin, run as a real process. Without a flag it starts a stdio server and waits.
const BIN = join(process.cwd(), "dist", "mcp-bin.js");
const { version } = JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf8")) as { version: string };

for (const flag of ["--help", "-h"]) {
  test(`${flag} prints usage to stdout and exits 0 within 5 s`, () => {
    const started = Date.now();
    const run = spawnSync(process.execPath, [BIN, flag], { encoding: "utf8", timeout: 5000 });
    expect(run.error).toBeUndefined();
    expect(run.status).toBe(0);
    expect(run.stdout).toContain("Usage: agentic-design-mcp");
    expect(Date.now() - started).toBeLessThan(5000);
  });
}

for (const flag of ["--version", "-V"]) {
  test(`${flag} prints the package version and exits 0`, () => {
    const run = spawnSync(process.execPath, [BIN, flag], { encoding: "utf8", timeout: 5000 });
    expect(run.error).toBeUndefined();
    expect(run.status).toBe(0);
    expect(run.stdout.trim()).toBe(version);
  });
}
