import type { ReactElement } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "../theme.js";
import { PrimitivesPage } from "./primitives-page.js";
import { TokensPage } from "./tokens-page.js";

const pages: Record<string, () => ReactElement> = {
  "/": TokensPage,
  "/primitives": PrimitivesPage,
};
const Page = pages[window.location.pathname.replace(/\/$/, "") || "/"] ?? TokensPage;

createRoot(document.getElementById("root") as HTMLElement).render(
  <ThemeProvider>
    <Page />
  </ThemeProvider>,
);
