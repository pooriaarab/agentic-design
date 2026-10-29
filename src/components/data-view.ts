/** One column of data that a view can search, filter, group, and order by. */
export interface DataField<T> {
  id: string;
  label: string;
  value: (row: T) => string | number | Date | null | undefined;
  /** Offer this field in the filter menu. */
  filterable?: boolean;
  /** Offer this field in "Group by". On by default. */
  groupable?: boolean;
}

export interface DataFilter {
  field: string;
  value: string;
}

export interface DataView {
  query: string;
  /** Values of one field add up (any may match). Different fields narrow each other. */
  filters: readonly DataFilter[];
  groupBy: string | null;
  orderBy: string | null;
  direction: "ascending" | "descending";
  hiddenColumns: readonly string[];
}

export const emptyDataView: DataView = Object.freeze({ query: "", filters: [], groupBy: null, orderBy: null, direction: "ascending", hiddenColumns: [] });

const missing = (value: unknown): boolean => value == null || value === "" || (typeof value === "number" && !Number.isFinite(value)) || (value instanceof Date && Number.isNaN(value.getTime()));
const pad = (n: number) => String(n).padStart(2, "0");
// A date reads as the day on the person's clock, the same as a cell that shows it.
const text = (value: ReturnType<DataField<never>["value"]>): string =>
  missing(value) ? "" : value instanceof Date ? `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}` : String(value);

/** The display parts of a view (not the search or the filters) match those of another view. */
export function sameDisplay(a: DataView, b: DataView): boolean {
  return a.groupBy === b.groupBy && a.orderBy === b.orderBy && a.direction === b.direction && a.hiddenColumns.length === b.hiddenColumns.length && a.hiddenColumns.every((id) => b.hiddenColumns.includes(id));
}

/** The text of a field for a row, as a filter sees it. */
export const fieldText = <T,>(field: DataField<T>, row: T): string => text(field.value(row));

/**
 * Search, filter, order, and group rows. It returns a new array, in group order when `groupBy` is set,
 * so it can go straight into a `DataTable` with a `groupBy` that reads the same field. Groups run in text
 * order. `direction` flips the groups when there is no `orderBy`, and the rows inside them when there is.
 * A field id that is not in `fields` is ignored.
 */
export function applyDataView<T>(rows: readonly T[], view: DataView, fields: readonly DataField<T>[], locale = "en"): T[] {
  const byId = new Map(fields.map((f) => [f.id, f]));
  const terms = view.query.toLocaleLowerCase(locale).split(/\s+/).filter(Boolean);
  const wanted = new Map<string, Set<string>>();
  for (const { field, value } of view.filters) {
    if (!byId.has(field)) continue;
    (wanted.get(field) ?? wanted.set(field, new Set()).get(field))?.add(value);
  }
  const kept = rows.filter((row) => {
    for (const [id, values] of wanted) if (!values.has(fieldText(byId.get(id) as DataField<T>, row))) return false;
    if (terms.length === 0) return true;
    const haystack = fields.map((f) => fieldText(f, row)).join("\n").toLocaleLowerCase(locale);
    return terms.every((term) => haystack.includes(term));
  });
  const order = view.orderBy ? byId.get(view.orderBy) : undefined;
  const group = view.groupBy ? byId.get(view.groupBy) : undefined;
  if (!order && !group) return kept;
  const collator = new Intl.Collator(locale, { numeric: true, sensitivity: "base" });
  const sign = view.direction === "ascending" ? 1 : -1;
  const compare = (field: DataField<T>, a: T, b: T): number => {
    const [x, y] = [field.value(a), field.value(b)];
    // A missing value sorts last in both directions.
    const [xe, ye] = [missing(x), missing(y)];
    if (xe || ye) return xe === ye ? 0 : xe ? 1 : -1;
    if (typeof x === "number" && typeof y === "number") return sign * (x - y);
    if (x instanceof Date && y instanceof Date) return sign * (x.getTime() - y.getTime());
    return sign * collator.compare(text(x), text(y));
  };
  // Groups are told apart by exact text. The collator ignores case and accents, and equal groups must never split.
  const groupSign = order ? 1 : sign;
  const compareGroup = (a: T, b: T): number => {
    if (!group) return 0;
    const [x, y] = [fieldText(group, a), fieldText(group, b)];
    return groupSign * (collator.compare(x, y) || (x < y ? -1 : x > y ? 1 : 0));
  };
  return kept
    .map((row, index) => ({ row, index }))
    .sort((a, b) => compareGroup(a.row, b.row) || (order ? compare(order, a.row, b.row) : 0) || a.index - b.index)
    .map((entry) => entry.row);
}
