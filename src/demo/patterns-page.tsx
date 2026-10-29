import { useState } from "react";
import {
  Button,
  EmptyState,
  FileList,
  FileRow,
  IconButton,
  Menu,
  MoreIcon,
  PlusIcon,
  PresenceChip,
  PresenceStack,
  Toolbar,
  ToolbarButton,
  ToolbarSeparator,
  type PresenceEntry,
} from "../react.js";
import { DemoShell } from "./demo-shell.js";

const ada: PresenceEntry = { id: "1", name: "Ada Lovelace", kind: "person" };
const grace: PresenceEntry = { id: "2", name: "Grace Hopper", kind: "person", status: "away" };
const claude: PresenceEntry = { id: "3", name: "Claude", kind: "agent", actingFor: "Ada Lovelace" };
const reviewer: PresenceEntry = { id: "4", name: "Review bot", kind: "agent", status: "paused" };
const hostile: PresenceEntry = { id: "5", name: "Eve\u202Eevil", kind: "person" };
// Entries from peers can be malformed. They must still render, and an agent must still say Agent.
const trickster: PresenceEntry = { id: "9", name: "Ada Agent for Bob", kind: "person" };
const malformed = [
  { id: "7", name: "Mallory", kind: "bot" },
  { id: "8", name: "Trent", kind: "person", status: "busy" },
  { id: "10", name: "Oscar", kind: "person", status: "constructor" },
  trickster,
] as unknown as PresenceEntry[];
const crowd: PresenceEntry[] = [ada, grace, claude, reviewer, hostile, { id: "6", name: "Linus", kind: "person" }];

export function PatternsPage() {
  const [bold, setBold] = useState(false);
  const [italic, setItalic] = useState(true);
  const [empty, setEmpty] = useState(false);

  return (
    <DemoShell title="Patterns" description="The shell around this page is the AppShell. Below: toolbar, presence, files, and empty states.">
      <section aria-labelledby="toolbar">
        <h2 id="toolbar">Toolbar</h2>
        <Toolbar label="Text formatting">
          <ToolbarButton label="Bold" icon={<b aria-hidden="true">B</b>} pressed={bold} onClick={() => setBold((v) => !v)} />
          <ToolbarButton label="Italic" icon={<i aria-hidden="true">I</i>} pressed={italic} onClick={() => setItalic((v) => !v)} />
          <ToolbarSeparator />
          <ToolbarButton label="Insert item" icon={<PlusIcon />} />
        </Toolbar>
        <p className="demo-muted demo-note">One tab stop. Arrow keys move inside it.</p>
      </section>

      <section aria-labelledby="presence">
        <h2 id="presence">Presence</h2>
        <div className="demo-cluster">
          <PresenceStack entries={crowd} />
        </div>
        <ul className="demo-plain">
          {crowd.map((entry) => (
            <li key={entry.id}>
              <PresenceChip entry={entry} />
            </li>
          ))}
        </ul>
        <ul className="demo-plain" aria-label="Malformed entries">
          {malformed.map((entry) => (
            <li key={entry.id}>
              <PresenceChip entry={entry} />
            </li>
          ))}
        </ul>
        <p className="demo-muted demo-note">
          An agent is a rounded square with a robot, and it carries the word Agent. A name with a hidden text-direction
          character shows as unnamed.
        </p>
      </section>

      <section aria-labelledby="files">
        <h2 id="files">Files</h2>
        <div className="demo-cluster">
          <Button onClick={() => setEmpty((v) => !v)}>{empty ? "Show files" : "Show empty state"}</Button>
        </div>
        {empty ? (
          <EmptyState
            title="No files yet"
            description="Create a page, or ask an agent to draft one. Everything it writes is labeled as machine-made."
            action={<Button variant="primary" size="sm">New page</Button>}
          />
        ) : (
          <FileList label="Recent files">
            <FileRow
              name="Launch plan"
              href="#launch-plan"
              modified={new Date("2026-10-27T10:00:00Z")}
              editedBy={ada}
              actions={<Menu trigger={<IconButton label="More actions for Launch plan" icon={<MoreIcon />} size="sm" tooltip={false} />} items={[{ label: "Open", onSelect: () => undefined }]} />}
            />
            <FileRow name="Meeting notes" href="#notes" modified={new Date("2026-10-26T15:30:00Z")} editedBy={claude} />
            <FileRow name="Research" href="#research" kind="folder" modified={new Date("2026-10-20T09:00:00Z")} editedBy={grace} />
            <FileRow name={"invoice\u202Etxt.exe"} href="#untitled" modified={new Date(Number.NaN)} editedBy={ada} />
          </FileList>
        )}
      </section>
    </DemoShell>
  );
}
