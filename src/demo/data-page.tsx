import { useMemo, useState } from "react";
import { Button, DataTable, type DataTableColumn } from "../react.js";
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

export function DataPage() {
  const [size, setSize] = useState(10000);
  const [state, setState] = useState<"ready" | "loading">("ready");
  const rows = useMemo(() => makeTasks(size), [size]);
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
          rows={rows}
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
