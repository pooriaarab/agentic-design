import { useEffect, useId, useLayoutEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { MenuIcon } from "../icons.js";
import { IconButton } from "./button.js";

const NARROW = "(max-width: 47.99rem)";
const onNarrowChange = (callback: () => void) => {
  const query = window.matchMedia(NARROW);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
};

export type AppShellProps = {
  /** The product name, shown at the top of the sidebar. */
  brand: ReactNode;
  /** Usually a `SidebarNav`. */
  sidebar: ReactNode;
  /** Sits at the start of the top bar, for example a `DocumentTitle`. */
  title?: ReactNode;
  /** Actions on the right of the top bar. */
  topbar?: ReactNode;
  children: ReactNode;
} & (
  | { panel?: null | false; panelLabel?: string }
  /** A side panel after the content, for example comments or an assistant. Below 64rem it sits under the content. */
  | { panel: ReactNode; panelLabel: string }
);

/**
 * Sidebar, top bar, and content. The first tab stop is a skip link. Below 48rem the top bar comes first
 * in the page, the sidebar sits under it, and the sidebar hides behind a menu button. Opening it moves focus into the sidebar. Escape closes it and
 * returns focus to the button.
 */
export function AppShell({ brand, sidebar, title, topbar, panel, panelLabel, children }: AppShellProps) {
  // `panel={show && <Comments />}` gives false when hidden. Null and false mean no panel.
  const hasPanel = panel !== undefined && panel !== null && panel !== false;
  if (hasPanel && (panelLabel ?? "").trim() === "") throw new Error("A side panel needs a non-empty label.");
  const [open, setOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const openedByPerson = useRef(false);
  const sidebarId = useId();
  const mainId = useId();
  // Tab order must follow what is drawn. Wide: sidebar on the left, then the top bar. Narrow: the
  // top bar, then the sidebar under it. So the two swap places in the page with the layout.
  const narrow = useSyncExternalStore(onNarrowChange, () => window.matchMedia(NARROW).matches, () => false);
  // Moving a node in the page takes focus off it. Remember the focused element as the layout
  // changes, and give focus back once the parts have moved.
  const lastNarrow = useRef(narrow);
  // The browser may blur a link the moment its sidebar is hidden, before the layout change reaches
  // us. Keep that element, so focus is not lost with it.
  const hiddenFocus = useRef<Element | null>(null);
  const focused = useRef<Element | null>(null);
  if (narrow !== lastNarrow.current) {
    const active = document.activeElement;
    const hiddenFocusWas = hiddenFocus.current;
    focused.current = hiddenFocus.current ?? active;
    hiddenFocus.current = null;
    lastNarrow.current = narrow;
    // Narrow hides the sidebar until opened, so open it if focus sits inside, or focus would be lost.
    // Wide shows it always, so a stale `open` must not outlive the change.
    openedByPerson.current = false;
    setOpen(narrow && (!!hiddenFocusWas || !!sidebarRef.current?.contains(active)));
  }
  useLayoutEffect(() => {
    const el = focused.current;
    focused.current = null;
    if (el instanceof HTMLElement && el.isConnected && el !== document.activeElement && el !== document.body) el.focus();
  }, [narrow]);

  useEffect(() => {
    if (open && openedByPerson.current) sidebarRef.current?.querySelector<HTMLElement>("a")?.focus();
  }, [open]);

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key !== "Escape" || !open) return;
    // Escape inside a menu or dialog that opened from here is not for the sidebar.
    const target = event.target as Node;
    if (!sidebarRef.current?.contains(target) && !toggleRef.current?.contains(target)) return;
    setOpen(false);
    toggleRef.current?.focus();
  };

  const topbarEl = (
    <header key="topbar" className="ad-shell__topbar">
      <IconButton
        ref={toggleRef}
        className="ad-shell__menu"
        label="Navigation"
        icon={<MenuIcon />}
        aria-expanded={open}
        aria-controls={sidebarId}
        onClick={() => {
          openedByPerson.current = !open;
          setOpen((v) => !v);
        }}
      />
      {title !== undefined && title !== null && title !== false && <div className="ad-shell__title">{title}</div>}
      <div className="ad-shell__actions">{topbar}</div>
    </header>
  );
  const sidebarEl = (
    <div
      key="sidebar"
      id={sidebarId}
      ref={sidebarRef}
      className="ad-shell__sidebar"
      data-open={open}
      onBlur={(event) => {
        // Only a blur from the breakpoint counts: the layout is still wide here. A blur in a closed
        // narrow layout is a person's own choice and must not move focus later.
        if (!lastNarrow.current && !event.relatedTarget && sidebarRef.current && getComputedStyle(sidebarRef.current).display === "none") hiddenFocus.current = event.target;
      }}
      onFocus={() => { hiddenFocus.current = null; }}
    >
      <p className="ad-shell__brand">{brand}</p>
      {sidebar}
    </div>
  );

  return (
    <div className="ad-shell" data-panel={hasPanel ? "" : undefined} onKeyDown={onKeyDown}>
      <a className="ad-skip-link" href={`#${mainId}`}>Skip to content</a>
      {/* Keyed, so crossing the breakpoint moves the two parts and does not remount them. */}
      {narrow ? [topbarEl, sidebarEl] : [sidebarEl, topbarEl]}
      <main id={mainId} className="ad-shell__content" tabIndex={-1}>{children}</main>
      {hasPanel && <aside className="ad-shell__panel" aria-label={panelLabel}>{panel}</aside>}
    </div>
  );
}

export interface SidebarItem {
  href: string;
  label: string;
  icon?: ReactNode;
  current?: boolean;
}

export function SidebarNav({ label, items }: { label: string; items: SidebarItem[] }) {
  return (
    <nav aria-label={label}>
      <ul className="ad-sidebar-nav">
        {items.map((item) => (
          <li key={item.href}>
            <a className="ad-sidebar-nav__link" href={item.href} aria-current={item.current ? "page" : undefined}>
              {item.icon}
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
