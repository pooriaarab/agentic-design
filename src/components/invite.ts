export type Invitee = { kind: "person"; to: string } | { kind: "agent"; to: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HANDLE = /^@[a-z0-9][a-z0-9_-]{1,31}$/i;

/**
 * Read what a person typed in the invite field. An email is a person. An `@handle` is an agent.
 * Anything else is refused, so the invite never goes to a guessed target.
 */
export function parseInvitee(text: string): Invitee | null {
  const value = text.trim();
  if (value.length === 0 || value.length > 254) return null;
  if (HANDLE.test(value)) return { kind: "agent", to: value };
  if (!value.startsWith("@") && EMAIL.test(value)) return { kind: "person", to: value };
  return null;
}
