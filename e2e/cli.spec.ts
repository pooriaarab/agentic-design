import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

const cli = (...args: string[]) => spawnSync("node", ["dist/cli.js", ...args], { encoding: "utf8" });

test("tokens --format json lists every semantic color in both themes", () => {
  const { status, stdout } = cli("tokens", "--format", "json");
  expect(status).toBe(0);
  const tokens = JSON.parse(stdout);
  for (const theme of ["light", "dark"]) {
    for (const name of ["bg", "surface", "text", "text-muted", "border", "accent", "danger", "warning", "success", "focus", "agent"]) {
      expect(tokens.themes[theme][name], `${theme}.${name}`).toMatch(/^(#|rgb)/);
    }
  }
});

test("tokens css has a light base, a dark override, and OS-follow rules", () => {
  const { status, stdout } = cli("tokens");
  expect(status).toBe(0);
  expect(stdout).toContain('[data-theme="dark"]');
  expect(stdout).toContain(":root:not([data-theme])");
  expect(stdout).toContain("prefers-reduced-motion");
});

test("contrast command passes for the shipped tokens", () => {
  const { status, stdout } = cli("contrast");
  expect(status).toBe(0);
  expect(JSON.parse(stdout).every((r: { pass: boolean }) => r.pass)).toBe(true);
});

test("bad input exits with a usage code", () => {
  expect(cli("tokens", "--format", "xml").status).toBe(2);
  expect(cli("nope").status).toBe(2);
});

test("the stylesheet only loads fonts that ship in the package", () => {
  const css = readFileSync("dist/styles.css", "utf8");
  expect(css).not.toMatch(/https?:\/\//);
  const urls = [...css.matchAll(/url\("\.\/(fonts\/[^"]+)"\)/g)].map((m) => m[1]);
  expect(urls.length).toBe(4);
  for (const url of urls) expect(existsSync(`dist/${url}`), url).toBe(true);
});

test("the check script goes red when a pair fails", () => {
  const run = () =>
    execFileSync("node", ["-e", `
      import("./dist/tokens.js").then(({ themes, checkContrast }) => {
        themes.light.text = themes.light.bg;
        process.exit(checkContrast().some((r) => !r.pass) ? 1 : 0);
      });`], { stdio: "pipe" });
  expect(run).toThrow();
});
