import { useState } from "react";
import {
  AgentBadge,
  Button,
  DocumentTitle,
  FileList,
  IconButton,
  Menu,
  MoreIcon,
  ShareDialog,
  Toolbar,
  ToolbarButton,
  ToolbarGroup,
  ToolbarOverflow,
  ToolbarSeparator,
  type FileItem,
  type PresenceEntry,
  type ShareEntry,
  type ShareLink,
} from "../react.js";
import { DemoShell } from "./demo-shell.js";

const ada: PresenceEntry = { id: "ada", name: "Ada Lovelace", kind: "person" };
const grace: PresenceEntry = { id: "grace", name: "Grace Hopper", kind: "person" };
const claude: PresenceEntry = { id: "claude", name: "Claude", kind: "agent", actingFor: "Ada Lovelace" };
const items: FileItem[] = [
  {
    id: "1",
    name: "Launch plan",
    href: "#launch-plan",
    owner: ada,
    modified: new Date("2026-10-27T10:00:00Z"),
    actions: <Menu trigger={<IconButton label="More actions for Launch plan" icon={<MoreIcon />} size="sm" tooltip={false} />} items={[{ label: "Open", onSelect: () => undefined }]} />,
  },
  { id: "2", name: "Meeting notes", href: "#notes", owner: claude, modified: new Date("2026-10-26T15:30:00Z") },
  { id: "3", name: "Research", href: "#research", kind: "folder", owner: grace, modified: new Date("2026-10-20T09:00:00Z") },
  { id: "4", name: "Budget 10", href: "#budget-10", owner: ada, modified: new Date("2026-10-01T09:00:00Z") },
  { id: "5", name: "Budget 2", href: "#budget-2", owner: grace, modified: new Date(Number.NaN) },
];

export function ChromePage() {
  const [view, setView] = useState<"table" | "grid">("table");
  const [state, setState] = useState<"ready" | "loading" | "empty">("ready");
  const [people, setPeople] = useState<ShareEntry[]>([{ entry: ada, role: "owner" }, { entry: claude, role: "commenter" }]);
  const [link, setLink] = useState<ShareLink>({ enabled: true, role: "viewer", expiry: "never", signedInOnly: false, url: "https://example.com/s/abc" });
  const [title, setTitle] = useState("Launch plan");
  const [bold, setBold] = useState(false);
  const [italic, setItalic] = useState(true);
  const [last, setLast] = useState("none");

  return (
    <DemoShell
      title="App chrome"
      description="The parts every editor shares. The shell around this page has a side panel on the right."
      panel={<p id="shell-panel">Notes for this page. A side panel holds comments, an assistant, or details.</p>}
    >
      <section aria-labelledby="doc-title" id="demo-title">
        <h2 id="doc-title">Document title</h2>
        <DocumentTitle value={title} onRename={setTitle} />
        <DocumentTitle value="A stored title that is longer than its limit" label="Imported title" maxLength={20} onRename={() => undefined} />
        <p className="demo-muted demo-note">Press Enter or F2 to rename. Enter saves. Escape cancels.</p>
      </section>

      <section aria-labelledby="demo-toolbar-h" id="demo-toolbar">
        <h2 id="demo-toolbar-h">Toolbar</h2>
        <Toolbar label="Editor tools">
          <ToolbarGroup label="Text style">
            <ToolbarButton label="Bold" icon={<b aria-hidden="true">B</b>} pressed={bold} onClick={() => setBold((v) => !v)} />
            <ToolbarButton label="Italic" icon={<i aria-hidden="true">I</i>} pressed={italic} onClick={() => setItalic((v) => !v)} />
          </ToolbarGroup>
          <ToolbarSeparator />
          <ToolbarGroup label="Insert">
            <ToolbarButton label="Insert link" icon={<span aria-hidden="true">#</span>} onClick={() => setLast("link")} />
          </ToolbarGroup>
          <ToolbarOverflow items={[{ label: "Clear formatting", onSelect: () => setLast("clear") }, { label: "Word count", onSelect: () => setLast("count") }]} />
        </Toolbar>
        <p className="demo-muted demo-note">Last action: <span id="last-action">{last}</span></p>
      </section>

      <section aria-labelledby="demo-agent-h" id="demo-agent">
        <h2 id="demo-agent-h">Agent badge</h2>
        <ul className="demo-plain">
          <li><AgentBadge name="Claude" actingFor="Ada Lovelace" /></li>
          <li><AgentBadge label="Edited by an agent" /></li>
          <li><AgentBadge name={"Eve\u202Eevil"} actingFor="Ada Lovelace" compact /></li>
        </ul>
      </section>

      <section aria-labelledby="demo-files-h" id="demo-files">
        <h2 id="demo-files-h">File list</h2>
        <div className="demo-cluster">
          <Button onClick={() => setView((v) => (v === "table" ? "grid" : "table"))}>{view === "table" ? "Show grid" : "Show table"}</Button>
          <Button onClick={() => setState("loading")}>Show loading</Button>
          <Button onClick={() => setState("empty")}>Show empty</Button>
          <Button onClick={() => setState("ready")}>Show files</Button>
        </div>
        <FileList label="Recent files" view={view} items={state === "empty" ? [] : items} loading={state === "loading"} />
      </section>

      <section aria-labelledby="demo-share-h" id="demo-share">
        <h2 id="demo-share-h">Share dialog</h2>
        <ShareDialog
          trigger={<Button variant="primary">Share</Button>}
          resourceName="Launch plan"
          people={people}
          onInvite={(invite) => setPeople((all) => [...all, { invitedAs: invite.to, entry: { id: invite.to, name: invite.to, kind: invite.kind, actingFor: invite.kind === "agent" ? "Ada Lovelace" : undefined }, role: invite.role }])}
          onChangeRole={(id, role) => setPeople((all) => all.map((p) => (p.entry.id === id ? { ...p, role } : p)))}
          onRemove={(id) => setPeople((all) => all.filter((p) => p.entry.id !== id))}
          link={link}
          onChangeLink={setLink}
          snapshot={{ onCreate: () => undefined }}
          onCopy={() => undefined}
        />
      </section>
    </DemoShell>
  );
}
