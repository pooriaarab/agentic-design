// Builds dist/tokens.css, dist/styles.css, dist/fonts, and the demo site in dist/demo.
import { build } from "esbuild";
import { copyFileSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tokensCss } from "../dist/tokens.js";

const src = (path) => new URL(`../src/${path}`, import.meta.url);
const dist = (path) => new URL(`../dist/${path}`, import.meta.url);
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
mkdirSync(dist("demo/"), { recursive: true });
writeFileSync(dist("demo/styles.css"), styles);
mkdirSync(dist("demo/fonts/"), { recursive: true });
for (const name of readdirSync(src("fonts/"))) copyFileSync(src(`fonts/${name}`), dist(`demo/fonts/${name}`));
// Each page is the same shell. main.js picks the page from the path.
for (const name of ["index", "primitives"]) copyFileSync(src("demo/index.html"), dist(`demo/${name}.html`));
copyFileSync(src("demo/demo.css"), dist("demo/demo.css"));
await build({
  entryPoints: [src("demo/main.tsx").pathname],
  outfile: dist("demo/main.js").pathname,
  bundle: true,
  format: "esm",
  minify: true,
  jsx: "automatic",
  define: { "process.env.NODE_ENV": '"production"' },
  logLevel: "warning",
});
