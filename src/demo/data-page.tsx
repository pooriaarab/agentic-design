import { useMemo, useState } from "react";
import {
  applyDataView,
  Button,
  DataTable,
  DataTableToolbar,
  DisplayPopover,
  EmptyState,
  emptyDataView,
  FilterChips,
  filterMenuItems,
  TableSearch,
  type DataField,
  type DataTableColumn,
  type DataView,
} from "../react.js";
import { DemoShell } from "./demo-shell.js";

interface Task {
  id: string;
  title: string;
  status: "Open" | "Done";
  owner: string;
}
const owners = ["Ada Lovelace", "Grace Hopper", "Linus"];
const makeTasks = (n: number): Task[] =>
  Array.from({ length: n }, (_, i) => ({ id: `t${i + 1}`, title: `Task ${i + 1}`, status: i % 3 === 0 ? "Done" : "Open", owner: owners[i % owners.length] as string }));

const columns: DataTableColumn<Task>[] = [
  { id: "title", header: "Title", cell: (t) => t.title },
  { id: "status", header: "Status", width: "8rem", cell: (t) => (t.status === "Done" ? "✓ Done" : "Open") },
  { id: "owner", header: "Owner", width: "12rem", cell: (t) => t.owner },
];

const fields: DataField<Task>[] = [
  { id: "title", label: "Title", value: (t) => t.title, groupable: false },
  { id: "status", label: "Status", value: (t) => t.status, filterable: true },
  { id: "owner", label: "Owner", value: (t) => t.owner, filterable: true },
];
const columnList = columns.map((c) => ({ id: c.id, label: c.header }));

export function DataPage() {
  const [size, setSize] = useState(10000);
  const [state, setState] = useState<"ready" | "loading">("ready");
  const all = useMemo(() => makeTasks(size), [size]);
  const [view, setView] = useState<DataView>(emptyDataView);
  const rows = useMemo(() => applyDataView(all, view, fields), [all, view]);
  const hidden = useMemo(() => new Set(view.hiddenColumns), [view.hiddenColumns]);
  const groupField = fields.find((f) => f.id === view.groupBy);
  const groupBy = useMemo(() => (groupField ? (t: Task) => String(groupField.value(t)) : undefined), [groupField]);
  const chips = view.filters.map((f) => ({ id: `${f.field}:${f.value}`, label: `${fields.find((x) => x.id === f.field)?.label}: ${f.value}` }));
  const addItems = useMemo(() => filterMenuItems(all, fields, view, setView), [all, view]);
  const [removed, setRemoved] = useState(0);
  const [opened, setOpened] = useState("none");
  return (
    <DemoShell title="Data table" description="Virtualized rows, keyboard navigation, bulk select, and loading and empty states.">
      <section aria-labelledby="demo-data-h" id="demo-data">
        <h2 id="demo-data-h">Tasks</h2>
        <div className="demo-cluster">
          <Button onClick={() => setSize(10000)}>10,000 rows</Button>
          <Button onClick={() => setSize(100)}>100 rows</Button>
          <Button onClick={() => setSize(0)}>Show empty</Button>
          <Button onClick={() => setState((s) => (s === "ready" ? "loading" : "ready"))}>{state === "ready" ? "Show loading" : "Show rows"}</Button>
        </div>
        <DataTable
          label="Tasks"
          toolbar={
            <DataTableToolbar
              end={<DisplayPopover fields={fields} columns={columnList} view={view} onViewChange={setView} defaults={emptyDataView} />}
            >
              <TableSearch value={view.query} onChange={(query) => setView({ ...view, query })} />
              <FilterChips chips={chips} addItems={addItems} onRemove={(id) => setView({ ...view, filters: view.filters.filter((f) => `${f.field}:${f.value}` !== id) })} />
            </DataTableToolbar>
          }
          rows={rows}
          groupBy={groupBy}
          hiddenColumns={hidden}
          empty={all.length > 0 ? <EmptyState title="No matches" description="No task fits the search and filters." action={<Button size="sm" onClick={() => setView({ ...view, query: "", filters: [] })}>Clear search and filters</Button>} /> : undefined}
          columns={columns}
          getRowId={(t) => t.id}
          rowLabel={(t) => t.title}
          loading={state === "loading"}
          onRowActivate={(t) => setOpened(t.title)}
          selectable
          bulkActions={(ids) => <Button size="sm" onClick={() => setRemoved(ids.size)}>Archive</Button>}
        />
        <p className="demo-muted demo-note">Archived: <span id="archived">{removed}</span>. Opened: <span id="opened">{opened}</span></p>
      </section>
    </DemoShell>
  );
}
