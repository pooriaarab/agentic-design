import { createRoot } from "react-dom/client";
import { ThemeProvider } from "../theme.js";
import { TokensPage } from "./tokens-page.js";

createRoot(document.getElementById("root") as HTMLElement).render(
  <ThemeProvider>
    <TokensPage />
  </ThemeProvider>,
);
