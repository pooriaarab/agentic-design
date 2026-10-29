import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
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
  expect(cli("tokens", "--format", "json", "extra").status).toBe(2);
  expect(cli("contrast", "extra").status).toBe(2);
  expect(cli("nope").status).toBe(2);
});

test("the stylesheet only loads fonts that ship in the package", () => {
  const css = readFileSync("dist/styles.css", "utf8");
  expect(css).not.toMatch(/https?:\/\//);
  const urls = [...css.matchAll(/url\("\.\/(fonts\/[^"]+)"\)/g)].map((m) => m[1]);
  expect(urls.length).toBe(4);
  for (const url of urls) expect(existsSync(`dist/${url}`), url).toBe(true);
});

test("the check script exits 1 and names the pair when a pair fails", () => {
  const dir = mkdtempSync(join(tmpdir(), "ad-contrast-"));
  const { themes } = JSON.parse(cli("tokens", "--format", "json").stdout);
  const run = (file: string) => spawnSync("node", ["scripts/check-contrast.mjs", file], { encoding: "utf8" });

  const good = join(dir, "good.json");
  writeFileSync(good, JSON.stringify({ themes }));
  expect(run(good).status).toBe(0);

  themes.light.text = themes.light.bg;
  const bad = join(dir, "bad.json");
  writeFileSync(bad, JSON.stringify({ themes }));
  const result = run(bad);
  expect(result.status).toBe(1);
  expect(result.stderr).toContain("FAIL light: text on bg is 1.00, needs 4.5");
});

test("the check script refuses input it cannot check, instead of passing", () => {
  const dir = mkdtempSync(join(tmpdir(), "ad-contrast-"));
  const { themes } = JSON.parse(cli("tokens", "--format", "json").stdout);
  const run = (value: unknown) => {
    const file = join(dir, `${Math.random()}.json`);
    writeFileSync(file, JSON.stringify(value));
    return spawnSync("node", ["scripts/check-contrast.mjs", file], { encoding: "utf8" });
  };
  const empty = run({ themes: {} });
  expect(empty.status).toBe(2);
  expect(empty.stderr).toContain('theme "light" is missing');
  expect(run({}).status).toBe(2);
  const onlyLight = run({ themes: { light: themes.light } });
  expect(onlyLight.status).toBe(2);
  expect(onlyLight.stderr).toContain('theme "dark" is missing');
  const { accent, ...noAccent } = themes.dark;
  const missingColor = run({ themes: { light: themes.light, dark: noAccent } });
  expect(missingColor.status).toBe(2);
  expect(missingColor.stderr).toContain('has no color "accent"');
});

test("the shipped tokens cannot be changed at run time", () => {
  const { status } = spawnSync(
    "node",
    ["--input-type=module", "-e", 'import { themes } from "./dist/tokens.js"; try { themes.light.text = "#000"; } catch { process.exit(0); } process.exit(1);'],
    { encoding: "utf8" },
  );
  expect(status).toBe(0);
});

test("scales sit on :root alone, so reduced motion reaches every themed region", () => {
  const css = cli("tokens").stdout;
  const light = css.slice(css.indexOf(':root,\n[data-theme="light"]'), css.indexOf("\n}\n", css.indexOf(':root,\n[data-theme="light"]')));
  expect(light).toContain("--ad-color-bg");
  expect(light).not.toContain("--ad-duration");
  expect(css).toMatch(/prefers-reduced-motion: reduce\) \{\n  :root \{\n    --ad-duration-fast: 0.01ms;\n    --ad-duration-base: 0.01ms;\n    --ad-duration-slow: 0.01ms/);
});
