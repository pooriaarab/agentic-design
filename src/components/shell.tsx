import { useId, useState, type ReactNode } from "react";
import { cx } from "../cx.js";
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
 * hides behind a menu button, and Escape closes it.
 */
export function AppShell({ brand, sidebar, topbar, children }: AppShellProps) {
  const [open, setOpen] = useState(false);
  const sidebarId = useId();
  const mainId = useId();
  return (
    <div className="ad-shell" onKeyDown={(e) => e.key === "Escape" && open && setOpen(false)}>
      <a className="ad-skip-link" href={`#${mainId}`}>Skip to content</a>
      <aside id={sidebarId} className="ad-shell__sidebar" data-open={open}>
        <p className="ad-shell__brand">{brand}</p>
        {sidebar}
      </aside>
      <div className="ad-shell__body">
        <header className="ad-shell__topbar">
          <IconButton
            className="ad-shell__menu"
            label="Navigation"
            icon={<MenuIcon />}
            aria-expanded={open}
            aria-controls={sidebarId}
            onClick={() => setOpen((v) => !v)}
          />
          <div className="ad-shell__actions">{topbar}</div>
        </header>
        <main id={mainId} className="ad-shell__content" tabIndex={-1}>{children}</main>
      </div>
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
            <a
              className={cx("ad-sidebar-nav__link")}
              href={item.href}
              aria-current={item.current ? "page" : undefined}
            >
              {item.icon}
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
