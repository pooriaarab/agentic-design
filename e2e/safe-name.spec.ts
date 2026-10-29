import { expect, test } from "@playwright/test";
import { usableName } from "../dist/react.js";

// Written before the code. Each case is a way a hostile name can fool a reader.
const refused: [string, unknown][] = [
  ["not a string", 42],
  ["null", null],
  ["empty", ""],
  ["only spaces", "   "],
  ["over 40 code units", "a".repeat(41)],
  ["bidi override (hides the real order)", "Ada‮evil"],
  ["bidi isolate", "Ada⁦x⁩"],
  ["zero-width space", "Ada​x"],
  ["control character", "Ada\u0007"],
  ["line separator", "Ada x"],
  ["newline", "Ada\nBob"],
  ["Hangul filler only (draws nothing)", "ㅤㅤ"],
  ["braille blank only (draws nothing)", "⠀"],
  ["hidden tag characters", "Ada\u{E0041}\u{E0042}"],
  ["lone surrogate", "Ada\uD800"],
  ["private use", "Ada"],
];
const accepted: [string, string][] = [
  ["plain", "Ada Lovelace"],
  ["accents", "Zoë Müller"],
  ["Persian with ZWNJ", "می‌خواهم"],
  ["emoji with ZWJ", "Sam 👩‍💻"],
  ["Han characters", "山田太郎"],
  ["punctuation", "O'Brien (ops) #2"],
  ["exactly 40", "a".repeat(40)],
];

for (const [why, value] of refused) {
  test(`refuses a name: ${why}`, () => expect(usableName(value)).toBeNull());
}
for (const [why, value] of accepted) {
  test(`keeps a name: ${why}`, () => expect(usableName(value)).toBe(value));
}
