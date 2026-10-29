import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "@playwright/test";
import { FileList, FileRow, type FileItem } from "../dist/react.js";

const ada = { id: "a", name: "Ada", kind: "person" as const };
const item = (over: Partial<FileItem>): FileItem => ({ id: "1", name: "One", href: "#1", owner: ada, modified: new Date("2026-01-01T00:00:00Z"), ...over });
const html = (props: Parameters<typeof FileList>[0]) => renderToStaticMarkup(createElement(FileList, props));

test("a name with a hidden direction character shows as Untitled in the table", () => {
  const out = html({ label: "Files", items: [item({ name: "invoice\u202Etxt.exe" })] });
  expect(out).toContain(">Untitled<");
  expect(out).not.toContain("\u202E");
});

test("no items shows the default empty state, or the one you pass", () => {
  expect(html({ label: "Files", items: [] })).toContain("No files");
  expect(html({ label: "Files", items: [], empty: createElement("p", null, "Custom empty") })).toContain("Custom empty");
});

test("loading shows placeholders and a status, and hides them from a screen reader", () => {
  const out = html({ label: "Files", items: [], loading: true });
  expect(out).toContain('aria-busy="true"');
  expect(out).toContain("Loading files");
  expect(out).toContain('aria-hidden="true"');
  expect(out).not.toContain("No files");
});

test("a list you control keeps the order of its items", () => {
  const items = [item({ id: "1", name: "Zed" }), item({ id: "2", name: "Abe" })];
  const out = html({ label: "Files", items, sort: { key: "name", direction: "ascending" } });
  expect(out.indexOf("Zed")).toBeLessThan(out.indexOf("Abe"));
});

test("a table sorts by owner name, and the active header carries aria-sort", () => {
  const bob = { id: "b", name: "Bob", kind: "person" as const };
  const out = html({ label: "Files", items: [item({ id: "1", name: "X", owner: bob }), item({ id: "2", name: "Y", owner: ada })], defaultSort: { key: "owner", direction: "ascending" } });
  expect(out.indexOf(">Y<")).toBeLessThan(out.indexOf(">X<"));
  expect(out).toMatch(/<th[^>]*aria-sort="ascending"[^>]*><button[^>]*>Owner/);
});

test("the plain list with FileRow children still renders", () => {
  const row = createElement(FileRow, { name: "Plan", href: "#p", modified: new Date("2026-01-01T00:00:00Z"), editedBy: ada });
  expect(html({ label: "Recent", children: row })).toContain('<ul class="ad-files" aria-label="Recent">');
});
