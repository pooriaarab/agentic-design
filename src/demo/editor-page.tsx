import { useRef, useState } from "react";
import {
  Button,
  PlusIcon,
  PresenceChip,
  PresenceCursor,
  PresenceStack,
  ShareDialog,
  Toolbar,
  ToolbarButton,
  ToolbarSeparator,
  useToast,
  CheckIcon,
  CloseIcon,
  type LinkExpiry,
  type PresenceEntry,
  type ShareEntry,
  type ShareLink,
} from "../react.js";
import { DemoShell } from "./demo-shell.js";

const ada: PresenceEntry = { id: "ada", name: "Ada Lovelace", kind: "person" };
const grace: PresenceEntry = { id: "grace", name: "Grace Hopper", kind: "person", status: "away" };
const claude: PresenceEntry = { id: "claude", name: "Claude", kind: "agent", actingFor: "Ada Lovelace" };

const DAY = 86_400_000;
const expiryDays: Record<LinkExpiry, number | null> = { never: null, "1d": 1, "7d": 7, "30d": 30 };

// A snapshot keeps the page inside the link fragment. A server never sees it.
// This demo does not compress or encrypt it.
function snapshotUrl(text: string): string {
  const bytes = new TextEncoder().encode(JSON.stringify({ v: 1, text }));
  const base64 = btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return `${window.location.origin}/editor#snapshot=${base64}`;
}

export function EditorPage() {
  const toast = useToast();
  const [bold, setBold] = useState(false);
  const [accepted, setAccepted] = useState<"pending" | "accepted" | "rejected">("pending");
  const [people, setPeople] = useState<ShareEntry[]>([
    { entry: ada, role: "owner" },
    { entry: grace, role: "editor" },
    { entry: claude, role: "commenter" },
  ]);
  const [link, setLink] = useState<ShareLink>({ enabled: false, role: "viewer", expiry: "7d", signedInOnly: true, url: `${window.location.origin}/editor?link=k7Qm2x`, expiresAt: new Date(Date.now() + 7 * DAY) });
  const [snapshot, setSnapshot] = useState<string>();
  const textRef = useRef<HTMLDivElement>(null);

  const here = [ada, grace, claude, ...people.map((p) => p.entry).filter((e) => !["ada", "grace", "claude"].includes(e.id))];
  const copy = async (url: string) => {
    await navigator.clipboard?.writeText(url).catch(() => undefined);
    toast({ title: "Link copied", tone: "success" });
  };

  return (
    <DemoShell
      title="Launch plan"
      description="Last edited by Claude, an agent. Ada Lovelace accepted the change."
      actions={
        <>
          <PresenceStack entries={here} label="Here now" />
          <ShareDialog
            trigger={<Button variant="primary">Share</Button>}
            resourceName="Launch plan"
            people={people}
            onInvite={(invite) =>
              setPeople((all) => [
                ...all,
                {
                  entry: { id: invite.to, name: invite.to, kind: invite.kind, actingFor: invite.kind === "agent" ? "Ada Lovelace" : undefined },
                  role: invite.role,
                },
              ])
            }
            onChangeRole={(id, role) =>
              setPeople((all) => (role === "remove" ? all.filter((p) => p.entry.id !== id) : all.map((p) => (p.entry.id === id ? { ...p, role } : p))))
            }
            link={link}
            onChangeLink={(next) => {
              const days = expiryDays[next.expiry];
              setLink({ ...next, expiresAt: days === null ? null : new Date(Date.now() + days * DAY) });
            }}
            snapshot={{ url: snapshot, onCreate: () => setSnapshot(snapshotUrl(textRef.current?.innerText ?? "")) }}
            onCopy={copy}
          />
        </>
      }
    >
      <Toolbar label="Text formatting">
        <ToolbarButton label="Bold" icon={<b aria-hidden="true">B</b>} pressed={bold} onClick={() => setBold((v) => !v)} />
        <ToolbarButton label="Italic" icon={<i aria-hidden="true">I</i>} />
        <ToolbarSeparator />
        <ToolbarButton label="Insert item" icon={<PlusIcon />} />
      </Toolbar>

      <article className="demo-page">
        <div ref={textRef} className="demo-prose" role="textbox" aria-multiline="true" aria-label="Page text" contentEditable suppressContentEditableWarning spellCheck>
          <p>
            We ship the beta on 12 November. Support and docs are ready one week earlier, so the team has time to
            practice the new flow <PresenceCursor entry={grace} />before launch day.
          </p>
          <p>
            The announcement goes to the mailing list first, then to the blog.<PresenceCursor entry={claude} /> Owners
            review the final draft.
          </p>
          <p>
            {accepted === "accepted"
              ? "Measure sign-ups for two weeks, and report the result to the whole team."
              : "Measure sign-ups for two weeks."}
          </p>
        </div>

        {accepted === "pending" && (
          <aside className="demo-suggestion" aria-label="Suggestion from Claude">
            <p>
              <PresenceChip entry={claude} /> suggests a change to the last paragraph:
            </p>
            <p className="demo-suggestion__text"><ins>Measure sign-ups for two weeks, and report the result to the whole team.</ins></p>
            <div className="demo-cluster">
              <Button size="sm" variant="primary" onClick={() => { setAccepted("accepted"); toast({ title: "Suggestion accepted", description: "The edit stays labeled as made by Claude, an agent.", tone: "success" }); }}>
                <CheckIcon /> Accept
              </Button>
              <Button size="sm" onClick={() => setAccepted("rejected")}>
                <CloseIcon /> Reject
              </Button>
            </div>
            <p className="ad-field__hint">Agents suggest. Only people accept or reject.</p>
          </aside>
        )}
      </article>

    </DemoShell>
  );
}
