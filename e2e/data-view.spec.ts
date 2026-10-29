import { expect, test } from "@playwright/test";
import { applyDataView, emptyDataView, sameDisplay, type DataField } from "../src/components/data-view.js";

interface Row {
  name: string;
  status: string;
  n: number | null;
  when: Date | null;
}
const rows: Row[] = [
  { name: "Écrire le plan", status: "Open", n: 10, when: new Date("2026-03-01") },
  { name: "Task 2", status: "Done", n: 2, when: new Date("2026-01-01") },
  { name: "Task 10", status: "Open", n: null, when: null },
  { name: "task 1", status: "Done", n: 7, when: new Date("2026-02-01") },
];
const fields: DataField<Row>[] = [
  { id: "name", label: "Name", value: (r) => r.name },
  { id: "status", label: "Status", value: (r) => r.status, filterable: true },
  { id: "n", label: "Count", value: (r) => r.n },
  { id: "when", label: "When", value: (r) => r.when },
];
const names = (view: Partial<typeof emptyDataView>) => applyDataView(rows, { ...emptyDataView, ...view }, fields).map((r) => r.name);

// Ways the view can fail: odd text, many terms, filters that add up or narrow, missing values, unknown ids, stability.
test("search ignores case and needs every word", () => {
  expect(names({ query: "TASK" })).toEqual(["Task 2", "Task 10", "task 1"]);
  expect(names({ query: "task open" })).toEqual(["Task 10"]);
  expect(names({ query: "   " })).toHaveLength(4);
  expect(names({ query: "2026-03" })).toEqual(["Écrire le plan"]);
});

test("filters add up inside a field and narrow across fields", () => {
  expect(names({ filters: [{ field: "status", value: "Open" }, { field: "status", value: "Done" }] })).toHaveLength(4);
  expect(names({ filters: [{ field: "status", value: "Done" }], query: "2026-01" })).toEqual(["Task 2"]);
  expect(names({ filters: [{ field: "status", value: "Nothing" }] })).toEqual([]);
});

test("a field id that does not exist is ignored", () => {
  expect(names({ filters: [{ field: "gone", value: "x" }], orderBy: "gone", groupBy: "gone" })).toHaveLength(4);
});

test("order sorts numbers, dates, and text, with missing values last in both directions", () => {
  expect(names({ orderBy: "n" })).toEqual(["Task 2", "task 1", "Écrire le plan", "Task 10"]);
  expect(names({ orderBy: "n", direction: "descending" })).toEqual(["Écrire le plan", "task 1", "Task 2", "Task 10"]);
  expect(names({ orderBy: "when" })).toEqual(["Task 2", "task 1", "Écrire le plan", "Task 10"]);
  // Text uses a numeric collator, so "Task 2" comes before "Task 10".
  expect(names({ orderBy: "name" })).toEqual(["Écrire le plan", "task 1", "Task 2", "Task 10"]);
});

test("grouping puts a group together, orders inside it, and keeps ties stable", () => {
  expect(names({ groupBy: "status", orderBy: "n" })).toEqual(["Task 2", "task 1", "Écrire le plan", "Task 10"]);
  expect(names({ groupBy: "status" })).toEqual(["Task 2", "task 1", "Écrire le plan", "Task 10"]);
});

test("the input rows are not changed", () => {
  const copy = [...rows];
  applyDataView(rows, { ...emptyDataView, orderBy: "n" }, fields);
  expect(rows).toEqual(copy);
});

test("sameDisplay ignores the search and the filters", () => {
  expect(sameDisplay({ ...emptyDataView, query: "x", filters: [{ field: "a", value: "b" }] }, emptyDataView)).toBe(true);
  expect(sameDisplay({ ...emptyDataView, hiddenColumns: ["a"] }, emptyDataView)).toBe(false);
  expect(sameDisplay({ ...emptyDataView, hiddenColumns: ["a", "b"] }, { ...emptyDataView, hiddenColumns: ["b", "a"] })).toBe(true);
});
