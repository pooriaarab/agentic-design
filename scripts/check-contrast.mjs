// Fails when any text or background pair in either theme is below WCAG 2.2 AA.
// Usage: node scripts/check-contrast.mjs [themes.json]
// With a file, it checks those themes instead of the shipped ones. The file has the shape of
// `agentic-design tokens --format json`, or just its "themes" object.
import { readFileSync } from "node:fs";
import { checkContrast, checkThemes, contrastRatio } from "../dist/tokens.js";

// The instrument must see a pass and a fail before its verdict means anything.
const white = contrastRatio("#FFFFFF", "#000000");
const justUnder = contrastRatio("#777777", "#FFFFFF");
if (Math.abs(white - 21) > 0.01 || justUnder >= 4.5 || justUnder < 4.4) {
  console.error(`contrast math is broken: white/black ${white}, #777/white ${justUnder}`);
  process.exit(2);
}

const file = process.argv[2];
let results;
try {
  // A file argument means "check this file". Whatever it holds, it is never swapped for the shipped themes.
  const custom = file === undefined ? undefined : JSON.parse(readFileSync(file, "utf8"));
  results = file === undefined ? checkContrast() : checkThemes(custom?.themes ?? custom);
} catch (error) {
  console.error(`cannot check contrast: ${error.message}`);
  process.exit(2);
}
if (results.length === 0) {
  console.error("cannot check contrast: no pairs were checked");
  process.exit(2);
}
const failures = results.filter((r) => !r.pass);
for (const r of failures) {
  console.error(`FAIL ${r.theme}: ${r.fg} on ${r.bg} is ${r.ratio.toFixed(2)}, needs ${r.min} (${r.use})`);
}
console.log(`${results.length - failures.length} of ${results.length} pairs pass WCAG 2.2 AA.`);
process.exit(failures.length === 0 ? 0 : 1);
