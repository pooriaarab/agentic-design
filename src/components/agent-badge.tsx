import { cx } from "../cx.js";
import { Avatar, displayName } from "./presence.js";
import { usableName } from "./safe-name.js";

export interface AgentBadgeProps {
  /** The agent. A name that fails the allow-list shows as "Unnamed agent". Leave it out to show the label alone. */
  name?: string;
  /** The person the agent acts for. Shown as "unknown" when missing. */
  actingFor?: string;
  /** The visible words. Say what the agent did, in your language, for example "Edited by an agent". Say "agent" in it. */
  label?: string;
  /** Show only the square avatar. The same facts move into its accessible name. */
  compact?: boolean;
  className?: string;
}

/**
 * A visible marker for anything an agent made: a draft, an edit, a comment, a cell. The words
 * "Made by an agent", a square avatar, and who the agent acts for are text, so color is never the
 * only signal. With `compact` there is room for the avatar only, and the facts sit in its name.
 */
export function AgentBadge({ name, actingFor, label = "Made by an agent", compact = false, className }: AgentBadgeProps) {
  if (label.trim() === "") throw new Error("An agent badge needs a non-empty label.");
  const agent = displayName({ name: name ?? "", kind: "agent" });
  const who = name === undefined ? null : agent;
  const owner = actingFor === undefined ? "unknown" : (usableName(actingFor) ?? "Unnamed person");
  const entry = { id: "agent-badge", name: agent, kind: "agent" as const };
  const sentence = `${label}${who ? `: ${who}` : ""}, acting for ${owner}`;
  if (compact) {
    return (
      <span className={cx("ad-agent-badge ad-agent-badge--compact", className)} title={sentence}>
        <Avatar entry={entry} label={sentence} />
      </span>
    );
  }
  return (
    <span className={cx("ad-agent-badge", className)}>
      <Avatar entry={entry} />
      <span className="ad-agent-badge__label">{label}</span>
      <span className="ad-agent-badge__meta">
        {who && `${who}, `}for {owner}
      </span>
    </span>
  );
}
