import { useEffect, useId, useLayoutEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { MenuIcon } from "../icons.js";
import { IconButton } from "./button.js";

const NARROW = "(max-width: 47.99rem)";
const onNarrowChange = (callback: () => void) => {
  const query = window.matchMedia(NARROW);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
};

export interface AppShellProps {
  /** The product name, shown at the top of the sidebar. */
  brand: ReactNode;
  /** Usually a `SidebarNav`. */
  sidebar: ReactNode;
  /** Actions on the right of the top bar. */
  topbar?: ReactNode;
  children: ReactNode;
}

/**
 * Sidebar, top bar, and content. The first tab stop is a skip link. Below 48rem the top bar comes first
 * in the page, the sidebar sits under it, and the sidebar hides behind a menu button. Opening it moves focus into the sidebar. Escape closes it and
 * returns focus to the button.
 */
export function AppShell({ brand, sidebar, topbar, children }: AppShellProps) {
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
  const focused = useRef<Element | null>(null);
  if (narrow !== lastNarrow.current) {
    focused.current = document.activeElement;
    lastNarrow.current = narrow;
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
      <div className="ad-shell__actions">{topbar}</div>
    </header>
  );
  const sidebarEl = (
    <div key="sidebar" id={sidebarId} ref={sidebarRef} className="ad-shell__sidebar" data-open={open}>
      <p className="ad-shell__brand">{brand}</p>
      {sidebar}
    </div>
  );

  return (
    <div className="ad-shell" onKeyDown={onKeyDown}>
      <a className="ad-skip-link" href={`#${mainId}`}>Skip to content</a>
      {/* Keyed, so crossing the breakpoint moves the two parts and does not remount them. */}
      {narrow ? [topbarEl, sidebarEl] : [sidebarEl, topbarEl]}
      <main id={mainId} className="ad-shell__content" tabIndex={-1}>{children}</main>
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
