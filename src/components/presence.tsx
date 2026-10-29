import { useLayoutEffect, useRef } from "react";
import { cx } from "../cx.js";
import { BotIcon } from "../icons.js";
import { usableName } from "./safe-name.js";

export type PresenceKind = "person" | "agent";
export type PresenceStatus = "active" | "away" | "paused";

export interface PresenceEntry {
  id: string;
  /** Peer-supplied. It passes an allow-list, and a name that fails shows as "Unnamed". */
  name: string;
  kind: PresenceKind;
  /** The person an agent acts for. */
  actingFor?: string;
  status?: PresenceStatus;
}

const statusLabel = { active: "", away: "Away", paused: "Paused" } as const;

// Entries come from other peers. Anything that is not "person" is shown as an agent, so a
// malformed kind never hides the word Agent. An unknown status shows no status word.
const kindOf = (entry: Pick<PresenceEntry, "kind">): PresenceKind => (entry.kind === "person" ? "person" : "agent");
// An own-key check, so "constructor" or "toString" from a peer is not read as a status.
const statusOf = (entry: Pick<PresenceEntry, "status">): string =>
  typeof entry.status === "string" && Object.hasOwn(statusLabel, entry.status) ? statusLabel[entry.status] : "";

export function displayName(entry: Pick<PresenceEntry, "name" | "kind">): string {
  return usableName(entry.name) ?? (kindOf(entry) === "agent" ? "Unnamed agent" : "Unnamed person");
}

function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const picked = words.length > 1 ? [words[0], words[words.length - 1]] : [words[0] ?? ""];
  return picked.map((w) => Array.from(w).find((c) => /[\p{L}\p{N}]/u.test(c))?.toUpperCase() ?? "").join("");
}

/**
 * A person is a circle with initials. An agent is a rounded square with a robot glyph.
 * The shape differs, so the difference never rests on color.
 */
export function Avatar({ entry, label }: { entry: PresenceEntry; label?: string }) {
  return (
    <span
      className={cx("agd-avatar", `agd-avatar--${kindOf(entry)}`)}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {kindOf(entry) === "agent" ? <BotIcon aria-hidden="true" /> : initials(displayName(entry))}
    </span>
  );
}

/** One sentence for a screen reader, built from the fields. It never trusts the peer's own words. */
function describe(entry: PresenceEntry): string {
  const agent = kindOf(entry) === "agent";
  const actingFor = entry.actingFor === undefined ? null : (usableName(entry.actingFor) ?? "Unnamed person");
  return [
    displayName(entry),
    agent ? "agent" : "person",
    agent && `acting for ${actingFor ?? "an unknown person"}`,
    statusOf(entry).toLowerCase(),
  ]
    .filter(Boolean)
    .join(", ");
}

/**
 * A name with its avatar. An agent always carries the word "Agent" in a hairline pill, and the
 * person it acts for, or "unknown" when none is given. Away and Paused are words too. Order:
 * identity, then state. The visible parts are hidden from assistive technology, and one
 * sentence built by `describe` replaces them, so a person who names themselves "Agent" is
 * still read as a person.
 */
export function PresenceChip({ entry, className }: { entry: PresenceEntry; className?: string }) {
  const name = displayName(entry);
  const status = statusOf(entry);
  const agent = kindOf(entry) === "agent";
  const actingFor = entry.actingFor === undefined ? null : (usableName(entry.actingFor) ?? "Unnamed person");
  return (
    <span className={cx("agd-chip", className)}>
      <Avatar entry={entry} />
      <span className="agd-chip__name" title={name} aria-hidden="true">{name}</span>
      {agent && (
        <span className="agd-pill" aria-hidden="true" title={actingFor ? `An agent acting for ${actingFor}.` : "An agent, not a person."}>
          Agent
        </span>
      )}
      {agent && <span className="agd-chip__meta" aria-hidden="true">for {actingFor ?? "unknown"}</span>}
      {status && <span className="agd-chip__meta" aria-hidden="true">{status}</span>}
      <span className="agd-sr-only">{describe(entry)}</span>
    </span>
  );
}

function summary(entries: PresenceEntry[]): string {
  const agents = entries.filter((e) => kindOf(e) === "agent").length;
  const people = entries.length - agents;
  const part = (n: number, one: string, many: string) => (n === 0 ? [] : [`${n} ${n === 1 ? one : many}`]);
  return [...part(people, "person", "people"), ...part(agents, "agent", "agents")].join(", ");
}

/** Overlapping avatars for a toolbar, with a visible count in words. */
export function PresenceStack({ entries, max = 4, label = "Here now" }: { entries: PresenceEntry[]; max?: number; label?: string }) {
  const shown = entries.slice(0, max);
  const hidden = entries.length - shown.length;
  return (
    <div className="agd-stack">
      <ul className="agd-stack__list" aria-label={label}>
        {shown.map((entry) => {
          const text = describe(entry);
          return (
            <li key={entry.id} title={text}>
              <Avatar entry={entry} label={text} />
            </li>
          );
        })}
        {hidden > 0 && (
          <li>
            <span className="agd-avatar agd-avatar--more" role="img" aria-label={`${hidden} more`}>+{hidden}</span>
          </li>
        )}
      </ul>
      {entries.length > 0 && <span className="agd-stack__summary">{summary(entries)}</span>}
    </div>
  );
}

/**
 * A remote cursor inside text: a caret and a name tag. A person's tag is accent-filled.
 * An agent's tag is outlined, square, and carries the word "Agent". The cursor is a visual aid
 * only. The roster and the stack carry the same facts for assistive technology.
 */
export function PresenceCursor({ entry }: { entry: PresenceEntry }) {
  const name = displayName(entry);
  const tagRef = useRef<HTMLSpanElement>(null);
  // A tag near an edge of the screen would be cut off, and the name and the word Agent with it.
  // Shift it back inside. Measure with no shift, so the result does not depend on the last one.
  const place = useRef(() => {});
  place.current = () => {
    const tag = tagRef.current;
    if (!tag) return;
    tag.style.removeProperty("--agd-cursor-shift");
    // The page width without a scrollbar. The stylesheet's 100vw counts the scrollbar.
    tag.style.maxInlineSize = `${document.documentElement.clientWidth - 16}px`;
    const box = tag.getBoundingClientRect();
    const rtl = getComputedStyle(tag).direction === "rtl";
    const edge = document.documentElement.clientWidth - 8;
    let dx = box.right > edge ? edge - box.right : 0;
    if (box.left + dx < 8) dx = box.width > edge - 8 ? (rtl ? edge - box.right : 8 - box.left) : 8 - box.left;
    // The offset is from the start side, so it points the other way in a right-to-left page.
    if (dx !== 0) tag.style.setProperty("--agd-cursor-shift", `${Math.round(rtl ? -dx : dx)}px`);
  };
  useLayoutEffect(() => place.current());
  useLayoutEffect(() => {
    // Text moves when a font loads or the page reflows, and the tag moves with it.
    const run = () => place.current();
    const watch = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(run);
    watch?.observe(document.body);
    void document.fonts?.ready.then(run);
    window.addEventListener("resize", run);
    return () => {
      watch?.disconnect();
      window.removeEventListener("resize", run);
    };
  }, []);
  return (
    <span className={cx("agd-cursor", `agd-cursor--${kindOf(entry)}`)} contentEditable={false} aria-hidden="true">
      <span className="agd-cursor__caret" />
      <span ref={tagRef} className="agd-cursor__tag">
        {name}
        {kindOf(entry) === "agent" && ` · Agent · for ${entry.actingFor === undefined ? "unknown" : (usableName(entry.actingFor) ?? "Unnamed person")}`}
      </span>
    </span>
  );
}
