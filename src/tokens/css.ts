import { colorNames, scale, shadows, themes, type ThemeName } from "./tokens.js";

const prefix = "--ad-";

// Colors and shadows change with the theme. Scales do not, so they live on :root alone.
// A themed region inherits them, and the reduced-motion override on :root reaches every region.
function themeBlock(name: ThemeName, indent: string): string {
  const lines = [`${indent}color-scheme: ${name};`];
  for (const color of colorNames) lines.push(`${indent}${prefix}color-${color}: ${themes[name][color]};`);
  for (const [level, value] of Object.entries(shadows[name])) lines.push(`${indent}${prefix}shadow-${level}: ${value};`);
  return lines.join("\n");
}

function scaleBlock(): string {
  const lines: string[] = [];
  for (const [group, steps] of Object.entries(scale)) {
    for (const [step, value] of Object.entries(steps)) lines.push(`  ${prefix}${group}-${step}: ${value};`);
  }
  return lines.join("\n");
}

// An element with no data-theme follows the OS. data-theme="light" or "dark" overrides it,
// on the root or on any inner element.
export function tokensCss(): string {
  return [
    "/* Generated from src/tokens/tokens.ts. Do not edit. */",
    `:root,\n[data-theme="light"] {\n${themeBlock("light", "  ")}\n}`,
    `:root {\n${scaleBlock()}\n}`,
    `@media (prefers-color-scheme: dark) {\n  :root:not([data-theme]) {\n${themeBlock("dark", "    ")}\n  }\n}`,
    `[data-theme="dark"] {\n${themeBlock("dark", "  ")}\n}`,
    `@media (prefers-reduced-motion: reduce) {\n  :root {\n    ${prefix}duration-fast: 0.01ms;\n    ${prefix}duration-base: 0.01ms;\n    ${prefix}duration-slow: 0.01ms;\n  }\n}`,
    "",
  ].join("\n\n");
}

export function tokensJson(): { themes: typeof themes; shadows: typeof shadows; scale: typeof scale } {
  return { themes, shadows, scale };
}
