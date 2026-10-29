import { expect, test } from "@playwright/test";
import { usableName } from "../dist/react.js";

// Each case is a way a hostile name can fool a reader.
const refused: [string, unknown][] = [
  ["not a string", 42],
  ["null", null],
  ["empty", ""],
  ["only spaces", "   "],
  ["over 40 code units", "a".repeat(41)],
  ["bidi override (hides the real order)", "Ada\u202Eevil"],
  ["bidi isolate", "Ada\u2066x\u2069"],
  ["zero-width space", "Ada\u200Bx"],
  ["control character", "Ada\u0007"],
  ["line separator", "Ada\u2028x"],
  ["newline", "Ada\nBob"],
  ["Hangul filler only (draws nothing)", "\u3164\u3164"],
  ["a name with a trailing Hangul filler (reads as the same name)", "Ada Lovelace\u3164"],
  ["a name with a trailing braille blank (reads as the same name)", "Ada Lovelace\u2800"],
  ["a name with a filler in the middle", "Ada\u115FLovelace"],
  ["a name with a variation selector", "Ada\uFE0F"],
  ["a name that starts with a direction mark (empty avatar)", "\u200EAda"],
  ["a trailing direction mark (the same name twice)", "Ada Lovelace\u200E"],
  ["a trailing joiner (the same name twice)", "Ada Lovelace\u200D"],
  ["repeated direction marks", "Ada Lovelace\u200F\u200F\u200F"],
  ["a trailing space", "Ada Lovelace "],
  ["a leading space", " Ada Lovelace"],
  ["a trailing no-break space", "Ada Lovelace\u00A0"],
  ["an ideographic space between words", "Ada\u3000Lovelace"],
  ["two spaces in a row", "Ada  Lovelace"],
  ["a name that starts with a combining mark (floating accent)", "\u0301Ada"],
  ["braille blank only (draws nothing)", "\u2800"],
  ["hidden tag characters", "Ada\u{E0041}\u{E0042}"],
  ["lone surrogate", "Ada\uD800"],
  ["private use", "Ada\uE000"],
  ["a stack of combining marks (draws far outside its row)", `a${"\u0301".repeat(8)}`],
  ["combining marks split by joiners so no run is long", `a${("\u0301".repeat(4) + "\u200C").repeat(7)}`],
  ["combining marks split by direction marks", `a${("\u0301".repeat(4) + "\u200E").repeat(7)}`],
];
const accepted: [string, string][] = [
  ["plain", "Ada Lovelace"],
  ["accents", "Zoë Müller"],
  ["Persian with ZWNJ", "می\u200Cخواهم"],
  ["emoji with ZWJ", "Sam 👩\u200D💻"],
  ["Han characters", "山田太郎"],
  ["punctuation", "O'Brien (ops) #2"],
  ["exactly 40", "a".repeat(40)],
  ["a few combining marks", `e${"\u0301".repeat(4)}`],
];

for (const [why, value] of refused) {
  test(`refuses a name: ${why}`, () => expect(usableName(value)).toBeNull());
}
for (const [why, value] of accepted) {
  test(`keeps a name: ${why}`, () => expect(usableName(value)).toBe(value));
}
