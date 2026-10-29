import { contrastPairs, themes as shippedThemes, type ContrastPair, type Theme, type ThemeName } from "./tokens.js";

function channel(value: number): number {
  const c = value / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const match = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!match) throw new Error(`contrast needs a 6-digit hex color, got "${hex}"`);
  const v = parseInt(match[1], 16);
  return 0.2126 * channel(v >> 16) + 0.7152 * channel((v >> 8) & 255) + 0.0722 * channel(v & 255);
}

export function contrastRatio(foreground: string, background: string): number {
  const [hi, lo] = [luminance(foreground), luminance(background)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

export interface ContrastResult extends ContrastPair {
  theme: ThemeName;
  ratio: number;
  pass: boolean;
}

const THEME_NAMES: readonly ThemeName[] = ["light", "dark"];

/**
 * Check every pair in both themes. Pass your own themes to check them instead of the shipped ones.
 * It throws when a theme or a color is missing, so bad input can never read as a pass.
 */
export function checkContrast(themes: Record<ThemeName, Theme> = shippedThemes): ContrastResult[] {
  return THEME_NAMES.flatMap((theme) => {
    const colors = themes?.[theme];
    if (typeof colors !== "object" || colors === null) throw new Error(`theme "${theme}" is missing`);
    return contrastPairs.map((pair) => {
      for (const name of [pair.fg, pair.bg]) {
        if (typeof colors[name] !== "string") throw new Error(`theme "${theme}" has no color "${name}"`);
      }
      const ratio = contrastRatio(colors[pair.fg], colors[pair.bg]);
      return { ...pair, theme, ratio, pass: ratio >= pair.min };
    });
  });
}
