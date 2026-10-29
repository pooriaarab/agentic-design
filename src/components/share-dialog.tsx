import { useRef, useState, type ReactElement } from "react";
import { Button } from "./button.js";
import { Checkbox, Input, Select, Switch } from "./fields.js";
import { Dialog, Tabs } from "./overlays.js";
import { displayName, PresenceChip, type PresenceEntry } from "./presence.js";
import { parseInvitee, type Invitee } from "./invite.js";

export type ShareRole = "editor" | "commenter" | "viewer";
export type LinkExpiry = "never" | "1d" | "7d" | "30d";

export interface ShareEntry {
  entry: PresenceEntry;
  role: ShareRole | "owner";
  /** The email or @handle this entry was invited with. The dialog refuses a second invite to it. */
  invitedAs?: string;
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
  onChangeRole: (id: string, role: ShareRole) => void;
  /** Take away all access from one person or agent. */
  onRemove: (id: string) => void;
  link: ShareLink;
  onChangeLink: (link: ShareLink) => void;
  /** A static copy inside a link. It needs no account and no server read. */
  snapshot: { url?: string; onCreate: () => void };
  onCopy: (url: string) => void;
}

const roleLabel: Record<ShareRole, string> = { editor: "Can edit", commenter: "Can comment", viewer: "Can view" };
const roles = ["editor", "commenter", "viewer"] as const;
// Agents suggest edits and people accept them, so an invited agent never gets the editor role.
// A link is different: whoever holds it gets its role, and the Link tab says so.
const rolesFor = (kind: "person" | "agent"): readonly ShareRole[] => (kind === "agent" ? ["commenter", "viewer"] : roles);
const expiryLabel: Record<LinkExpiry, string> = { never: "Never", "1d": "In 1 day", "7d": "In 7 days", "30d": "In 30 days" };

// The row shows the role the entry really has. If it is not allowed for an agent, it still shows,
// marked, so the list never hides a right the agent holds.
function optionsFor(entry: PresenceEntry, current: ShareRole): { role: ShareRole; allowed: boolean }[] {
  const kind = entry.kind === "person" ? "person" : "agent";
  const allowed = rolesFor(kind);
  const options = allowed.map((role) => ({ role, allowed: true }));
  return allowed.includes(current) ? options : [{ role: current, allowed: false }, ...options];
}

function PeopleTab({ people, onInvite, onChangeRole, onRemove }: Pick<ShareDialogProps, "people" | "onInvite" | "onChangeRole" | "onRemove">) {
  const [text, setText] = useState("");
  const [role, setRole] = useState<ShareRole>("viewer");
  const [error, setError] = useState<string>();
  const [sent, setSent] = useState("");
  const inviteRef = useRef<HTMLInputElement>(null);

  const kind = parseInvitee(text)?.kind ?? "person";
  const allowed = rolesFor(kind);
  const chosen = allowed.includes(role) ? role : "viewer";

  return (
    <div className="ad-share">
      <form
        className="ad-share__invite"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          const invitee = parseInvitee(text);
          if (!invitee) {
            setSent("");
            setError("Enter an email like ada@example.org, or an agent handle like @claude.");
            return;
          }
          // Compare without case and without a leading @, against how it was invited, its id, and its name.
          const same = (value?: string) => value?.replace(/^@/, "").toLowerCase() === invitee.to.replace(/^@/, "").toLowerCase();
          if (people.some((p) => same(p.invitedAs) || same(p.entry.id) || same(p.entry.name))) {
            setSent("");
            setError(`${invitee.to} already has access. Change their role in the list below.`);
            return;
          }
          onInvite({ ...invitee, role: chosen });
          setError(undefined);
          setSent(`Invited ${invitee.to} as ${chosen}.`);
          setText("");
        }}
      >
        <Input
          ref={inviteRef}
          label="Invite a person or an agent"
          hint="An email invites a person. An @handle invites an agent. An agent can comment or view, and suggests edits that people accept."
          value={text}
          onChange={(e) => setText(e.target.value)}
          error={error}
          autoComplete="off"
        />
        <Select label="Role" value={chosen} onChange={(e) => setRole(e.target.value as ShareRole)}>
          {allowed.map((r) => <option key={r} value={r}>{roleLabel[r]}</option>)}
        </Select>
        <Button type="submit" variant="primary">Invite</Button>
      </form>
      {/* The status line is always in the page, so a screen reader announces the first message too. */}
      <p role="status" className="ad-share__sent">{sent}</p>
      <ul className="ad-share__people" aria-label="People and agents with access">
        {people.map(({ entry, role: current }) => (
          <li key={entry.id}>
            <PresenceChip entry={entry} />
            {current === "owner" ? (
              <span className="ad-share__owner">Owner</span>
            ) : (
              <span className="ad-share__controls">
                <Select
                  label={`Access for ${displayName(entry)}`}
                  hideLabel
                  value={current}
                  onChange={(e) => onChangeRole(entry.id, e.target.value as ShareRole)}
                >
                  {optionsFor(entry, current).map(({ role: r, allowed: ok }) => (
                    <option key={r} value={r} disabled={!ok}>{ok ? roleLabel[r] : `${roleLabel[r]} (not allowed for agents)`}</option>
                  ))}
                </Select>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`Remove access for ${displayName(entry)}`}
                  onClick={() => {
                    onRemove(entry.id);
                    // The row is gone and so is its button. Put focus on a control that still exists.
                    inviteRef.current?.focus();
                  }}
                >
                  Remove
                </Button>
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

const shortDate = (date: Date) => date.toLocaleDateString("en", { day: "numeric", month: "short", year: "numeric" });

function LinkTab({ link, onChangeLink, onCopy }: Pick<ShareDialogProps, "link" | "onChangeLink" | "onCopy">) {
  // A date in the past is an expired link. It is never shown as live.
  const expired = link.expiresAt != null && link.expiresAt.getTime() < Date.now();
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
            <Select
              label="Access"
              value={link.role}
              hint={
                link.role === "editor"
                  ? link.signedInOnly
                    ? "Anyone who signs in with the link can edit. That includes agents."
                    : "Anyone with the link can edit without signing in. That includes agents."
                  : undefined
              }
              onChange={(e) => onChangeLink({ ...link, role: e.target.value as ShareRole })}
            >
              {roles.map((r) => <option key={r} value={r}>{roleLabel[r]}</option>)}
            </Select>
            <Select
              label="Link expires"
              value={link.expiry}
              hint={link.expiresAt && !expired ? `Stops working on ${shortDate(link.expiresAt)}.` : undefined}
              error={expired && link.expiresAt ? `This link expired on ${shortDate(link.expiresAt)}. Choose a new expiry.` : undefined}
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
          {/* An expired link is not offered, so it cannot be copied as if it still worked. */}
          {!expired && (
            <div className="ad-share__copy">
              <Input label="Link" value={link.url} readOnly onFocus={(e) => e.target.select()} />
              <Button onClick={() => onCopy(link.url)}>Copy link</Button>
            </div>
          )}
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
          { value: "people", label: "People and agents", content: <PeopleTab people={props.people} onInvite={props.onInvite} onChangeRole={props.onChangeRole} onRemove={props.onRemove} /> },
          { value: "link", label: "Link", content: <LinkTab link={props.link} onChangeLink={props.onChangeLink} onCopy={props.onCopy} /> },
          { value: "snapshot", label: "Snapshot", content: <SnapshotTab snapshot={props.snapshot} onCopy={props.onCopy} /> },
        ]}
      />
    </Dialog>
  );
}
