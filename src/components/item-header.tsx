import type { ReactNode } from "react";
import { cx } from "../cx.js";
import { DocumentTitle } from "./document-title.js";
import { PresenceStack, type PresenceEntry } from "./presence.js";
import { usableText } from "./safe-name.js";

export interface ItemHeaderProps {
  title: string;
  /** Omit for a read-only title. Update title before resolving; use a timeout so the promise settles. */
  onRename?: (title: string) => Promise<void>;
  /** Heading level for the item title. Defaults to 1. */
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  backLink?: ReactNode;
  shareButton?: ReactNode;
  fileMenu?: ReactNode;
  presence?: PresenceEntry[];
  /** Maximum visible avatars. Invalid values use 4. */
  maxPresence?: number;
  className?: string;
}

/** Shared item chrome. Supply named, keyboard-accessible controls in each slot. */
export function ItemHeader({ title, onRename, headingLevel = 1, backLink, shareButton, fileMenu, presence = [], maxPresence = 4, className }: ItemHeaderProps) {
  const max = Number.isFinite(maxPresence) ? Math.max(0, Math.floor(maxPresence)) : 4;
  const level = Number.isInteger(headingLevel) && headingLevel >= 1 && headingLevel <= 6 ? headingLevel : 1;
  const shown = usableText(title, Math.max(120, typeof title === "string" ? title.length : 0)) ?? "Untitled";
  return (
    <div className={cx("agd-item-header", className)}>
      {backLink}
      <div className="agd-item-header__title" role="heading" aria-level={level} aria-label={shown}>
        <DocumentTitle value={title} label="Item title" onRename={onRename ?? (() => undefined)} readOnly={!onRename} />
      </div>
      {presence.length > 0 && <PresenceStack entries={presence} max={max} />}
      {shareButton}
      {fileMenu}
    </div>
  );
}
