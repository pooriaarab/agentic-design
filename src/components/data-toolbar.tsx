import * as RadixPopover from "@radix-ui/react-popover";
import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { CloseIcon, PlusIcon, SearchIcon, SlidersIcon } from "../icons.js";
import { Button, IconButton } from "./button.js";
import { fieldText, sameDisplay, type DataField, type DataView } from "./data-view.js";
import { Checkbox, Select } from "./fields.js";
import { Menu, type MenuItem } from "./overlays.js";

/** A row of controls above a `DataTable`. Put `TableSearch` and `FilterChips` in it, and `DisplayPopover` in `end`. */
export function DataTableToolbar({ label = "Table controls", children, end }: { label?: string; children?: ReactNode; end?: ReactNode }) {
  return (
    <div className="agd-datatoolbar" role="group" aria-label={label}>
      <div className="agd-datatoolbar__start">{children}</div>
      {end && <div className="agd-datatoolbar__end">{end}</div>}
    </div>
  );
}

/**
 * A search that is a button until you need it. The button opens a field and moves focus into it.
 * Escape clears the text, and Escape again closes the field. A field with text stays open.
 */
export function TableSearch({ value, onChange, label = "Search" }: { value: string; onChange: (value: string) => void; label?: string }) {
  if (label.trim() === "") throw new Error("A search needs a non-empty label.");
  const [open, setOpen] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const expanded = open || value !== "";
  const wasOpen = useRef(false);
  const giveBack = useRef(false);
  useEffect(() => {
    // Focus moves with the control: into the field on open, back to the button after Escape closes it.
    if (expanded && !wasOpen.current && open) input.current?.focus();
    wasOpen.current = expanded;
  }, [expanded, open]);
  useLayoutEffect(() => {
    if (!expanded && giveBack.current) {
      giveBack.current = false;
      button.current?.focus();
    }
  }, [expanded]);
  // The text can be cleared from outside while the field has no focus. Then close it.
  useEffect(() => {
    if (value === "" && open && document.activeElement !== input.current) setOpen(false);
  }, [value, open]);
  if (!expanded) {
    return <IconButton ref={button} label={label} icon={<SearchIcon />} size="sm" onClick={() => setOpen(true)} />;
  }
  return (
    <div className="agd-tablesearch" role="search" aria-label={label}>
      <SearchIcon className="agd-tablesearch__icon" />
      <input
        ref={input}
        type="search"
        className="agd-input agd-tablesearch__input"
        aria-label={label}
        autoComplete="off"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          if (value === "") setOpen(false);
        }}
        onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          if (value !== "") return onChange("");
          giveBack.current = true;
          setOpen(false);
        }}
      />
    </div>
  );
}

export interface FilterChip {
  id: string;
  /** For example "Status: Open". The text is the signal, so it must say both parts. */
  label: string;
}

/** The filters in use, each one removable, and an optional menu to add another. */
export function FilterChips({ chips, onRemove, addItems, addLabel = "Add filter" }: { chips: readonly FilterChip[]; onRemove: (id: string) => void; addItems?: MenuItem[]; addLabel?: string }) {
  const root = useRef<HTMLDivElement>(null);
  const chipKey = chips.map((c) => c.id).join("\n");
  const removed = useRef<{ index: number; id: string } | null>(null);
  // The remove button leaves with its chip. Give focus to the next chip, the one before it, or the add button.
  useLayoutEffect(() => {
    if (removed.current === null) return;
    const { index: at, id } = removed.current;
    removed.current = null;
    // A parent can refuse a removal. Then the chip is still here, and focus stays where it is.
    if (chips.some((c) => c.id === id)) return;
    const buttons = root.current?.querySelectorAll<HTMLElement>(".agd-filterchip__remove");
    (buttons && buttons.length > 0 ? buttons[Math.min(at, buttons.length - 1)] : root.current?.querySelector<HTMLElement>(".agd-filterchips__add") ?? root.current)?.focus();
  }, [chipKey]);
  // A removal the parent refused leaves nothing to act on. Forget it after the next commit.
  useEffect(() => {
    removed.current = null;
  });
  return (
    <div className="agd-filterchips" ref={root} tabIndex={-1}>
      {chips.length > 0 && (
        <ul className="agd-filterchips__list" aria-label="Active filters">
          {chips.map((chip, index) => (
            <li key={chip.id} className="agd-filterchip">
              <span className="agd-filterchip__label">{chip.label}</span>
              <IconButton label={`Remove filter ${chip.label}`} icon={<CloseIcon />} size="sm" tooltip={false} className="agd-filterchip__remove" onClick={() => { removed.current = { index, id: chip.id }; onRemove(chip.id); }} />
            </li>
          ))}
        </ul>
      )}
      {/* One trigger stays in the page, so focus has a place to return when the last value is used. */}
      {addItems && (
        <Menu
          align="start"
          trigger={<Button size="sm" variant="ghost" className="agd-filterchips__add"><PlusIcon />{addLabel}</Button>}
          items={addItems.length > 0 ? addItems : [{ label: "No more filters", onSelect: () => undefined, disabled: true }]}
        />
      )}
    </div>
  );
}

/**
 * Menu items that add a filter for each value a filterable field takes in `rows`, except the ones already in use.
 * It offers the first `limit` values it meets in row order, not the most common ones. For a field with many
 * values, build the menu yourself.
 */
export function filterMenuItems<T>(rows: readonly T[], fields: readonly DataField<T>[], view: DataView, onViewChange: (view: DataView) => void, limit = 12): MenuItem[] {
  const items: MenuItem[] = [];
  for (const field of fields) {
    if (!field.filterable) continue;
    const seen = new Set<string>();
    for (const row of rows) {
      const value = fieldText(field, row);
      if (value === "" || seen.has(value) || view.filters.some((f) => f.field === field.id && f.value === value)) continue;
      seen.add(value);
      if (seen.size >= limit) break;
    }
    const values = [...seen].sort(new Intl.Collator("en", { numeric: true }).compare);
    if (values.length === 0) continue;
    if (items.length > 0) items.push("separator");
    for (const value of values) {
      items.push({ label: `${field.label}: ${value}`, onSelect: () => onViewChange({ ...view, filters: [...view.filters, { field: field.id, value }] }) });
    }
  }
  return items;
}

export interface DisplayPopoverProps<T> {
  /** Fields to group and order by. */
  fields: readonly DataField<T>[];
  /** Columns to show or hide. At least one stays shown. */
  columns: readonly { id: string; label: string }[];
  view: DataView;
  onViewChange: (view: DataView) => void;
  /** What "Reset to defaults" sets back. */
  defaults: DataView;
}

/** A button that opens a panel to group, order, and pick columns, with a reset. Escape closes it and returns focus to the button. */
export function DisplayPopover<T>({ fields, columns, view, onViewChange, defaults }: DisplayPopoverProps<T>) {
  const id = useId();
  const pristine = sameDisplay(view, defaults);
  const hidden = new Set(view.hiddenColumns);
  const shown = columns.filter((c) => !hidden.has(c.id)).length;
  return (
    <RadixPopover.Root>
      <RadixPopover.Trigger asChild>
        <Button size="sm" variant="ghost"><SlidersIcon />Display</Button>
      </RadixPopover.Trigger>
      <RadixPopover.Portal>
        <RadixPopover.Content className="agd-popover agd-display" align="end" sideOffset={6} aria-label="Display options">
          <Select label="Group by" value={view.groupBy ?? ""} onChange={(event) => onViewChange({ ...view, groupBy: event.target.value || null })}>
            <option value="">No grouping</option>
            {fields.filter((f) => f.groupable !== false).map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
          </Select>
          <div className="agd-display__order">
            <Select label="Order by" value={view.orderBy ?? ""} onChange={(event) => onViewChange({ ...view, orderBy: event.target.value || null })}>
              <option value="">Original order</option>
              {fields.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
            </Select>
            <Select label="Direction" value={view.direction} disabled={view.orderBy === null && view.groupBy === null} onChange={(event) => onViewChange({ ...view, direction: event.target.value as DataView["direction"] })}>
              <option value="ascending">Ascending</option>
              <option value="descending">Descending</option>
            </Select>
          </div>
          <fieldset className="agd-display__columns" aria-describedby={`${id}-cols`}>
            <legend>Columns</legend>
            <p id={`${id}-cols`} className="agd-sr-only">At least one column stays shown.</p>
            {columns.map((c) => {
              const on = !hidden.has(c.id);
              return (
                <Checkbox
                  key={c.id}
                  label={c.label}
                  checked={on}
                  disabled={on && shown === 1}
                  onChange={() => onViewChange({ ...view, hiddenColumns: on ? [...view.hiddenColumns, c.id] : view.hiddenColumns.filter((h) => h !== c.id) })}
                />
              );
            })}
          </fieldset>
          <Button size="sm" aria-disabled={pristine} onClick={() => !pristine && onViewChange({ ...view, groupBy: defaults.groupBy, orderBy: defaults.orderBy, direction: defaults.direction, hiddenColumns: defaults.hiddenColumns })}>
            Reset to defaults
          </Button>
        </RadixPopover.Content>
      </RadixPopover.Portal>
    </RadixPopover.Root>
  );
}
