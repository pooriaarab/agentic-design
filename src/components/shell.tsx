import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { MenuIcon } from "../icons.js";
import { IconButton } from "./button.js";

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
 * Sidebar, top bar, and content. The first tab stop is a skip link. Below 48rem the sidebar
 * hides behind a menu button. Opening it moves focus into the sidebar. Escape closes it and
 * returns focus to the button.
 */
export function AppShell({ brand, sidebar, topbar, children }: AppShellProps) {
  const [open, setOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const openedByPerson = useRef(false);
  const sidebarId = useId();
  const mainId = useId();

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

  return (
    <div className="ad-shell" onKeyDown={onKeyDown}>
      <a className="ad-skip-link" href={`#${mainId}`}>Skip to content</a>
      <div id={sidebarId} ref={sidebarRef} className="ad-shell__sidebar" data-open={open}>
        <p className="ad-shell__brand">{brand}</p>
        {sidebar}
      </div>
      <header className="ad-shell__topbar">
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
