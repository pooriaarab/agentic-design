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

test("a stored title that is long but safe is shown, and does not turn into Untitled", () => {
  const long = "A".repeat(150);
  expect(html(createElement(DocumentTitle, { value: long, onRename: () => undefined }))).toContain(`${long}, rename`);
});

test("a badge label in another language is shown as given, and does not crash the page", () => {
  const out = html(createElement(AgentBadge, { label: "Von einem Agenten erstellt", name: "Claude" }));
  expect(out).toContain("Von einem Agenten erstellt");
  expect(html(createElement(AgentBadge, { label: "\u0623\u0646\u0634\u0623\u0647 \u0648\u0643\u064A\u0644" }))).toContain("for unknown");
});

test("a panel that is false or null draws no panel, and no label is needed", () => {
  const shell = (panel: null | false) => html(createElement(AppShell, { brand: "x", sidebar: null, panel, panelLabel: "Notes", children: null }));
  for (const panel of [false, null] as const) {
    expect(shell(panel)).not.toContain("ad-shell__panel");
    expect(shell(panel)).not.toContain("data-panel");
  }
});

test("a side panel or a group without a name is refused", () => {
  expect(() => html(createElement(AppShell, { brand: "x", sidebar: null, panel: "p", panelLabel: " ", children: null }))).toThrow("non-empty label");
  expect(() => html(createElement(ToolbarGroup, { label: "", children: null }))).toThrow("non-empty label");
});
