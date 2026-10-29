import type { ReactNode } from "react";
import { FileIcon, FolderIcon } from "../icons.js";
import { PresenceChip, type PresenceEntry } from "./presence.js";

export function EmptyState({ title, description, action }: { title: string; description?: ReactNode; action?: ReactNode }) {
  return (
    <div className="ad-empty">
      <h2 className="ad-empty__title">{title}</h2>
      {description && <p className="ad-empty__description">{description}</p>}
      {action}
    </div>
  );
}

export function FileList({ label, children }: { label: string; children: ReactNode }) {
  return <ul className="ad-files" aria-label={label}>{children}</ul>;
}

export interface FileRowProps {
  name: string;
  href: string;
  kind?: "file" | "folder";
  modified: Date;
  /** Who made the last edit. An agent shows as an agent. */
  editedBy: PresenceEntry;
  /** For example a menu button. */
  actions?: ReactNode;
}

export function FileRow({ name, href, kind = "file", modified, editedBy, actions }: FileRowProps) {
  return (
    <li className="ad-file-row">
      <span className="ad-file-row__icon" aria-hidden="true">{kind === "folder" ? <FolderIcon /> : <FileIcon />}</span>
      <a className="ad-file-row__name" href={href}>{name}</a>
      <span className="ad-file-row__meta">
        Edited by <PresenceChip entry={editedBy} />
      </span>
      <time className="ad-file-row__time" dateTime={modified.toISOString()}>
        {modified.toLocaleDateString("en", { day: "numeric", month: "short", year: "numeric" })}
      </time>
      {actions && <span className="ad-file-row__actions">{actions}</span>}
    </li>
  );
}
