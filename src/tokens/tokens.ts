// Tier 1: raw palette. Nothing outside this file reads these values.
// Steps run from light (low) to dark (high). Only used steps exist.
export const palette = {
  neutral: {
    0: "#FFFFFF", 50: "#FAFAFA", 100: "#F4F4F5", 150: "#ECECEE", 200: "#E4E4E7",
    400: "#A1A1AA", 500: "#82828B", 550: "#7E7E88", 600: "#52525B",
    700: "#2C2C31", 750: "#232326", 800: "#1D1D20", 850: "#1B1B1E", 900: "#151517", 950: "#101012",
  },
  blue: {
    50: "#EEF0FF", 200: "#C3CDFF", 300: "#A9B8FF", 400: "#90A4FF",
    600: "#4F46E5", 700: "#4338CA", 900: "#26264F", 950: "#14142E",
  },
  plum: {
    50: "#F7E8F5", 200: "#F0B8E9", 400: "#E49BDC", 600: "#8E2C86", 700: "#7A2273", 900: "#3A1F37",
  },
  red: {
    50: "#FDECEA", 300: "#F8A39B", 400: "#F2877D", 600: "#B42318", 700: "#A11D14", 900: "#3B1A17",
  },
  amber: {
    50: "#FDF1DC", 300: "#F0C677", 400: "#E8B04A", 600: "#92520A", 700: "#7A4208", 900: "#3A2A0F",
  },
  green: {
    50: "#E6F5EC", 300: "#8BDBAC", 400: "#6FCF97", 600: "#1B6B3A", 700: "#175C32", 900: "#14301F",
  },
} as const;

/** Tokens are shared by the CLI, the MCP server, and the Worker. No caller may change them. */
function deepFreeze<T>(value: T): T {
  if (typeof value === "object" && value !== null) {
    for (const inner of Object.values(value)) deepFreeze(inner);
    Object.freeze(value);
  }
  return value;
}
deepFreeze(palette);

const { neutral: n, blue: b, plum: p, red: r, amber: a, green: g } = palette;

export const colorNames = [
  "bg", "surface", "surface-raised", "surface-sunken", "surface-hover",
  "text", "text-muted", "text-on-accent",
  "border", "border-strong",
  "accent", "accent-hover", "accent-subtle", "accent-text",
  "agent", "agent-subtle", "agent-text",
  "danger", "danger-subtle", "danger-text",
  "warning", "warning-subtle", "warning-text",
  "success", "success-subtle", "success-text",
  "focus", "scrim",
] as const;
export type ColorName = (typeof colorNames)[number];
export type ThemeName = "light" | "dark";
export type Theme = Record<ColorName, string>;

// Tier 2: semantic colors. Apps read only these.
export const themes: Record<ThemeName, Theme> = deepFreeze({
  light: {
    bg: n[50], surface: n[0], "surface-raised": n[0], "surface-sunken": n[100], "surface-hover": n[150],
    text: n[800], "text-muted": n[600], "text-on-accent": n[0],
    border: n[200], "border-strong": n[500],
    accent: b[600], "accent-hover": b[700], "accent-subtle": b[50], "accent-text": b[700],
    agent: p[600], "agent-subtle": p[50], "agent-text": p[700],
    danger: r[600], "danger-subtle": r[50], "danger-text": r[700],
    warning: a[600], "warning-subtle": a[50], "warning-text": a[700],
    success: g[600], "success-subtle": g[50], "success-text": g[700],
    focus: b[600], scrim: "rgb(24 24 27 / 0.32)",
  },
  dark: {
    bg: n[900], surface: n[850], "surface-raised": n[750], "surface-sunken": n[950], "surface-hover": n[700],
    text: n[150], "text-muted": n[400], "text-on-accent": b[950],
    border: n[700], "border-strong": n[550],
    accent: b[400], "accent-hover": b[300], "accent-subtle": b[900], "accent-text": b[200],
    agent: p[400], "agent-subtle": p[900], "agent-text": p[200],
    danger: r[400], "danger-subtle": r[900], "danger-text": r[300],
    warning: a[400], "warning-subtle": a[900], "warning-text": a[300],
    success: g[400], "success-subtle": g[900], "success-text": g[300],
    focus: b[300], scrim: "rgb(0 0 0 / 0.6)",
  },
});

export const shadows: Record<ThemeName, Record<"raised" | "floating", string>> = deepFreeze({
  light: {
    raised: "0 1px 2px rgb(24 24 27 / 0.04), 0 2px 8px rgb(24 24 27 / 0.05)",
    floating: "0 2px 4px rgb(24 24 27 / 0.04), 0 8px 24px rgb(24 24 27 / 0.10)",
  },
  dark: {
    raised: "0 1px 2px rgb(0 0 0 / 0.3), 0 2px 16px rgb(0 0 0 / 0.3)",
    floating: "0 2px 6px rgb(0 0 0 / 0.3), 0 8px 40px rgb(0 0 0 / 0.5)",
  },
});

// Scales do not change with the theme.
export const scale = deepFreeze({
  space: { 1: "0.25rem", 2: "0.5rem", 3: "0.75rem", 4: "1rem", 6: "1.5rem", 8: "2rem", 12: "3rem", 16: "4rem", 24: "6rem" },
  radius: { sm: "0.25rem", md: "0.5rem", lg: "1rem", full: "9999px" },
  "font-family": {
    sans: '"Inter Variable", ui-sans-serif, system-ui, sans-serif',
    mono: '"JetBrains Mono Variable", ui-monospace, "SF Mono", Menlo, monospace',
  },
  "font-size": { xs: "0.75rem", sm: "0.875rem", md: "1rem", lg: "1.125rem", xl: "1.375rem", "2xl": "1.75rem" },
  "line-height": { tight: "1.25", snug: "1.4", normal: "1.55" },
  "font-weight": { regular: "400", medium: "500", semibold: "600" },
  duration: { fast: "100ms", base: "160ms", slow: "240ms" },
  easing: { out: "cubic-bezier(0.16, 1, 0.3, 1)" },
  size: { control: "2.25rem", "control-touch": "2.75rem", sidebar: "16rem", "sidebar-rail": "3.5rem", panel: "20rem", topbar: "3rem", content: "46rem" },
} as const);

/** Colors a pair may use. The scrim is translucent, so it has no fixed ratio. */
export type PairColor = Exclude<ColorName, "scrim">;

export interface ContrastPair {
  fg: PairColor;
  bg: PairColor;
  min: 3 | 4.5;
  use: string;
}

const text = (fg: PairColor, bgs: PairColor[], use: string): ContrastPair[] =>
  bgs.map((bg) => ({ fg, bg, min: 4.5, use }));
const ui = (fg: PairColor, bgs: PairColor[], use: string): ContrastPair[] =>
  bgs.map((bg) => ({ fg, bg, min: 3, use }));

const surfaces: PairColor[] = ["bg", "surface", "surface-raised", "surface-sunken", "surface-hover"];
const status = (name: "danger" | "warning" | "success"): ContrastPair[] => [
  ...text(`${name}-text`, [`${name}-subtle`, ...surfaces], `${name} text`),
  ...ui(name, [`${name}-subtle`, ...surfaces], `${name} icon and border`),
];

// Every pair the components use. Disabled controls are exempt by WCAG 1.4.3.
export const contrastPairs: readonly ContrastPair[] = deepFreeze([
  ...text("text", [...surfaces, "accent-subtle"], "body text, and text on a selected row"),
  ...text("text-muted", surfaces, "secondary text and placeholders"),
  ...text("text-on-accent", ["accent", "accent-hover"], "text on a filled accent control"),
  ...text("accent-text", ["accent-subtle", ...surfaces], "accent text and links"),
  ...text("agent-text", ["agent-subtle", ...surfaces], "agent badge and agent text"),
  ...status("danger"),
  ...status("warning"),
  ...status("success"),
  ...ui("border-strong", [...surfaces, "accent-subtle"], "control borders (WCAG 1.4.11)"),
  ...ui("focus", [...surfaces, "accent-subtle", "agent-subtle", "danger-subtle", "warning-subtle", "success-subtle"], "focus ring (WCAG 1.4.11)"),
  ...ui("accent", ["accent-subtle", ...surfaces], "accent marks and checked controls"),
  ...ui("agent", ["agent-subtle", ...surfaces], "agent avatar outline"),
]);
