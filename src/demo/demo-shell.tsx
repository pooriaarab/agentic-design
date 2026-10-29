import type { ReactNode } from "react";
import { AppShell, Select, SidebarNav } from "../react.js";
import { useTheme, type ThemePreference } from "../theme.js";

const pages = [
  ["/", "Tokens"],
  ["/primitives", "Primitives"],
  ["/patterns", "Patterns"],
  ["/editor", "Editor"],
  ["/chrome", "App chrome"],
] as const;

export function DemoShell({ title, description, actions, panel, children }: { title: string; description: string; actions?: ReactNode; panel?: ReactNode; children: ReactNode }) {
  const { preference, setPreference } = useTheme();
  const panelProps: { panel?: undefined; panelLabel?: undefined } | { panel: ReactNode; panelLabel: string } = panel === undefined ? {} : { panel, panelLabel: "Notes" };
  const path = window.location.pathname.replace(/\/$/, "") || "/";
  return (
    <AppShell
      {...panelProps}
      brand="agentic-design"
      sidebar={<SidebarNav label="Demo pages" items={pages.map(([href, label]) => ({ href, label, current: href === path }))} />}
      topbar={
        <>
          {actions}
          <Select label="Theme" hideLabel value={preference} onChange={(e) => setPreference(e.target.value as ThemePreference)}>
            <option value="system">Theme: System</option>
            <option value="light">Theme: Light</option>
            <option value="dark">Theme: Dark</option>
          </Select>
        </>
      }
    >
      <div className="demo-main">
        <div>
          <h1>{title}</h1>
          <p className="demo-muted">{description}</p>
        </div>
        {children}
      </div>
    </AppShell>
  );
}
