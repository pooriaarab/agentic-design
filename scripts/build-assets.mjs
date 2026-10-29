// Builds dist/tokens.css, dist/styles.css, dist/fonts, and the demo site in site/.
// The demo site is not part of the published package.
import { build } from "esbuild";
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { themeInitScript } from "../dist/index.js";
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
// Each page is the same shell with the saved theme applied before first paint. main.js picks the page from the path.
const html = readFileSync(src("demo/index.html"), "utf8").replace("<!--theme-init-->", `<script>${themeInitScript()}</script>`);
for (const name of ["index", "primitives"]) writeFileSync(site(`${name}.html`), html);
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

const MIT_BODY = `Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`;

// Licenses of the packages built into dist. MIT and similar licenses need their notice in every copy.
const metafile = new URL("../dist/metafile-esm.json", import.meta.url);
const bundled = new Set();
for (const input of Object.keys(JSON.parse(readFileSync(metafile, "utf8")).inputs)) {
  const found = /node_modules\/((?:@[^/]+\/)?[^/]+)/.exec(input);
  if (found) bundled.add(found[1]);
}
const sections = [...bundled].sort().map((name) => {
  const root = new URL(`../node_modules/${name}/`, import.meta.url);
  const pkg = JSON.parse(readFileSync(new URL("package.json", root), "utf8"));
  const file = readdirSync(root).find((f) => /^licen[cs]e/i.test(f));
  let text;
  if (file && existsSync(new URL(file, root))) {
    text = readFileSync(new URL(file, root), "utf8").trim();
  } else if (pkg.license === "MIT") {
    // A few MIT packages ship no license file. Use the standard MIT text with the holder their
    // package.json names, and say where it came from.
    const author = typeof pkg.author === "string" ? pkg.author.replace(/\s*[<(].*$/, "") : (pkg.author?.name ?? "");
    if (!author) throw new Error(`${name} is MIT but names no author, so no notice can be built`);
    text = `(This package ships no license file. Its package.json declares MIT and names the holder below.)\n\nMIT License\n\nCopyright (c) ${author}\n\n${MIT_BODY}`;
  } else {
    throw new Error(`${name} is bundled but has no license file`);
  }
  return `## ${name} ${pkg.version}\n\nLicense: ${pkg.license}\n\n${text}\n`;
});
writeFileSync(dist("THIRD_PARTY_LICENSES.md"), `# Licenses of bundled packages\n\nThese packages are built into dist/react.js.\n\n${sections.join("\n")}`);
rmSync(metafile);
