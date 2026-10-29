import { useState, type ReactElement } from "react";
import { Button } from "./button.js";
import { Checkbox, Input, Select, Switch } from "./fields.js";
import { Dialog, Tabs } from "./overlays.js";
import { PresenceChip, type PresenceEntry } from "./presence.js";
import { parseInvitee, type Invitee } from "./invite.js";

export type ShareRole = "editor" | "commenter" | "viewer";
export type LinkExpiry = "never" | "1d" | "7d" | "30d";

export interface ShareEntry {
  entry: PresenceEntry;
  role: ShareRole | "owner";
}

export interface ShareLink {
  enabled: boolean;
  role: ShareRole;
  expiry: LinkExpiry;
  signedInOnly: boolean;
  url: string;
  /** When the link stops working. Shown to the person. */
  expiresAt?: Date | null;
}

export interface ShareDialogProps {
  /** The button that opens the dialog. Pass it, so focus returns to it on close. */
  trigger?: ReactElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  resourceName: string;
  people: ShareEntry[];
  onInvite: (invite: Invitee & { role: ShareRole }) => void;
  onChangeRole: (id: string, role: ShareRole | "remove") => void;
  link: ShareLink;
  onChangeLink: (link: ShareLink) => void;
  /** A static copy inside a link. It needs no account and no server read. */
  snapshot: { url?: string; onCreate: () => void };
  onCopy: (url: string) => void;
}

const roleLabel: Record<ShareRole, string> = { editor: "Can edit", commenter: "Can comment", viewer: "Can view" };
const roles = ["editor", "commenter", "viewer"] as const;
const expiryLabel: Record<LinkExpiry, string> = { never: "Never", "1d": "In 1 day", "7d": "In 7 days", "30d": "In 30 days" };

function PeopleTab({ people, onInvite, onChangeRole }: Pick<ShareDialogProps, "people" | "onInvite" | "onChangeRole">) {
  const [text, setText] = useState("");
  const [role, setRole] = useState<ShareRole>("viewer");
  const [error, setError] = useState<string>();
  const [sent, setSent] = useState<string>();

  return (
    <div className="ad-share">
      <form
        className="ad-share__invite"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          const invitee = parseInvitee(text);
          if (!invitee) {
            setSent(undefined);
            setError("Enter an email like ada@example.org, or an agent handle like @claude.");
            return;
          }
          onInvite({ ...invitee, role });
          setError(undefined);
          setSent(`Invited ${invitee.to} as ${role}.`);
          setText("");
        }}
      >
        <Input
          label="Invite a person or an agent"
          hint="An email invites a person. An @handle invites an agent. Agents suggest edits. People accept them."
          value={text}
          onChange={(e) => setText(e.target.value)}
          error={error}
          autoComplete="off"
        />
        <Select label="Role" value={role} onChange={(e) => setRole(e.target.value as ShareRole)}>
          {roles.map((r) => <option key={r} value={r}>{roleLabel[r]}</option>)}
        </Select>
        <Button type="submit" variant="primary">Invite</Button>
      </form>
      {sent && <p role="status" className="ad-share__sent">{sent}</p>}
      <ul className="ad-share__people" aria-label="People and agents with access">
        {people.map(({ entry, role: current }) => (
          <li key={entry.id}>
            <PresenceChip entry={entry} />
            {current === "owner" ? (
              <span className="ad-share__owner">Owner</span>
            ) : (
              <Select
                label={`Access for ${entry.name}`}
                hideLabel
                value={current}
                onChange={(e) => onChangeRole(entry.id, e.target.value as ShareRole | "remove")}
              >
                {roles.map((r) => <option key={r} value={r}>{roleLabel[r]}</option>)}
                <option value="remove">Remove access</option>
              </Select>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function LinkTab({ link, onChangeLink, onCopy }: Pick<ShareDialogProps, "link" | "onChangeLink" | "onCopy">) {
  return (
    <div className="ad-share">
      <Switch
        label="Anyone with the link"
        hint={link.enabled ? undefined : "Only people you invite can open this page."}
        checked={link.enabled}
        onChange={(e) => onChangeLink({ ...link, enabled: e.target.checked })}
      />
      {link.enabled && (
        <>
          <div className="ad-share__row">
            <Select label="Access" value={link.role} onChange={(e) => onChangeLink({ ...link, role: e.target.value as ShareRole })}>
              {roles.map((r) => <option key={r} value={r}>{roleLabel[r]}</option>)}
            </Select>
            <Select
              label="Link expires"
              value={link.expiry}
              hint={link.expiresAt ? `Stops working on ${link.expiresAt.toLocaleDateString("en", { day: "numeric", month: "short", year: "numeric" })}.` : undefined}
              onChange={(e) => onChangeLink({ ...link, expiry: e.target.value as LinkExpiry })}
            >
              {(Object.keys(expiryLabel) as LinkExpiry[]).map((x) => <option key={x} value={x}>{expiryLabel[x]}</option>)}
            </Select>
          </div>
          <Checkbox
            label="Require sign-in"
            hint="People must sign in before they open the link."
            checked={link.signedInOnly}
            onChange={(e) => onChangeLink({ ...link, signedInOnly: e.target.checked })}
          />
          <div className="ad-share__copy">
            <Input label="Link" value={link.url} readOnly onFocus={(e) => e.target.select()} />
            <Button onClick={() => onCopy(link.url)}>Copy link</Button>
          </div>
        </>
      )}
    </div>
  );
}

function SnapshotTab({ snapshot, onCopy }: Pick<ShareDialogProps, "snapshot" | "onCopy">) {
  return (
    <div className="ad-share">
      <p>
        A snapshot puts a read-only copy of this page inside the link. It needs no account and no server read. Later edits
        are not in it.
      </p>
      <div>
        <Button onClick={snapshot.onCreate}>{snapshot.url ? "Create a new snapshot link" : "Create snapshot link"}</Button>
      </div>
      {snapshot.url && (
        <>
          <div className="ad-share__copy">
            <Input label="Snapshot link" value={snapshot.url} readOnly onFocus={(e) => e.target.select()} />
            <Button onClick={() => onCopy(snapshot.url as string)}>Copy link</Button>
          </div>
          <p className="ad-field__hint">Anyone who has this link can read this copy. Share it like a password.</p>
        </>
      )}
    </div>
  );
}

export function ShareDialog({ resourceName, trigger, open, onOpenChange, ...props }: ShareDialogProps) {
  return (
    <Dialog trigger={trigger} open={open} onOpenChange={onOpenChange} title={`Share “${resourceName}”`} description="Choose who can open this page, and what they can do.">
      <Tabs
        label="Ways to share"
        tabs={[
          { value: "people", label: "People and agents", content: <PeopleTab people={props.people} onInvite={props.onInvite} onChangeRole={props.onChangeRole} /> },
          { value: "link", label: "Link", content: <LinkTab link={props.link} onChangeLink={props.onChangeLink} onCopy={props.onCopy} /> },
          { value: "snapshot", label: "Snapshot", content: <SnapshotTab snapshot={props.snapshot} onCopy={props.onCopy} /> },
        ]}
      />
    </Dialog>
  );
}
