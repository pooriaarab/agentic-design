import type { ReactElement } from "react";
import { createRoot } from "react-dom/client";
import { ToastProvider, TooltipProvider } from "../react.js";
import { ThemeProvider } from "../theme.js";
import { EditorPage } from "./editor-page.js";
import { PatternsPage } from "./patterns-page.js";
import { PrimitivesPage } from "./primitives-page.js";
import { TokensPage } from "./tokens-page.js";

const pages: Record<string, () => ReactElement> = {
  "/": TokensPage,
  "/primitives": PrimitivesPage,
  "/patterns": PatternsPage,
  "/editor": EditorPage,
};
// The Worker serves a page only for these paths. Any other path never reaches this script.
const Page = pages[window.location.pathname.replace(/\/$/, "") || "/"];

if (Page) {
  createRoot(document.getElementById("root") as HTMLElement).render(
    <ThemeProvider>
      <TooltipProvider>
        <ToastProvider>
          <Page />
        </ToastProvider>
      </TooltipProvider>
    </ThemeProvider>,
  );
}
