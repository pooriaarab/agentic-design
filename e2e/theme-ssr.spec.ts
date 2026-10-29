import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { expect, test } from "@playwright/test";
import { ThemeProvider, useTheme } from "../dist/react.js";

// A server has no saved pick, and the browser has one. The first render must not read it,
// or the server markup and the browser markup would differ and React would reject the page.
function Probe() {
  const { preference, theme } = useTheme();
  return createElement("p", null, `${preference}/${theme}`);
}

test("the first render ignores a saved pick, so server and browser markup match", () => {
  const saved = { getItem: () => "dark", setItem: () => undefined };
  const globals = globalThis as unknown as { window?: unknown };
  const before = globals.window;
  globals.window = { localStorage: saved, matchMedia: () => ({ matches: true, addEventListener: () => undefined, removeEventListener: () => undefined }) };
  try {
    expect(renderToString(createElement(ThemeProvider, null, createElement(Probe)))).toContain("system/light");
  } finally {
    globals.window = before;
  }
});
