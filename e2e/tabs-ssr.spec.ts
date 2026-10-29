import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { expect, test } from "@playwright/test";
import { Tabs } from "../dist/react.js";

const tabs = [
  { value: "a", label: "A", content: "one" },
  { value: "b", label: "B", content: "two" },
];

// Count the tab stops in the markup: the tabs with tabindex 0, and whether the list is one.
function stops(html: string): { zero: number; list: string | null } {
  return {
    zero: [...html.matchAll(/role="tab"[^>]*tabindex="0"/g)].length,
    list: /role="tablist"[^>]*tabindex="(-?\d+)"/.exec(html)?.[1] ?? null,
  };
}

test("the active tab is the only tab stop, and the list is none", () => {
  expect(stops(renderToString(createElement(Tabs, { label: "L", tabs, defaultValue: "b" })))).toEqual({ zero: 1, list: "-1" });
  expect(renderToString(createElement(Tabs, { label: "L", tabs, value: "b" }))).toMatch(/tabindex="0"[^>]*>B</);
});

test("a value that names no tab still leaves one tab stop", () => {
  expect(stops(renderToString(createElement(Tabs, { label: "L", tabs, defaultValue: "missing" }))).zero).toBe(1);
  expect(stops(renderToString(createElement(Tabs, { label: "L", tabs, value: "missing" }))).zero).toBe(1);
});
