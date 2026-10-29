/** The longest display name, in UTF-16 code units, that any surface accepts. */
export const MAX_NAME_LENGTH = 40;

// A closed set of ordinary text: letters, marks, digits, punctuation, symbols, and plain spaces,
// plus ZWJ and ZWNJ (emoji and Persian) and LRM and RLM (mixed-direction names).
// Controls, bidi overrides and isolates, zero-width space, line separators, tag characters,
// private-use and unassigned code points are outside it, so they fail by default.
const ORDINARY_TEXT = /^[\p{L}\p{M}\p{N}\p{P}\p{S}\p{Zs}\u200C-\u200F]*$/u;

// A character that draws something. Hangul fillers and the braille blank are letters or
// symbols that draw nothing, so a name made only of them would read as blank.
const VISIBLE = /(?![\p{Default_Ignorable_Code_Point}\u2800])[\p{L}\p{N}\p{P}\p{S}]/u;

// Characters that draw nothing, wherever they sit: Hangul fillers, the braille blank, variation selectors.
const FILLER = /[\p{Default_Ignorable_Code_Point}\u2800]/u;
const LEADING_MARK = /^[\p{M}\u200C-\u200F]/u;

// A letter with many combining marks draws far above and below its row and covers its neighbors.
const STACKED_MARKS = /\p{M}{5,}/u;

/**
 * The name when it is safe to show to other people, or `null`. A name comes from the peer that
 * claims it, and it is shown on other people's screens and read aloud to their screen readers.
 * The rule refuses and never repairs: a repaired name is still a name the claimant shaped.
 */
export function usableName(name: unknown): string | null {
  return usableText(name, MAX_NAME_LENGTH);
}

/** The same rule with your own length limit, for text such as a file name. */
export function usableText(text: unknown, maxLength: number): string | null {
  if (typeof text !== "string" || text.length > maxLength) return null;
  // Joiners and direction marks are allowed, but they must not split a stack of marks into short runs.
  const withoutJoiners = text.replace(/[\u200C-\u200F]/g, "");
  if (!ORDINARY_TEXT.test(text) || !VISIBLE.test(text) || STACKED_MARKS.test(withoutJoiners)) return null;
  // A filler anywhere makes a name that looks like another name. A leading mark has nothing to sit on.
  if (FILLER.test(withoutJoiners) || LEADING_MARK.test(text)) return null;
  return text;
}
