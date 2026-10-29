import { useCallback, useId, useSyncExternalStore, type ReactNode } from "react";
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
const memory = new Map<string, boolean>();

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(CHANGE, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(CHANGE, callback);
  };
}

export interface AppSidebarProps {
  /** Names the sidebar for a screen reader, for example "Main". */
  label: string;
  /** What the sidebar holds, usually a `SidebarNav`. A function gets the state, so it can show icons only when collapsed. A plain node is hidden when collapsed. */
  children: ReactNode | ((state: { collapsed: boolean }) => ReactNode);
  /** The state when nothing is saved. */
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
export function AppSidebar({ label, children, defaultCollapsed = false, collapsed: controlled, onCollapsedChange, storageKey = SIDEBAR_STORAGE_KEY }: AppSidebarProps) {
  if (label.trim() === "") throw new Error("A sidebar needs a non-empty label.");
  const id = useId();
  // The server and the first client render use the default. A saved choice applies after hydration.
  const saved = useSyncExternalStore(
    subscribe,
    () => (read(storageKey) ?? memory.get(storageKey) ?? null),
    () => null,
  );
  const collapsed = controlled ?? saved ?? defaultCollapsed;
  const toggle = useCallback(() => {
    const next = !collapsed;
    onCollapsedChange?.(next);
    if (controlled !== undefined) return;
    memory.set(storageKey, next);
    try {
      window.localStorage.setItem(storageKey, next ? "collapsed" : "open");
    } catch {
      // The choice stays in memory for this page.
    }
    window.dispatchEvent(new Event(CHANGE));
  }, [collapsed, controlled, onCollapsedChange, storageKey]);
  const content = typeof children === "function" ? children({ collapsed }) : children;
  return (
    <aside className="agd-appsidebar" aria-label={label} data-collapsed={collapsed}>
      <IconButton
        className="agd-appsidebar__toggle"
        label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        icon={<PanelLeftIcon />}
        aria-expanded={!collapsed}
        aria-controls={`${id}-content`}
        onClick={toggle}
      />
      <div id={`${id}-content`} className="agd-appsidebar__content" hidden={collapsed && typeof children !== "function"}>
        {content}
      </div>
    </aside>
  );
}
