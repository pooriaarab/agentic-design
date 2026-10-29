import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join } from "node:path";
import { expect, test } from "@playwright/test";

// Invisible characters hide text from a reviewer: a bidi override reorders it, a zero-width space
// splits it. Write them as escapes, such as \u202E, never as raw characters.
const HIDDEN = /[\p{Cf}\p{Zl}\p{Zp}\p{Co}\p{Cn}\p{Default_Ignorable_Code_Point}\u2800\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/gu;
const TEXT = new Set([".ts", ".tsx", ".mjs", ".js", ".json", ".jsonc", ".md", ".css", ".html", ".yml", ".txt"]);
const SKIP = new Set(["node_modules", "dist", "site", ".git", "test-results", "e2e-artifacts", "fonts"]);

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    if (SKIP.has(name) || name.startsWith(".review")) return [];
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return files(path);
    return TEXT.has(extname(name)) || name === "LICENSE" ? [path] : [];
  });
}

const hidden = (text: string) => [...text.matchAll(HIDDEN)].map((m) => `U+${m[0].codePointAt(0)?.toString(16).toUpperCase().padStart(4, "0")}`);

test("the scan sees a hidden character when one is there", () => {
  expect(hidden("Ada\u202Eevil")).toEqual(["U+202E"]);
  expect(hidden("a\u200Bb")).toEqual(["U+200B"]);
  expect(hidden("a\u3164b")).toEqual(["U+3164"]);
  expect(hidden("a\u2800b")).toEqual(["U+2800"]);
  expect(hidden("plain text, with accents: Zoë")).toEqual([]);
});

test("no source, test, or doc file holds a raw invisible character", () => {
  const found = files(".").flatMap((path) => hidden(readFileSync(path, "utf8")).map((code) => `${path}: ${code}`));
  expect(found).toEqual([]);
});
