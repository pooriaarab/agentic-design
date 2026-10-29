/** The key under which the theme pick is saved. The provider and the head script share it. */
export const THEME_STORAGE_KEY = "agentic-design-theme";

/**
 * A script for the head of the page. It applies a saved pick before first paint, so a person
 * who chose dark never sees a light flash. Put it in a `<script>` tag before the app loads.
 * Pass the same `storageKey` here and to `ThemeProvider`.
 */
export function themeInitScript(storageKey: string = THEME_STORAGE_KEY): string {
  // JSON.stringify leaves "<" alone, so escape it to keep a key from closing the script tag.
  const key = JSON.stringify(storageKey).replace(/</g, "\\u003c");
  return `try{var t=localStorage.getItem(${key});if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}`;
}
