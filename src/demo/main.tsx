import type { ReactElement } from "react";
import { createRoot } from "react-dom/client";
import { ToastProvider } from "../react.js";
import { ThemeProvider } from "../theme.js";
import { PatternsPage } from "./patterns-page.js";
import { PrimitivesPage } from "./primitives-page.js";
import { TokensPage } from "./tokens-page.js";

const pages: Record<string, () => ReactElement> = {
  "/": TokensPage,
  "/primitives": PrimitivesPage,
  "/patterns": PatternsPage,
};
const Page = pages[window.location.pathname.replace(/\/$/, "") || "/"] ?? (() => <p>Page not found.</p>);

createRoot(document.getElementById("root") as HTMLElement).render(
  <ThemeProvider>
    <ToastProvider>
      <Page />
    </ToastProvider>
  </ThemeProvider>,
);
