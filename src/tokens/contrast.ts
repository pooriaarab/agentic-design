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

/** Check every pair in each theme. Pass your own themes to check them instead of the shipped ones. */
export function checkContrast(themes: Record<ThemeName, Theme> = shippedThemes): ContrastResult[] {
  return (Object.keys(themes) as ThemeName[]).flatMap((theme) =>
    contrastPairs.map((pair) => {
      const ratio = contrastRatio(themes[theme][pair.fg], themes[theme][pair.bg]);
      return { ...pair, theme, ratio, pass: ratio >= pair.min };
    }),
  );
}
