import type { ReactElement } from "react";
import { createRoot } from "react-dom/client";
import { ToastProvider, TooltipProvider } from "../react.js";
import { ThemeProvider } from "../theme.js";
import { PatternsPage } from "./patterns-page.js";
import { DemoShell } from "./demo-shell.js";
import { PrimitivesPage } from "./primitives-page.js";
import { TokensPage } from "./tokens-page.js";

const pages: Record<string, () => ReactElement> = {
  "/": TokensPage,
  "/primitives": PrimitivesPage,
  "/patterns": PatternsPage,
};
const Page = pages[window.location.pathname.replace(/\/$/, "") || "/"] ?? (() => (
    <DemoShell title="Page not found" description="This demo has no page at that address.">
      <p>Choose a page from the sidebar.</p>
    </DemoShell>
  ));

createRoot(document.getElementById("root") as HTMLElement).render(
  <ThemeProvider>
    <TooltipProvider>
      <ToastProvider>
        <Page />
      </ToastProvider>
    </TooltipProvider>
  </ThemeProvider>,
);
