// Builds dist/tokens.css, dist/styles.css, dist/fonts, and the demo site in site/.
// The demo site is not part of the published package.
import { build } from "esbuild";
import { copyFileSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { themeInitScript } from "../dist/react.js";
import { tokensCss } from "../dist/tokens.js";

const src = (path) => new URL(`../src/${path}`, import.meta.url);
const dist = (path) => new URL(`../dist/${path}`, import.meta.url);
const site = (path) => new URL(`../site/${path}`, import.meta.url);
const read = (name) => readFileSync(src(`styles/${name}`), "utf8");

const first = ["fonts.css", "base.css"];
const rest = readdirSync(src("styles/"))
  .filter((name) => name.endsWith(".css") && !first.includes(name))
  .sort();

const tokens = tokensCss();
writeFileSync(dist("tokens.css"), tokens);
const styles = [read("fonts.css"), tokens, read("base.css"), ...rest.map(read)].join("\n");
writeFileSync(dist("styles.css"), styles);

mkdirSync(dist("fonts/"), { recursive: true });
for (const name of readdirSync(src("fonts/"))) copyFileSync(src(`fonts/${name}`), dist(`fonts/${name}`));

// The demo site is what the Worker serves. It has the same fonts and styles.
mkdirSync(site("fonts/"), { recursive: true });
writeFileSync(site("styles.css"), styles);
for (const name of readdirSync(src("fonts/"))) copyFileSync(src(`fonts/${name}`), site(`fonts/${name}`));
// Each page is the same shell with the saved theme applied before first paint.
const html = readFileSync(src("demo/index.html"), "utf8").replace("<!--theme-init-->", `<script>${themeInitScript()}</script>`);
writeFileSync(site("index.html"), html);
copyFileSync(src("demo/demo.css"), site("demo.css"));
await build({
  entryPoints: [fileURLToPath(src("demo/main.tsx"))],
  outfile: fileURLToPath(site("main.js")),
  bundle: true,
  format: "esm",
  minify: true,
  jsx: "automatic",
  define: { "process.env.NODE_ENV": '"production"' },
  logLevel: "warning",
});
