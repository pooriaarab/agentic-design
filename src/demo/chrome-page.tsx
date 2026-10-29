import { useState } from "react";
import { AgentBadge, DocumentTitle, Toolbar, ToolbarButton, ToolbarGroup, ToolbarOverflow, ToolbarSeparator } from "../react.js";
import { DemoShell } from "./demo-shell.js";

export function ChromePage() {
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
    </DemoShell>
  );
}
