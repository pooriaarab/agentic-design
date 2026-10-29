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

function displayName(entry: Pick<PresenceEntry, "name" | "kind">): string {
  return usableName(entry.name) ?? (entry.kind === "agent" ? "Unnamed agent" : "Unnamed person");
}

function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const picked = words.length > 1 ? [words[0], words[words.length - 1]] : [words[0] ?? ""];
  return picked.map((w) => Array.from(w)[0]?.toUpperCase() ?? "").join("");
}

/**
 * A person is a circle with initials. An agent is a rounded square with a robot glyph.
 * The shape differs, so the difference never rests on color.
 */
export function Avatar({ entry, label }: { entry: PresenceEntry; label?: string }) {
  return (
    <span
      className={cx("ad-avatar", `ad-avatar--${entry.kind}`)}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {entry.kind === "agent" ? <BotIcon aria-hidden="true" /> : initials(displayName(entry))}
    </span>
  );
}

/**
 * A name with its avatar. An agent always carries the word "Agent" in a hairline pill,
 * and the person it acts for. Away and Paused are words too. Order: identity, then state.
 */
export function PresenceChip({ entry, className }: { entry: PresenceEntry; className?: string }) {
  const name = displayName(entry);
  const status = statusLabel[entry.status ?? "active"];
  // A name that fails the check still shows who the agent acts for, as unnamed.
  const actingFor = entry.actingFor === undefined ? null : (usableName(entry.actingFor) ?? "Unnamed person");
  return (
    <span className={cx("ad-chip", className)}>
      <Avatar entry={entry} />
      <span className="ad-chip__name" title={name}>{name}</span>
      {entry.kind === "agent" && (
        <span
          className="ad-pill"
          title={actingFor ? `An agent acting for ${actingFor}.` : "An agent, not a person."}
        >
          Agent
        </span>
      )}
      {entry.kind === "agent" && actingFor && <span className="ad-chip__meta">for {actingFor}</span>}
      {status && <span className="ad-chip__meta">{status}</span>}
    </span>
  );
}

function summary(entries: PresenceEntry[]): string {
  const agents = entries.filter((e) => e.kind === "agent").length;
  const people = entries.length - agents;
  const part = (n: number, one: string, many: string) => (n === 0 ? [] : [`${n} ${n === 1 ? one : many}`]);
  return [...part(people, "person", "people"), ...part(agents, "agent", "agents")].join(", ");
}

/** Overlapping avatars for a toolbar, with a visible count in words. */
export function PresenceStack({ entries, max = 4, label = "Here now" }: { entries: PresenceEntry[]; max?: number; label?: string }) {
  const shown = entries.slice(0, max);
  const hidden = entries.length - shown.length;
  return (
    <div className="ad-stack">
      <ul className="ad-stack__list" aria-label={label}>
        {shown.map((entry) => {
          const status = statusLabel[entry.status ?? "active"];
          const text = [displayName(entry), entry.kind === "agent" && "agent", status.toLowerCase()].filter(Boolean).join(", ");
          return (
            <li key={entry.id} title={text}>
              <Avatar entry={entry} label={text} />
            </li>
          );
        })}
        {hidden > 0 && (
          <li>
            <span className="ad-avatar ad-avatar--more" role="img" aria-label={`${hidden} more`}>+{hidden}</span>
          </li>
        )}
      </ul>
      {entries.length > 0 && <span className="ad-stack__summary">{summary(entries)}</span>}
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
  return (
    <span className={cx("ad-cursor", `ad-cursor--${entry.kind}`)} contentEditable={false} aria-hidden="true">
      <span className="ad-cursor__caret" />
      <span className="ad-cursor__tag">
        {name}
        {entry.kind === "agent" && " · Agent"}
      </span>
    </span>
  );
}
