import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import { cx } from "../cx.js";
import { Button } from "./button.js";
import { EmptyState } from "./files.js";
import { scrollToRow, windowRange } from "./virtual-window.js";

export interface DataTableColumn<T> {
  /** A stable key for the column. */
  id: string;
  /** The column name. Always text, so a screen reader can read it. */
  header: string;
  cell: (row: T) => ReactNode;
  /** A CSS length, for example `12rem`. The default shares the rest of the width, and is never under 8rem. */
  width?: string;
}

export interface DataTableProps<T> {
  /** Names the table for a screen reader. */
  label: string;
  rows: readonly T[];
  columns: readonly DataTableColumn<T>[];
  getRowId: (row: T) => string;
  /** The name of a row for its checkbox, for example the title. The default is the row id. */
  rowLabel?: (row: T) => string;
  /** Row height in pixels. Rows have one height, so any number of rows stays smooth. */
  rowHeight?: number;
  /** Height of the scroll area. */
  height?: number | string;
  /** Show placeholder rows and tell a screen reader. */
  loading?: boolean;
  /** Shown when there are no rows. */
  empty?: ReactNode;
  /** Add a checkbox column, select-all, and the bulk actions bar. */
  selectable?: boolean;
  selected?: ReadonlySet<string>;
  defaultSelected?: ReadonlySet<string>;
  onSelectedChange?: (selected: ReadonlySet<string>) => void;
  /** Buttons for the bar at the bottom. It gets the selected ids and shows while any row is selected. */
  bulkActions?: (selected: ReadonlySet<string>) => ReactNode;
  /** Called on Enter or double click on a row. */
  onRowActivate?: (row: T) => void;
  /** Shown above the grid, for example a `DataTableToolbar`. */
  toolbar?: ReactNode;
}

const CHECK_WIDTH = "2.75rem";
const FLEX_MIN = "8rem";
const BAR_GAP = 12;
const PLACEHOLDERS = 8;
const noRows: readonly never[] = [];

/**
 * A table for many rows. Only the rows in view are in the page, so 10,000 rows scroll smoothly.
 * It is a grid. The rows are one tab stop, and arrow keys, Home, End, and Page Up and Down move between them.
 * Space selects a row, Shift with a click or Space selects a range, Enter opens a row, and Escape clears the selection.
 */
export function DataTable<T>({
  label, rows, columns, getRowId, rowLabel, rowHeight = 40, height = "28rem", loading = false, empty,
  selectable = false, selected: selectedProp, defaultSelected, onSelectedChange, bulkActions, onRowActivate, toolbar,
}: DataTableProps<T>) {
  if (label.trim() === "") throw new Error("A data table needs a non-empty label.");
  const [own, setOwn] = useState<ReadonlySet<string>>(defaultSelected ?? new Set());
  const stored = selectedProp ?? own;
  const setSelected = useCallback((next: ReadonlySet<string>) => {
    setOwn(next);
    onSelectedChange?.(next);
  }, [onSelectedChange]);

  const items = loading ? noRows : rows;
  const count = items.length;
  const scroller = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewport, setViewport] = useState(480);
  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const measure = () => setViewport(el.clientHeight);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Callers often pass an inline getRowId. Keep it in a ref, so a scroll does not read every row again.
  const idOf = useRef(getRowId);
  idOf.current = getRowId;
  const ids = useMemo(() => items.map((row) => idOf.current(row)), [items]);
  // A selection can outlive its rows, for example after a filter. Only rows that are here count.
  const selected = useMemo(() => {
    const live = new Set<string>();
    for (const id of ids) if (stored.has(id)) live.add(id);
    return live as ReadonlySet<string>;
  }, [ids, stored]);
  const allSelected = count > 0 && selected.size === count;
  const someSelected = selected.size > 0 && !allSelected;
  const [activeRaw, setActive] = useState(0);
  const active = Math.min(activeRaw, Math.max(0, count - 1));
  const wantFocus = useRef(false);
  const anchor = useRef(0);
  const barVisible = selectable && selected.size > 0 && !loading;
  const [barSize, setBarSize] = useState(0);
  const barHeight = barVisible ? barSize + BAR_GAP : 0;
  const bar = useRef<HTMLDivElement>(null);
  // The bar grows when its buttons wrap, so watch its size.
  useLayoutEffect(() => {
    const el = bar.current;
    if (!el) return;
    const measure = () => setBarSize(el.offsetHeight);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [barVisible]);

  const range = windowRange(scrollTop, viewport, rowHeight, count);
  // The row that has focus stays drawn when it scrolls out of view, so focus is not lost.
  const indexes: number[] = [];
  for (let i = range.start; i < range.end; i++) indexes.push(i);
  if (count > 0 && (active < range.start || active >= range.end)) indexes.push(active);

  useLayoutEffect(() => {
    if (!wantFocus.current) return;
    wantFocus.current = false;
    const el = scroller.current;
    if (!el) return;
    const next = scrollToRow(active, el.scrollTop, el.clientHeight, rowHeight, rowHeight, barHeight);
    if (next !== el.scrollTop) el.scrollTop = next;
    el.querySelector<HTMLElement>(`[data-index="${active}"]`)?.focus({ preventScroll: true });
  });

  // The bar covers the last rows while it shows. Keep the active row clear of it, and give focus back to the grid when the bar and its focused button go.
  const barWas = useRef(false);
  useLayoutEffect(() => {
    const el = scroller.current;
    if (barVisible && el) {
      const next = scrollToRow(active, el.scrollTop, el.clientHeight, rowHeight, rowHeight, barHeight);
      if (next !== el.scrollTop) el.scrollTop = next;
    }
    if (barWas.current && !barVisible && count > 0 && (!document.activeElement || document.activeElement === document.body)) {
      el?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.focus({ preventScroll: true });
    }
    barWas.current = barVisible;
  }, [barVisible, barHeight]); // eslint-disable-line react-hooks/exhaustive-deps
  const headerCheck = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (headerCheck.current) headerCheck.current.indeterminate = someSelected;
  }, [someSelected]);

  const toggle = (index: number, withRange: boolean) => {
    const next = new Set(selected);
    if (withRange) {
      const [from, to] = [Math.min(anchor.current, index), Math.max(anchor.current, index)];
      const on = !selected.has(ids[index] as string);
      for (let i = from; i <= to; i++) on ? next.add(ids[i] as string) : next.delete(ids[i] as string);
    } else {
      const id = ids[index] as string;
      next.has(id) ? next.delete(id) : next.add(id);
      anchor.current = index;
    }
    setSelected(next);
  };

  const move = (to: number) => {
    wantFocus.current = true;
    setActive(Math.max(0, Math.min(count - 1, to)));
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    const row = target.closest<HTMLElement>('[role="row"][data-index]');
    if (!row || count === 0) return;
    // A text field, select, or editable cell keeps its own keys.
    if (target.isContentEditable || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) return;
    if (target instanceof HTMLInputElement && target.type !== "checkbox") return;
    const index = Number(row.dataset.index);
    const page = Math.max(1, Math.floor((viewport - rowHeight) / rowHeight) - 1);
    const onRow = target === row;
    switch (event.key) {
      case "ArrowDown": move(index + 1); break;
      case "ArrowUp": move(index - 1); break;
      case "PageDown": move(index + page); break;
      case "PageUp": move(index - page); break;
      case "Home": move(0); break;
      case "End": move(count - 1); break;
      case " ":
        if (!onRow || !selectable) return;
        toggle(index, event.shiftKey);
        break;
      case "Enter":
        if (!onRow || !onRowActivate) return;
        onRowActivate(items[index] as T);
        break;
      case "Escape":
        if (selected.size === 0) return;
        setSelected(new Set());
        break;
      default: return;
    }
    event.preventDefault();
  };

  const tracks = [selectable ? CHECK_WIDTH : null, ...columns.map((c) => c.width ?? `minmax(${FLEX_MIN}, 1fr)`)].filter(Boolean).join(" ");
  // The head and every row share one width. It is the sum of the minimums, so a narrow screen scrolls sideways.
  const minWidth = `calc(${[selectable ? CHECK_WIDTH : null, ...columns.map((c) => c.width ?? FLEX_MIN)].filter(Boolean).join(" + ")})`;
  const style = { "--agd-dt-cols": tracks, "--agd-dt-min": minWidth, "--agd-dt-row": `${rowHeight}px`, "--agd-dt-height": typeof height === "number" ? `${height}px` : height } as CSSProperties;
  const nameOf = (row: T) => rowLabel?.(row) ?? getRowId(row);
  const status = loading ? "Loading rows" : selectable && selected.size > 0 ? `${selected.size} of ${count} selected` : "";

  return (
    <div className="agd-datatable" style={style}>
      {toolbar}
      <p className="agd-sr-only" role="status">{status}</p>
      <div className="agd-datatable__frame">
        <div
          ref={scroller}
          className="agd-datatable__scroller"
          role="grid"
          aria-label={label}
          aria-rowcount={count + 1}
          aria-colcount={columns.length + (selectable ? 1 : 0)}
          aria-multiselectable={selectable || undefined}
          aria-busy={loading || undefined}
          onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
          onKeyDown={onKeyDown}
        >
          <div role="presentation" className="agd-datatable__inner">
          <div role="rowgroup" className="agd-datatable__head">
            <div role="row" className="agd-datatable__row" aria-rowindex={1}>
              {selectable && (
                <div role="columnheader" className="agd-datatable__cell agd-datatable__cell--check">
                  <input
                    ref={headerCheck}
                    type="checkbox"
                    className="agd-checkbox"
                    aria-label={`Select all ${count} rows`}
                    checked={allSelected}
                    disabled={count === 0}
                    onChange={() => setSelected(allSelected ? new Set() : new Set(ids))}
                  />
                </div>
              )}
              {columns.map((c) => <div key={c.id} role="columnheader" className="agd-datatable__cell">{c.header}</div>)}
            </div>
          </div>
          <div role="rowgroup" className="agd-datatable__body" style={{ height: (loading ? PLACEHOLDERS : count) * rowHeight + barHeight }}>
            {loading
              ? Array.from({ length: PLACEHOLDERS }, (_, i) => (
                  <div key={i} role="row" className="agd-datatable__row" style={{ top: i * rowHeight }} aria-hidden="true">
                    {[...(selectable ? [0] : []), ...columns.map((_c, j) => j + 1)].map((j) => (
                      <div key={j} role="gridcell" className="agd-datatable__cell"><span className="agd-skeleton" /></div>
                    ))}
                  </div>
                ))
              : indexes.map((i) => {
                  const row = items[i] as T;
                  const id = ids[i] as string;
                  const isSelected = selected.has(id);
                  return (
                    <div
                      key={id}
                      role="row"
                      data-index={i}
                      className={cx("agd-datatable__row", "agd-datatable__row--body", isSelected && "is-selected")}
                      style={{ top: i * rowHeight }}
                      aria-rowindex={i + 2}
                      aria-selected={selectable ? isSelected : undefined}
                      tabIndex={i === active ? 0 : -1}
                      onFocus={() => setActive(i)}
                      onDoubleClick={onRowActivate ? () => onRowActivate(row) : undefined}
                    >
                      {selectable && (
                        <div role="gridcell" className="agd-datatable__cell agd-datatable__cell--check">
                          <input
                            type="checkbox"
                            className="agd-checkbox"
                            tabIndex={-1}
                            aria-label={`Select ${nameOf(row)}`}
                            checked={isSelected}
                            onChange={() => undefined}
                            onClick={(event) => toggle(i, event.shiftKey)}
                          />
                        </div>
                      )}
                      {columns.map((c) => <div key={c.id} role="gridcell" className="agd-datatable__cell">{c.cell(row)}</div>)}
                    </div>
                  );
                })}
          </div>
          </div>
        </div>
        {!loading && count === 0 && <div className="agd-datatable__state">{empty ?? <EmptyState title="No rows" description="Nothing is here yet." />}</div>}
        {barVisible && (
          <div ref={bar} role="region" aria-label="Bulk actions" className="agd-datatable__bar">
            <span className="agd-datatable__bar-count" aria-hidden="true">{selected.size} selected</span>
            <div className="agd-datatable__bar-actions">{bulkActions?.(selected)}</div>
            <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Clear selection</Button>
          </div>
        )}
      </div>
    </div>
  );
}
