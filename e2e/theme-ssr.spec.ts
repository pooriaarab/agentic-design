import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { expect, test } from "@playwright/test";
import { ThemeProvider, themeInitScript, useTheme } from "../dist/react.js";

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

// The head script runs here against a stand-in page. It must apply the saved pick, then the default.
function runScript(script: string, saved: string | null): string | null {
  let applied: string | null = null;
  const document = { documentElement: { setAttribute: (_name: string, value: string) => (applied = value) } };
  const localStorage = { getItem: () => saved };
  new Function("document", "localStorage", script)(document, localStorage);
  return applied;
}

test("the head script applies a saved pick, then the default, and never an unknown value", () => {
  const script = themeInitScript(undefined, "dark");
  expect(runScript(script, null)).toBe("dark");
  expect(runScript(script, "light")).toBe("light");
  expect(runScript(script, "system")).toBeNull();
  expect(runScript(script, "blue")).toBe("dark");
  expect(runScript(themeInitScript(), null)).toBeNull();
});
