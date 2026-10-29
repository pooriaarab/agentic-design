import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { PanelLeftIcon } from "../icons.js";
import { IconButton } from "./button.js";

export const SIDEBAR_STORAGE_KEY = "agentic-design:sidebar";
const CHANGE = "agentic-design:sidebar-change";

// The flag lives in localStorage. A storage that throws (private mode, a blocked site) means the
// choice lasts for the page only. Only the exact strings "open" and "collapsed" count as a choice.
function read(key: string): boolean | null {
  try {
    const value = window.localStorage.getItem(key);
    return value === "collapsed" ? true : value === "open" ? false : null;
  } catch {
    return null;
  }
}
// A choice that could not be saved. It lives here for the page, and it wins over storage.
const memory = new Map<string, boolean>();
const NARROW = "(max-width: 47.99rem)";
const onNarrowChange = (callback: () => void) => {
  const query = window.matchMedia(NARROW);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
};

// A save that failed stays in memory. A change from another tab is newer, so it replaces that.
function subscribe(key: string) {
  return (callback: () => void) => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === key || event.key === null) memory.delete(key);
      callback();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener(CHANGE, callback);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(CHANGE, callback);
    };
  };
}

export interface AppSidebarProps {
  /** Names the sidebar for a screen reader, for example "Main". */
  label: string;
  /** What the sidebar holds, usually a `SidebarNav`. A function gets the state, so it can show icons only when collapsed. A plain node is hidden when collapsed. */
  children: ReactNode | ((state: { collapsed: boolean }) => ReactNode);
  /** The state when nothing is saved. The default is open, and collapsed below 48rem, so a small screen keeps its room. */
  defaultCollapsed?: boolean;
  /** Control the state yourself. Then nothing is saved, and `onCollapsedChange` is how you hear about a change. */
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Where the choice is saved. Give each sidebar its own key. */
  storageKey?: string;
}

/**
 * A left sidebar with a toggle button. The button says what it does ("Collapse sidebar" or "Expand
 * sidebar") and has `aria-expanded`. The choice is saved on the device and shared between tabs.
 * Collapsed, the sidebar is a narrow rail with the button, and a plain node child is hidden from
 * sight and from the tab order.
 */
export function AppSidebar({ label, children, defaultCollapsed, collapsed: controlled, onCollapsedChange, storageKey = SIDEBAR_STORAGE_KEY }: AppSidebarProps) {
  if (label.trim() === "") throw new Error("A sidebar needs a non-empty label.");
  const id = useId();
  // The server and the first client render use the default. A saved choice applies after hydration.
  const subscribeToKey = useMemo(() => subscribe(storageKey), [storageKey]);
  const saved = useSyncExternalStore(
    subscribeToKey,
    () => memory.get(storageKey) ?? read(storageKey),
    () => null,
  );
  const narrow = useSyncExternalStore(onNarrowChange, () => window.matchMedia(NARROW).matches, () => false);
  const collapsed = controlled ?? saved ?? defaultCollapsed ?? narrow;
  // No animation for the first paint, so a saved choice does not slide in on every load.
  // Wait two frames: after hydration, a saved choice or a narrow screen changes the state in the same flush as mount.
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let second = 0;
    const first = requestAnimationFrame(() => { second = requestAnimationFrame(() => setReady(true)); });
    return () => { cancelAnimationFrame(first); cancelAnimationFrame(second); };
  }, []);
  const toggleButton = useRef<HTMLButtonElement>(null);
  const hidesContent = collapsed && typeof children !== "function";
  // Focus inside the content can vanish when the sidebar collapses on its own (a narrow window, another tab, or your own state): the links hide or unmount. Keep focus on the toggle.
  // A removed element sends no blur, so the last focused element tells us focus was inside.
  const lastFocus = useRef<EventTarget | null>(null);
  const contentBox = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!collapsed) return;
    const was = lastFocus.current as Node | null;
    // A tab that is in the background blurs its focus, but the element stays the active one. Check that too.
    const stillHere = hidesContent && !!contentBox.current?.contains(document.activeElement);
    if ((was && (!was.isConnected || hidesContent)) || stillHere) {
      lastFocus.current = null;
      toggleButton.current?.focus();
    }
  }, [collapsed, hidesContent]);
  const toggle = useCallback(() => {
    const next = !collapsed;
    onCollapsedChange?.(next);
    if (controlled !== undefined) return;
    try {
      window.localStorage.setItem(storageKey, next ? "collapsed" : "open");
      memory.delete(storageKey);
    } catch {
      // Storage is full or blocked. The choice stays in memory for this page.
      memory.set(storageKey, next);
    }
    window.dispatchEvent(new Event(CHANGE));
  }, [collapsed, controlled, onCollapsedChange, storageKey]);
  const content = typeof children === "function" ? children({ collapsed }) : children;
  return (
    <aside className="agd-appsidebar" aria-label={label} data-collapsed={collapsed} data-ready={ready || undefined}>
      <IconButton
        ref={toggleButton}
        className="agd-appsidebar__toggle"
        label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        icon={<PanelLeftIcon />}
        aria-expanded={!collapsed}
        aria-controls={`${id}-content`}
        onClick={toggle}
      />
      <div
        ref={contentBox}
        id={`${id}-content`}
        className="agd-appsidebar__content"
        hidden={hidesContent}
        onFocus={(event) => { lastFocus.current = event.target; }}
        onBlur={() => { lastFocus.current = null; }}
      >
        {content}
      </div>
    </aside>
  );
}
