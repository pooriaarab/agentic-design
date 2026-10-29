import { useRef, useState } from "react";
import {
  Button,
  CheckIcon,
  CloseIcon,
  PlusIcon,
  PresenceChip,
  PresenceCursor,
  PresenceStack,
  ShareDialog,
  Toolbar,
  ToolbarButton,
  ToolbarSeparator,
  useToast,
  usableProse,
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

// The page is data: text, and the remote cursors that sit in it. A snapshot is made from the text only.
type Part = string | PresenceEntry;
const intro: Part[][] = [
  ["We ship the beta on 12 November. Support and docs are ready one week earlier, so the team has time to practice the new flow ", grace, "before launch day."],
  ["The announcement goes to the mailing list first, then to the blog.", claude, " Owners review the final draft."],
];
const lastBefore = "Measure sign-ups for two weeks.";
const lastAfter = "Measure sign-ups for two weeks, and report the result to the whole team.";

// A snapshot keeps the page inside the link fragment, so a server never sees it.
// This demo does not compress or encrypt it.
const SNAPSHOT_KEY = "#snapshot=";
const MAX_SNAPSHOT = 20_000;

function snapshotUrl(paragraphs: string[]): string {
  const bytes = new TextEncoder().encode(JSON.stringify({ v: 1, text: paragraphs.join("\n\n") }));
  // Spreading a long array into one call overflows the stack, so build the string in chunks.
  let binary = "";
  for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
  const base64 = btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return `${window.location.origin}/editor${SNAPSHOT_KEY}${base64}`;
}

// A link is hostile input. Check its size, its shape, and every paragraph before showing any of it.
function readSnapshot(hash: string): string[] | null {
  if (!hash.startsWith(SNAPSHOT_KEY) || hash.length > MAX_SNAPSHOT) return null;
  try {
    const base64 = hash.slice(SNAPSHOT_KEY.length).replace(/-/g, "+").replace(/_/g, "/");
    const data: unknown = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))));
    if (typeof data !== "object" || data === null || (data as { v?: unknown }).v !== 1) return null;
    const text = (data as { text?: unknown }).text;
    if (typeof text !== "string") return null;
    const paragraphs = text.split("\n\n");
    return paragraphs.every((p) => usableProse(p, 5_000) !== null) ? paragraphs : null;
  } catch {
    return null;
  }
}

// The snapshot holds the text as it is now, including edits, and none of the remote cursor tags.
function liveParagraphs(root: HTMLElement | null): string[] {
  if (!root) return [];
  const copy = root.cloneNode(true) as HTMLElement;
  copy.querySelectorAll(".ad-cursor").forEach((node) => node.remove());
  // A blank paragraph, such as one made by pressing Enter, carries nothing.
  // The editor inserts no-break spaces for edge and double spaces, and a pasted tab is a control. Both become spaces.
  return [...copy.querySelectorAll("p")]
    .map((p) => (p.textContent ?? "").replace(/[\u00A0\t]/g, " "))
    .filter((text) => text.trim() !== "");
}

function SnapshotView({ hash }: { hash: string }) {
  const paragraphs = readSnapshot(hash);
  return (
    <DemoShell title="Launch plan" description="A read-only copy from a link. It was not read from a server, and edits here are not saved.">
      {paragraphs ? (
        <article className="demo-page" aria-label="Snapshot of Launch plan">
          <div className="demo-prose">
            {paragraphs.map((p, i) => <p key={i}>{p}</p>)}
          </div>
        </article>
      ) : (
        <p role="alert">This snapshot link is not valid, so nothing was opened.</p>
      )}
    </DemoShell>
  );
}

export function EditorPage() {
  const [hash] = useState(() => window.location.hash);
  return hash.startsWith(SNAPSHOT_KEY) ? <SnapshotView hash={hash} /> : <Editor />;
}

function Editor() {
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

  const last = accepted === "accepted" ? lastAfter : lastBefore;
  // Who is here is not who has access. Claude is here only while Claude still has access, and
  // then its cursor and its suggestion go with it.
  const claudeHere = people.some((p) => p.entry.id === "claude");
  const here = claudeHere ? [ada, grace, claude] : [ada, grace];

  const copy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copied", tone: "success" });
    } catch {
      toast({ title: "We couldn't copy the link", description: "Select the link and copy it yourself. Nothing was changed.", tone: "danger" });
    }
  };

  // The suggestion card holds focus when a key is pressed. It is about to go, so focus the text.
  const decide = (decision: "accepted" | "rejected") => {
    // The suggestion was written against the original paragraph. If a person has changed it since,
    // accepting would replace their words, so nothing is applied.
    const live = textRef.current?.querySelectorAll("p")[2]?.textContent?.trim();
    if (decision === "accepted" && live !== lastBefore) {
      toast({ title: "We didn't apply the suggestion", description: "The last paragraph changed after Claude wrote it. Nothing was changed.", tone: "danger" });
      return;
    }
    textRef.current?.focus();
    setAccepted(decision);
    if (decision === "accepted") toast({ title: "Suggestion accepted", description: "The edit stays labeled as made by Claude, an agent.", tone: "success" });
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
                  invitedAs: invite.to,
                  // A long address would fail the display-name limit, so the list shows a shortened one.
                  entry: { id: invite.to, name: invite.to.length > 40 ? `${invite.to.slice(0, 37)}…` : invite.to, kind: invite.kind, actingFor: invite.kind === "agent" ? "Ada Lovelace" : undefined },
                  role: invite.role,
                },
              ])
            }
            onChangeRole={(id, role) => setPeople((all) => all.map((p) => (p.entry.id === id ? { ...p, role } : p)))}
            onRemove={(id) => setPeople((all) => all.filter((p) => p.entry.id !== id))}
            link={link}
            onChangeLink={(next) => {
              // A new clock starts when the expiry changes or the link is turned on. Any other setting keeps its date.
              if (next.expiry === link.expiry && !(next.enabled && !link.enabled)) return setLink(next);
              const days = expiryDays[next.expiry];
              setLink({ ...next, expiresAt: days === null ? null : new Date(Date.now() + days * DAY) });
            }}
            snapshot={{
              url: snapshot,
              onCreate: () => {
                const paragraphs = liveParagraphs(textRef.current);
                // Check the size before encoding, so a very large page never reaches the encoder.
                const tooLong = paragraphs.join("\n\n").length > MAX_SNAPSHOT;
                const url = tooLong ? "" : snapshotUrl(paragraphs);
                const hash = url.slice(url.indexOf("#"));
                if (tooLong || hash.length > MAX_SNAPSHOT) {
                  toast({ title: "This page is too long for a snapshot link", description: "Shorten the text and try again. Nothing was shared.", tone: "danger" });
                  return;
                }
                if (readSnapshot(hash) === null) {
                  toast({ title: "This page has text a snapshot link can't carry", description: "Remove very long paragraphs or hidden characters and try again. Nothing was shared.", tone: "danger" });
                  return;
                }
                setSnapshot(url);
              },
            }}
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
          {intro.map((parts, i) => (
            <p key={i}>
              {parts.map((part, j) => (typeof part === "string" ? part : part.id === "claude" && !claudeHere ? null : <PresenceCursor key={j} entry={part} />))}
            </p>
          ))}
          <p>{last}</p>
        </div>

        {accepted === "pending" && claudeHere && (
          <aside className="demo-suggestion" aria-label="Suggestion from Claude">
            <p>
              <PresenceChip entry={claude} /> suggests a change to the last paragraph:
            </p>
            <p className="demo-suggestion__text"><ins>{lastAfter}</ins></p>
            <div className="demo-cluster">
              <Button size="sm" variant="primary" onClick={() => decide("accepted")}>
                <CheckIcon /> Accept
              </Button>
              <Button size="sm" onClick={() => decide("rejected")}>
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
