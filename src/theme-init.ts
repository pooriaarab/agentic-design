/** The key under which the theme pick is saved. The provider and the head script share it. */
export const THEME_STORAGE_KEY = "agentic-design-theme";

/**
 * A script for the head of the page. It applies a saved pick before first paint, so a person
 * who chose dark never sees a light flash. With nothing saved, it applies `defaultPreference`,
 * so a provider whose default is dark does not flash light first either. Pass the same
 * `storageKey` and `defaultPreference` here and to `ThemeProvider`.
 */
export function themeInitScript(storageKey: string = THEME_STORAGE_KEY, defaultPreference: "light" | "dark" | "system" = "system"): string {
  // JSON.stringify leaves "<" alone, so escape it to keep a value from closing the script tag.
  const json = (value: string) => JSON.stringify(value).replace(/</g, "\\u003c");
  return `try{var t=localStorage.getItem(${json(storageKey)});if(t!=="light"&&t!=="dark"&&t!=="system")t=${json(defaultPreference)};if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}`;
}
