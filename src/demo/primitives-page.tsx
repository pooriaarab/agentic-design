import { useState } from "react";
import {
  Button,
  Checkbox,
  Dialog,
  DialogClose,
  IconButton,
  Input,
  Menu,
  MoreIcon,
  PlusIcon,
  Select,
  Switch,
  Tabs,
  Textarea,
  useToast,
} from "../index.js";
import { DemoShell } from "./demo-shell.js";

export function PrimitivesPage() {
  const [name, setName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [lastAction, setLastAction] = useState("none");
  const toast = useToast();

  return (
    <DemoShell title="Primitives" description="Controls with visible focus, real labels, and every state.">
      <section aria-labelledby="buttons">
        <h2 id="buttons">Buttons</h2>
        <div className="demo-cluster">
          <Button variant="primary">Save</Button>
          <Button>Cancel</Button>
          <Button variant="ghost">Skip</Button>
          <Button variant="danger">Delete</Button>
          <Button variant="primary" size="sm">Small</Button>
          <Button disabled>Disabled</Button>
          <Button variant="primary" loading>Saving</Button>
          <IconButton label="Add item" icon={<PlusIcon />} />
        </div>
      </section>

      <section aria-labelledby="forms">
        <h2 id="forms">Form controls</h2>
        <form
          className="demo-form"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitted(true);
          }}
        >
          <Input
            label="Name"
            hint="Shown to people you share with."
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={submitted && name.trim() === "" ? "Enter a name so people know who you are." : undefined}
          />
          <Input label="Email" type="email" autoComplete="email" placeholder="you@example.org" />
          <Textarea label="Notes" hint="Optional." />
          <Select label="Role" defaultValue="viewer">
            <option value="viewer">Viewer</option>
            <option value="commenter">Commenter</option>
            <option value="editor">Editor</option>
          </Select>
          <Checkbox label="Notify me about replies" hint="We email at most once a day." defaultChecked />
          <Switch label="Allow agents to suggest edits" />
          <Input label="Locked field" value="Read only" disabled readOnly />
          <div>
            <Button type="submit" variant="primary">Save</Button>
          </div>
          {submitted && name.trim() !== "" && <p role="status">Saved.</p>}
        </form>
      </section>

      <section aria-labelledby="overlays">
        <h2 id="overlays">Dialog, menu, tooltip, and toast</h2>
        <div className="demo-cluster">
          <Dialog
            trigger={<Button variant="danger">Delete page…</Button>}
            title="Delete this page?"
            description="People and agents lose access. You can restore it from the trash for 30 days."
            footer={
              <>
                <DialogClose asChild>
                  <Button>Cancel</Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button variant="danger" onClick={() => toast({ title: "Page moved to the trash", tone: "success" })}>
                    Move to trash
                  </Button>
                </DialogClose>
              </>
            }
          />
          <Menu
            trigger={<IconButton label="More actions" icon={<MoreIcon />} />}
            items={[
              { label: "Rename", shortcut: "F2", onSelect: () => setLastAction("rename") },
              { label: "Duplicate", onSelect: () => setLastAction("duplicate") },
              "separator",
              { label: "Delete", danger: true, onSelect: () => setLastAction("delete") },
            ]}
          />
          <Button onClick={() => toast({ title: "Link copied", description: "Anyone with the link can view.", tone: "info" })}>Show toast</Button>
          <Button onClick={() => toast({ title: "We couldn't save your changes", description: "Your draft is safe on this device. Try again.", tone: "danger" })}>
            Show error toast
          </Button>
        </div>
        <p className="demo-muted" role="status">Last menu action: {lastAction}</p>
      </section>

      <section aria-labelledby="tabs">
        <h2 id="tabs">Tabs</h2>
        <Tabs
          label="Page sections"
          tabs={[
            { value: "overview", label: "Overview", content: <p>A page with two authors: one person and one agent.</p> },
            { value: "history", label: "History", content: <p>Every edit keeps its author and whether a person or an agent made it.</p> },
            { value: "access", label: "Access", content: <p>Owners, editors, commenters, and viewers.</p> },
          ]}
        />
      </section>
    </DemoShell>
  );
}
