import { existsSync, readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

// Radix and its helpers are built into dist/react.js. Their MIT notices must travel with them.
const built = readFileSync("dist/react.js", "utf8");
const notices = existsSync("dist/THIRD_PARTY_LICENSES.md") ? readFileSync("dist/THIRD_PARTY_LICENSES.md", "utf8") : "";
const bundled = [...new Set([...built.matchAll(/\/\/ node_modules\/((?:@[^/]+\/)?[^/\n]+)/g)].map((m) => m[1]))];

test("the build lists a license for every package built into dist/react.js", () => {
  expect(bundled.length).toBeGreaterThan(5);
  for (const name of bundled) expect(notices, name).toContain(`## ${name} `);
});

test("each listed package has its license text", () => {
  const sections = notices.split(/^## /m).slice(1);
  expect(sections.length).toBeGreaterThanOrEqual(bundled.length);
  for (const section of sections) expect(section, section.split("\n")[0]).toMatch(/Permission is hereby granted|Permission to use, copy, modify|Apache License|Redistribution/);
});

test("the notices are part of the published package", () => {
  expect(JSON.parse(readFileSync("package.json", "utf8")).files).toContain("dist");
});
