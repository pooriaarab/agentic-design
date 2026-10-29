import { useMemo, useState, type ReactNode } from "react";
import { FileIcon, FolderIcon } from "../icons.js";
import { Select } from "./fields.js";
import { displayName, PresenceChip, type PresenceEntry } from "./presence.js";
import { usableText } from "./safe-name.js";

export function EmptyState({ title, description, action }: { title: string; description?: ReactNode; action?: ReactNode }) {
  return (
    <div className="ad-empty">
      <h2 className="ad-empty__title">{title}</h2>
      {description && <p className="ad-empty__description">{description}</p>}
      {action}
    </div>
  );
}

export type FileSortKey = "name" | "owner" | "modified";
export interface FileSort {
  key: FileSortKey;
  direction: "ascending" | "descending";
}

export interface FileItem {
  id: string;
  name: string;
  href: string;
  kind?: "file" | "folder";
  /** Who owns it. An agent shows as an agent. */
  owner: PresenceEntry;
  modified: Date;
  /** For example a menu button. */
  actions?: ReactNode;
}

export interface FileListItemsProps {
  /** Names the list for a screen reader. */
  label: string;
  items: FileItem[];
  view?: "table" | "grid";
  /** The sort when the list sorts itself. Pass `sort` and `onSortChange` to control it. */
  defaultSort?: FileSort;
  sort?: FileSort;
  /** Called when a person picks a sort. A list you control must sort `items` itself. */
  onSortChange?: (sort: FileSort) => void;
  /** Show placeholders in place of the items. */
  loading?: boolean;
  /** Shown when there are no items. */
  empty?: ReactNode;
  locale?: string;
}

const MAX_FILE_NAME = 200;
const columns: { key: FileSortKey; label: string }[] = [
  { key: "name", label: "Name" },
  { key: "owner", label: "Owner" },
  { key: "modified", label: "Modified" },
];

const shownName = (item: Pick<FileItem, "name">) => usableText(item.name, MAX_FILE_NAME) ?? "Untitled";
const validDate = (date: unknown): date is Date => date instanceof Date && !Number.isNaN(date.getTime());

function sorted(items: FileItem[], { key, direction }: FileSort, locale: string): FileItem[] {
  const collator = new Intl.Collator(locale, { numeric: true, sensitivity: "base" });
  const sign = direction === "ascending" ? 1 : -1;
  return [...items].sort((a, b) => {
    if (key === "modified") {
      // A date that is not valid sorts last in both directions, so it never leads the list.
      const [x, y] = [validDate(a.modified), validDate(b.modified)];
      if (x !== y) return x ? -1 : 1;
      if (x && y && a.modified.getTime() !== b.modified.getTime()) return sign * (a.modified.getTime() - b.modified.getTime());
    } else if (key === "owner") {
      const diff = collator.compare(displayName(a.owner), displayName(b.owner));
      if (diff !== 0) return sign * diff;
    } else {
      const diff = collator.compare(shownName(a), shownName(b));
      if (diff !== 0) return sign * diff;
    }
    return collator.compare(shownName(a), shownName(b));
  });
}

function formatted(date: Date, locale: string) {
  return validDate(date) ? (
    <time dateTime={date.toISOString()}>{date.toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" })}</time>
  ) : (
    <span>Date unknown</span>
  );
}

const ItemName = ({ item }: { item: FileItem }) => {
  const name = shownName(item);
  return (
    <>
      <span className="ad-file-row__icon" aria-hidden="true">{item.kind === "folder" ? <FolderIcon /> : <FileIcon />}</span>
      <a className="ad-file-row__name" href={item.href} title={name}>{name}</a>
    </>
  );
};

/**
 * A list of files, as a list of rows, or as a sortable table or grid. Pass `items` for the table
 * or grid. The table has column headers that sort, with `aria-sort` on the active one, and a
 * polite message when the sort changes. The grid has a "Sort by" select. `loading` shows
 * placeholders and says so to a screen reader. Pass `FileRow` children for the plain list.
 */
export function FileList(props: { label: string; children: ReactNode } | FileListItemsProps) {
  if (!("items" in props)) return <ul className="ad-files" aria-label={props.label}>{props.children}</ul>;
  return <FileItems {...props} />;
}

function FileItems({ label, items, view = "table", defaultSort = { key: "name", direction: "ascending" }, sort: sortProp, onSortChange, loading = false, empty, locale = "en" }: FileListItemsProps) {
  const [own, setOwn] = useState(defaultSort);
  const sort = sortProp ?? own;
  const rows = useMemo(() => (sortProp ? items : sorted(items, sort, locale)), [items, sort, sortProp, locale]);
  const [said, setSaid] = useState("");
  const choose = (next: FileSort) => {
    setOwn(next);
    setSaid(`Sorted by ${columns.find((c) => c.key === next.key)?.label.toLowerCase()}, ${next.direction}`);
    onSortChange?.(next);
  };
  const toggle = (key: FileSortKey) => choose({ key, direction: sort.key === key && sort.direction === "ascending" ? "descending" : "ascending" });
  const status = <p className="ad-sr-only" role="status">{loading ? "Loading files" : said}</p>;

  if (!loading && rows.length === 0) return <>{empty ?? <EmptyState title="No files" description="Nothing is here yet." />}</>;

  if (view === "grid") {
    return (
      <div className="ad-filegrid-wrap">
        <Select
          label="Sort by"
          value={`${sort.key}:${sort.direction}`}
          onChange={(event) => {
            const [key, direction] = event.target.value.split(":") as [FileSortKey, FileSort["direction"]];
            choose({ key, direction });
          }}
        >
          {columns.flatMap((c) => [
            <option key={`${c.key}:ascending`} value={`${c.key}:ascending`}>{c.label}, {c.key === "modified" ? "oldest first" : "A to Z"}</option>,
            <option key={`${c.key}:descending`} value={`${c.key}:descending`}>{c.label}, {c.key === "modified" ? "newest first" : "Z to A"}</option>,
          ])}
        </Select>
        {status}
        <ul className="ad-filegrid" aria-label={label} aria-busy={loading || undefined}>
          {loading
            ? [0, 1, 2, 3].map((i) => <li key={i} className="ad-filegrid__item ad-skeleton" aria-hidden="true" />)
            : rows.map((item) => (
                <li key={item.id} className="ad-filegrid__item">
                  <span className="ad-filegrid__head"><ItemName item={item} /></span>
                  <PresenceChip entry={item.owner} />
                  <span className="ad-file-row__time">{formatted(item.modified, locale)}</span>
                  {item.actions && <span className="ad-file-row__actions">{item.actions}</span>}
                </li>
              ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="ad-filetable-wrap">
      {status}
      <table className="ad-filetable" role="table" aria-busy={loading || undefined}>
        <caption className="ad-sr-only">{label}</caption>
        <thead role="rowgroup">
          <tr role="row">
            {columns.map((c) => {
              const active = sort.key === c.key;
              return (
                <th key={c.key} role="columnheader" scope="col" aria-sort={active ? sort.direction : undefined}>
                  <button type="button" className="ad-filetable__sort" onClick={() => toggle(c.key)}>
                    {c.label}
                    <span className="ad-filetable__arrow" aria-hidden="true">{active ? (sort.direction === "ascending" ? "\u2191" : "\u2193") : ""}</span>
                  </button>
                </th>
              );
            })}
            <th role="columnheader" scope="col"><span className="ad-sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody role="rowgroup">
          {loading
            ? [0, 1, 2, 3].map((i) => (
                <tr key={i} role="row" aria-hidden="true">
                  {[0, 1, 2, 3].map((j) => <td key={j} role="cell"><span className="ad-skeleton" /></td>)}
                </tr>
              ))
            : rows.map((item) => (
                <tr key={item.id} role="row">
                  <td role="cell" className="ad-filetable__name"><ItemName item={item} /></td>
                  <td role="cell"><PresenceChip entry={item.owner} /></td>
                  <td role="cell" className="ad-file-row__time">{formatted(item.modified, locale)}</td>
                  <td role="cell" className="ad-file-row__actions">{item.actions}</td>
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  );
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
  // A file name comes from a peer too. A name with a hidden direction character shows as untitled.
  const shownName = usableText(name, MAX_FILE_NAME) ?? "Untitled";
  const valid = modified instanceof Date && !Number.isNaN(modified.getTime());
  return (
    <li className="ad-file-row">
      <span className="ad-file-row__icon" aria-hidden="true">{kind === "folder" ? <FolderIcon /> : <FileIcon />}</span>
      <a className="ad-file-row__name" href={href} title={shownName}>{shownName}</a>
      <span className="ad-file-row__meta">
        Edited by <PresenceChip entry={editedBy} />
      </span>
      {valid ? (
        <time className="ad-file-row__time" dateTime={modified.toISOString()}>
          {modified.toLocaleDateString("en", { day: "numeric", month: "short", year: "numeric" })}
        </time>
      ) : (
        <span className="ad-file-row__time">Date unknown</span>
      )}
      {actions && <span className="ad-file-row__actions">{actions}</span>}
    </li>
  );
}
