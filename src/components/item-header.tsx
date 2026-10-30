import type { ReactNode } from "react";
import { cx } from "../cx.js";
import { DocumentTitle } from "./document-title.js";
import { PresenceStack, type PresenceEntry } from "./presence.js";

export interface ItemHeaderProps {
  title: string;
  /** Omit to show a read-only title. Save and update title before the promise resolves. */
  onRename?: (title: string) => Promise<void>;
  backLink?: ReactNode;
  shareButton?: ReactNode;
  fileMenu?: ReactNode;
  presence?: PresenceEntry[];
  /** Maximum visible avatars. Invalid values use 4. */
  maxPresence?: number;
  className?: string;
}

/** Shared item chrome. Supply named, keyboard-accessible controls in each slot. */
export function ItemHeader({ title, onRename, backLink, shareButton, fileMenu, presence = [], maxPresence = 4, className }: ItemHeaderProps) {
  const max = Number.isFinite(maxPresence) ? Math.max(0, Math.floor(maxPresence)) : 4;
  return (
    <div className={cx("agd-item-header", className)}>
      {backLink}
      <div className="agd-item-header__title">
        <DocumentTitle value={title} label="Item title" onRename={onRename ?? (() => undefined)} readOnly={!onRename} />
      </div>
      {presence.length > 0 && <PresenceStack entries={presence} max={max} />}
      {shareButton}
      {fileMenu}
    </div>
  );
}
