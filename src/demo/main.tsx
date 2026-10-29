import type { ReactElement } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "../theme.js";
import { PrimitivesPage } from "./primitives-page.js";
import { TokensPage } from "./tokens-page.js";

const pages: Record<string, () => ReactElement> = {
  "/": TokensPage,
  "/primitives": PrimitivesPage,
};
// The Worker serves a page only for these paths. Any other path never reaches this script.
const Page = pages[window.location.pathname.replace(/\/$/, "") || "/"];

if (Page) {
  createRoot(document.getElementById("root") as HTMLElement).render(
    <ThemeProvider>
      <Page />
    </ThemeProvider>,
  );
}
