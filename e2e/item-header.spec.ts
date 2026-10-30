import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "@playwright/test";
import { ItemHeader, type PresenceEntry } from "../dist/react.js";

// Failure cases: unsafe peer/title text, missing rename, overflow, invalid cap, lost slots.
const presence: PresenceEntry[] = [
  { id: "1", name: "Eve\u202Eevil", kind: "agent", actingFor: "Ada" },
  { id: "2", name: "Grace", kind: "person" },
  { id: "3", name: "Ada", kind: "person" },
];
const render = (maxPresence = 2) => renderToStaticMarkup(createElement(ItemHeader, {
  title: "Bad\u202Etitle", presence, maxPresence,
  backLink: createElement("a", { href: "/" }, "Back"),
  shareButton: createElement("button", null, "Share"),
  fileMenu: createElement("button", null, "Menu"),
}));
test("read-only title, safe agent identity, and all slots survive composition", () => {
  const out = render();
  for (const text of ["Untitled", "Unnamed agent, agent, acting for Ada", "Back", "Share", "Menu", "+1"]) expect(out).toContain(text);
  expect(out).not.toContain("\u202E");
  expect(out).not.toContain(", rename");
});
test("caps never expose more than N avatars and invalid caps use the default", () => {
  expect(render(0)).toContain("+3");
  expect(render(-2)).toContain("+3");
  expect(render(1.8)).toContain("+2");
  expect(render(Number.NaN)).not.toContain("more");
});
