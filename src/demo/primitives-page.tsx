import { useState } from "react";
import { Button, Checkbox, IconButton, Input, PlusIcon, Select, Switch, Textarea } from "../react.js";
import { DemoShell } from "./demo-shell.js";

export function PrimitivesPage() {
  const [name, setName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loadingClicks, setLoadingClicks] = useState(0);
  const [normalClicks, setNormalClicks] = useState(0);

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
          <Button variant="primary" loading onClick={() => setLoadingClicks((n) => n + 1)}>Saving</Button>
          <Button onClick={() => setNormalClicks((n) => n + 1)}>Count a click</Button>
          <IconButton label="Add item" icon={<PlusIcon />} />
        </div>
        <p className="demo-muted demo-note">Clicks while loading: {loadingClicks}. Clicks on the normal button: {normalClicks}.</p>
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
          <p className="demo-muted">Fields marked * are required.</p>
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
    </DemoShell>
  );
}
