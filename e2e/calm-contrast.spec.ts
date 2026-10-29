import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

// This test reads the shipped CSS, not the token object, and uses its own WCAG 2.x math.
// It guards the calm look: soft borders must not drop control edges or text below AA.
const css = readFileSync("dist/tokens.css", "utf8");

function block(selector: string): Record<string, string> {
  const start = css.indexOf(`${selector} {`);
  const body = css.slice(start, css.indexOf("}", start));
  const out: Record<string, string> = {};
  for (const m of body.matchAll(/--agd-color-([a-z-]+): (#[0-9A-Fa-f]{6});/g)) out[m[1]] = m[2];
  return out;
}

const channel = (v: number) => (v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
const lum = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * channel(n >> 16) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
};
const ratio = (a: string, b: string) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const surfaces = ["bg", "surface", "surface-raised", "surface-sunken", "surface-hover"];

for (const theme of ["light", "dark"] as const) {
  test(`calm ${theme} theme keeps WCAG 2.2 AA`, () => {
    const c = block(`[data-theme="${theme}"]`);
    expect(Object.keys(c).length).toBeGreaterThan(20);
    for (const s of surfaces) {
      expect(ratio(c.text, c[s]), `text on ${s}`).toBeGreaterThanOrEqual(4.5);
      expect(ratio(c["text-muted"], c[s]), `text-muted on ${s}`).toBeGreaterThanOrEqual(4.5);
      expect(ratio(c["accent-text"], c[s]), `accent-text on ${s}`).toBeGreaterThanOrEqual(4.5);
      expect(ratio(c["border-strong"], c[s]), `control edge on ${s}`).toBeGreaterThanOrEqual(3);
      expect(ratio(c.focus, c[s]), `focus ring on ${s}`).toBeGreaterThanOrEqual(3);
    }
    expect(ratio(c["text-on-accent"], c.accent), "label on accent").toBeGreaterThanOrEqual(4.5);
    expect(ratio(c["text-on-accent"], c["accent-hover"]), "label on accent hover").toBeGreaterThanOrEqual(4.5);
  });
}

test("the soft border stays quiet: it is decoration, not a control edge", () => {
  for (const theme of ["light", "dark"] as const) {
    const c = block(`[data-theme="${theme}"]`);
    expect(ratio(c.border, c.surface)).toBeLessThan(2);
  }
});
