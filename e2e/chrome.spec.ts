import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "@playwright/test";
import { AgentBadge, AppShell, DocumentTitle, ToolbarGroup } from "../dist/react.js";

const html = (node: ReturnType<typeof createElement>) => renderToStaticMarkup(node);

test("a badge for an agent with a hostile name shows the generic name and still says who it acts for", () => {
  const out = html(createElement(AgentBadge, { name: "Eve\u202Eevil", actingFor: "Ada" }));
  expect(out).toContain("Made by an agent");
  expect(out).toContain("Unnamed agent");
  expect(out).toContain("for Ada");
  expect(out).not.toContain("\u202E");
});

test("a badge with no principal says unknown, and the compact badge keeps every fact in its name", () => {
  expect(html(createElement(AgentBadge, {}))).toContain("for unknown");
  const compact = html(createElement(AgentBadge, { name: "Claude", actingFor: "Ada", compact: true, label: "Edited by an agent" }));
  expect(compact).toContain('aria-label="Edited by an agent: Claude, acting for Ada"');
  expect(compact).not.toContain("ad-agent-badge__label");
});

test("a read-only title shows plain text, and an unsafe stored title shows as Untitled", () => {
  const out = html(createElement(DocumentTitle, { value: "Plan", onRename: () => undefined, readOnly: true }));
  expect(out).toContain("Plan");
  expect(out).not.toContain("<button");
  const bad = html(createElement(DocumentTitle, { value: "Plan\u202Eexe", onRename: () => undefined }));
  expect(bad).toContain("Untitled, rename");
});

test("a side panel or a group without a name is refused", () => {
  expect(() => html(createElement(AppShell, { brand: "x", sidebar: null, panel: "p", panelLabel: " ", children: null }))).toThrow("non-empty label");
  expect(() => html(createElement(ToolbarGroup, { label: "", children: null }))).toThrow("non-empty label");
});
