// Builds dist/tokens.css and dist/styles.css, and copies the fonts.
import { copyFileSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tokensCss } from "../dist/tokens.js";

const read = (name) => readFileSync(new URL(`../src/styles/${name}`, import.meta.url), "utf8");
const dist = new URL("../dist/", import.meta.url);

const first = ["fonts.css", "base.css"];
const rest = readdirSync(new URL("../src/styles/", import.meta.url))
  .filter((name) => name.endsWith(".css") && !first.includes(name))
  .sort();

const tokens = tokensCss();
writeFileSync(new URL("tokens.css", dist), tokens);
writeFileSync(
  new URL("styles.css", dist),
  [read("fonts.css"), tokens, read("base.css"), ...rest.map(read)].join("\n"),
);

mkdirSync(new URL("fonts/", dist), { recursive: true });
for (const name of readdirSync(new URL("../src/fonts/", import.meta.url))) {
  copyFileSync(new URL(`../src/fonts/${name}`, import.meta.url), new URL(`fonts/${name}`, dist));
}
