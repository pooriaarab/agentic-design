import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { THEME_STORAGE_KEY } from "./theme-init.js";
import type { ThemeName } from "./tokens/index.js";

export type ThemePreference = ThemeName | "system";

interface ThemeContextValue {
  /** What the person picked. */
  preference: ThemePreference;
  /** The theme in effect: the pick, or the system setting when the pick is "system". */
  theme: ThemeName;
  setPreference: (preference: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);
const DARK_QUERY = "(prefers-color-scheme: dark)";

function subscribeToSystem(onChange: () => void): () => void {
  const query = window.matchMedia(DARK_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

const PREFERENCES: readonly ThemePreference[] = ["light", "dark", "system"];
const isPreference = (value: unknown): value is ThemePreference => PREFERENCES.includes(value as ThemePreference);

// A saved value is data from the device. A value that is not one of the three is ignored.
function readPreference(storageKey: string, fallback: ThemePreference): ThemePreference {
  try {
    const stored = window.localStorage.getItem(storageKey);
    return isPreference(stored) ? stored : fallback;
  } catch {
    return fallback;
  }
}

export interface ThemeProviderProps {
  children: ReactNode;
  defaultPreference?: ThemePreference;
  storageKey?: string;
}

/** Sets `data-theme` on the root element and remembers the pick on this device. */
export function ThemeProvider({
  children,
  defaultPreference = "system",
  storageKey = THEME_STORAGE_KEY,
}: ThemeProviderProps) {
  // A value from code that is not one of the three is a bug, and it stops here.
  if (!isPreference(defaultPreference)) throw new Error(`defaultPreference must be one of ${PREFERENCES.join(", ")}`);
  // The first render uses the default on the server and in the browser, so they match. The saved
  // pick is read right after mount. The head script has already applied it, so nothing flashes.
  const [preference, setPreferenceState] = useState<ThemePreference>(defaultPreference);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setPreferenceState(readPreference(storageKey, defaultPreference));
    setReady(true);
  }, [storageKey, defaultPreference]);
  const systemDark = useSyncExternalStore(
    subscribeToSystem,
    () => window.matchMedia(DARK_QUERY).matches,
    () => false,
  );
  const theme: ThemeName = preference === "system" ? (systemDark ? "dark" : "light") : preference;

  useEffect(() => {
    // Until the saved pick is read, leave the attribute the head script set.
    if (!ready) return;
    const root = document.documentElement;
    if (preference === "system") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", preference);
    return () => root.removeAttribute("data-theme");
  }, [preference, ready]);

  // Another tab of the same app changed the pick.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      // A null key means another tab cleared all storage.
      if (event.key === storageKey || event.key === null) setPreferenceState(readPreference(storageKey, defaultPreference));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [storageKey, defaultPreference]);

  const setPreference = useCallback(
    (next: ThemePreference) => {
      if (!isPreference(next)) throw new Error(`The theme must be one of ${PREFERENCES.join(", ")}, got "${String(next)}"`);
      setPreferenceState(next);
      try {
        window.localStorage.setItem(storageKey, next);
      } catch {
        // Private mode can block storage. The pick still applies for this visit.
      }
    },
    [storageKey],
  );

  const value = useMemo(() => ({ preference, theme, setPreference }), [preference, theme, setPreference]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("useTheme needs a ThemeProvider above it.");
  return value;
}
