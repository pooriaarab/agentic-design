import type { ReactNode } from "react";
import { Select } from "../components/index.js";
import { useTheme, type ThemePreference } from "../theme.js";

const pages = [
  ["/", "Tokens"],
  ["/primitives", "Primitives"],
] as const;

export function DemoShell({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  const { preference, setPreference } = useTheme();
  const path = window.location.pathname.replace(/\/$/, "") || "/";
  return (
    <>
      <a className="ad-skip-link" href="#main">Skip to content</a>
      <header className="demo-header">
        <div>
          <h1>{title}</h1>
          <p className="demo-muted">{description}</p>
          <nav aria-label="Demo pages">
            <ul className="demo-nav">
              {pages.map(([href, name]) => (
                <li key={href}>
                  <a href={href} aria-current={href === path ? "page" : undefined}>{name}</a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <Select label="Theme" value={preference} onChange={(e) => setPreference(e.target.value as ThemePreference)}>
          <option value="system">System</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </Select>
      </header>
      <main id="main" className="demo-main">{children}</main>
    </>
  );
}
