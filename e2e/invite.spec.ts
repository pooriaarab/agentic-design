import { expect, test } from "@playwright/test";
import { parseInvitee } from "../dist/index.js";

// Each case is a way an invite could go to the wrong target.
const refused: [string, string][] = [
  ["empty", ""],
  ["only spaces", "   "],
  ["a name, not an address", "ada"],
  ["email with no domain", "ada@"],
  ["email with no dot in the domain", "ada@example"],
  ["email with a space", "ada @example.org"],
  ["a bare at sign", "@"],
  ["a one-character handle", "@a"],
  ["a doubled at sign", "@@claude"],
  ["a handle with a space", "@ada lovelace"],
  ["a handle that is also an email", "@ada@example.org"],
  ["a handle with an emoji", "@🙂🙂"],
  ["a handle over 32 characters", `@${"a".repeat(33)}`],
  ["an address over 254 characters", `${"a".repeat(250)}@x.org`],
  ["a newline inside", "ada@exa\nmple.org"],
  ["a zero-width space in the address", "ada\u200B@example.org"],
  ["a right-to-left override in the address", "ada\u202E@example.org"],
  ["a non-ASCII letter in the address", "ad\u00E9@example.org"],
  ["a non-ASCII letter in the domain", "ada@ex\u00E4mple.org"],
  ["a zero-width space in a handle", "@clau\u200Bde"],
];

for (const [why, value] of refused) {
  test(`refuses an invite target: ${why}`, () => expect(parseInvitee(value)).toBeNull());
}

test("an email is a person", () => {
  expect(parseInvitee("ada@example.org")).toEqual({ kind: "person", to: "ada@example.org" });
});
test("an @handle is an agent", () => {
  expect(parseInvitee("@claude")).toEqual({ kind: "agent", to: "@claude" });
  expect(parseInvitee("@review-bot_2")).toEqual({ kind: "agent", to: "@review-bot_2" });
});
test("surrounding space is trimmed", () => {
  expect(parseInvitee("  Ada@Example.org ")).toEqual({ kind: "person", to: "Ada@Example.org" });
});
