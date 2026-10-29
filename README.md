# agentic-design

[![MIT license](https://img.shields.io/badge/license-MIT-blue)](https://opensource.org/license/mit)

[Source](https://github.com/pooriaarab/agentic-design) · [Support](https://github.com/pooriaarab/agentic-design/issues)

Accessible design tokens and UI primitives for calm, minimal apps.

> Status: 0.2.0. The tokens, the contrast check, the fonts, the controls, the overlays, the app
> chrome (shell, toolbar, title, share dialog, file list, agent badge), and the demo site work.
> See [CHANGELOG.md](CHANGELOG.md) for what is in this release and its limits.

## Install

Run `npm install agentic-design`. To build it from a checkout instead, install the tarball:

```sh
npm ci && npm pack
npm install ./agentic-design-0.2.0.tgz
```

`npm pack` runs the build first (`prepack`), so the tarball holds `dist/`.

## Quick start

Import the stylesheet once. It holds the fonts, the tokens, and base rules.

```js
import "agentic-design/styles.css";
```

Use a token in your own CSS:

```css
.card {
  background: var(--ad-color-surface);
  border: 1px solid var(--ad-color-border);
  border-radius: var(--ad-radius-md);
  padding: var(--ad-space-4);
}
```

Set `data-theme="light"` or `data-theme="dark"` on `<html>` to pick a theme.
Without it, the page follows the system setting. You can set `data-theme`
on any inner element for a themed region.

Read the same tokens in TypeScript:

```ts
import { themes, scale } from "agentic-design/tokens";

themes.dark.accent; // "#8EA4FF"
```

## App chrome

These React parts make the frame of an editor: documents, spreadsheet, slides, drive, tables,
forms, canvas. They use only tokens, so you write no CSS of your own. Each one works by keyboard,
shows focus, keeps AA contrast in light and dark, holds up in forced colors, stops motion when the
user asks for less, and flips in right-to-left pages. Each example below is a whole module. A test
type-checks every one of them.

Wrap the app once. `ThemeProvider` and `TooltipProvider` serve the parts below, and `ToastProvider`
serves `useToast`.

### AppShell

A sidebar, a top bar, a skip link, and the content. Below 48rem the sidebar hides behind a menu
button. `title` sits at the start of the top bar, and `topbar` sits at the end. Pass `panel` and
`panelLabel` for a side panel, such as comments. The panel is an `aside` landmark. Beside the content
it needs 64rem. Below that it sits under the content.

```tsx
import { AppShell, SidebarNav } from "agentic-design/react";

export function Page() {
  return (
    <AppShell
      brand="Docs"
      sidebar={<SidebarNav label="Main" items={[{ href: "/", label: "Home", current: true }]} />}
      title={<strong>Launch plan</strong>}
      topbar={<span>Saved</span>}
      panel={<p>No comments yet.</p>}
      panelLabel="Comments"
    >
      <p>Content</p>
    </AppShell>
  );
}
```

### Toolbar

One tab stop. Arrow keys, Home, and End move inside it. `ToolbarGroup` names a set of buttons for a
screen reader. `ToolbarButton` with `pressed` is a toggle. `ToolbarOverflow` is the last button, and it
opens a menu of the tools that do not fit. Put in the menu only tools that are not in the bar. The bar
reads the page direction when it renders.

```tsx
import { useState } from "react";
import { Toolbar, ToolbarButton, ToolbarGroup, ToolbarOverflow, ToolbarSeparator } from "agentic-design/react";

export function Tools() {
  const [bold, setBold] = useState(false);
  return (
    <Toolbar label="Editor tools">
      <ToolbarGroup label="Text style">
        <ToolbarButton label="Bold" icon={<b aria-hidden="true">B</b>} pressed={bold} onClick={() => setBold((v) => !v)} />
      </ToolbarGroup>
      <ToolbarSeparator />
      <ToolbarOverflow items={[{ label: "Word count", onSelect: () => console.log("count") }]} />
    </Toolbar>
  );
}
```

### DocumentTitle

A title that renames in place. Enter, Space, or F2 opens the field. Enter or leaving the field saves.
Escape cancels and gives focus back. A blank title, a title that is too long, and a title with a hidden
character are refused with a message that says what to fix. Put it in the top bar. Inside a dialog,
Escape also closes the dialog.

```tsx
import { useState } from "react";
import { DocumentTitle } from "agentic-design/react";

export function Title() {
  const [title, setTitle] = useState("Launch plan");
  return <DocumentTitle value={title} onRename={setTitle} />;
}
```

### ShareDialog

People and agents with a role each, an invite field (an email invites a person, an `@handle` invites
an agent), a link with a role, an expiry, and a sign-in rule, and a copy button. It is a view. It
calls your handlers and sends nothing. The owner row has no role select.

```tsx
import { useState } from "react";
import { Button, ShareDialog, type ShareEntry, type ShareLink } from "agentic-design/react";

const ada = { id: "ada", name: "Ada Lovelace", kind: "person" } as const;

export function Share() {
  const [people, setPeople] = useState<ShareEntry[]>([{ entry: ada, role: "owner" }]);
  const [link, setLink] = useState<ShareLink>({ enabled: false, role: "viewer", expiry: "never", signedInOnly: true, url: "https://example.com/s/abc" });
  return (
    <ShareDialog
      trigger={<Button variant="primary">Share</Button>}
      resourceName="Launch plan"
      people={people}
      onInvite={(invite) => setPeople((all) => [...all, { invitedAs: invite.to, entry: { id: invite.to, name: invite.to, kind: invite.kind }, role: invite.role }])}
      onChangeRole={(id, role) => setPeople((all) => all.map((p) => (p.entry.id === id ? { ...p, role } : p)))}
      onRemove={(id) => setPeople((all) => all.filter((p) => p.entry.id !== id))}
      link={link}
      onChangeLink={setLink}
      snapshot={{ onCreate: () => undefined }}
      onCopy={(url) => navigator.clipboard.writeText(url)}
    />
  );
}
```

### FileList

A table or a grid of items, each with an icon, an owner, and a modified date. The table has column
headers that sort. The active header carries `aria-sort`, and a polite message says when the sort
changes. The grid has a "Sort by" select. Names sort in natural order, and a date that is not valid
sorts last. `loading` shows placeholders and says "Loading files" once. `empty` replaces the default
empty state. For a list you sort yourself, pass `sort` and `onSortChange`, and pass `items` in order.
Pass `FileRow` children instead of `items` for a plain list of rows.

```tsx
import { FileList, type FileItem } from "agentic-design/react";

const items: FileItem[] = [
  { id: "1", name: "Launch plan", href: "/d/1", owner: { id: "ada", name: "Ada Lovelace", kind: "person" }, modified: new Date("2026-10-27") },
  { id: "2", name: "Notes", href: "/d/2", owner: { id: "c", name: "Claude", kind: "agent", actingFor: "Ada Lovelace" }, modified: new Date("2026-10-26") },
];

export function Files({ loading }: { loading: boolean }) {
  return <FileList label="Recent files" view="table" items={items} loading={loading} />;
}
```

### AgentBadge

A visible mark for anything an agent made: a draft, an edit, a comment, a cell. It shows the words
"Made by an agent", a square avatar, and who the agent acts for, so color is never the only signal.
Change `label` to say what the agent did, in your language, and keep the word for agent in it. With
`compact` there is room for the avatar only, and the same facts move into its accessible name. The
agent name and the person pass through `usableName`.

```tsx
import { AgentBadge } from "agentic-design/react";

export function Marks() {
  return (
    <>
      <AgentBadge name="Claude" actingFor="Ada Lovelace" />
      <AgentBadge label="Edited by an agent" name="Claude" actingFor="Ada Lovelace" compact />
    </>
  );
}
```

Screenshots of each part in light and dark are in `docs/screenshots`. Run `npm run build` and
`npx wrangler dev`, then open `/chrome` to try them.

## Features

- Semantic color tokens for light and dark: `bg`, `surface`, `text`,
  `text-muted`, `border`, `accent`, `agent`, `danger`, `warning`, `success`,
  `focus`.
- Scales for type, space, radius, shadow, and motion. Motion tokens drop to
  zero when the user asks for reduced motion.
- A contrast check. `npm run check:contrast` tests every text and background
  pair in both themes against WCAG 2.2 AA and fails when one is too low.
- Self-hosted Inter and JetBrains Mono (SIL OFL). The package makes no remote
  request.
- Form controls for React: `Button`, `IconButton` (needs a `label`), `Input`, `Textarea`,
  `Select`, `Checkbox`, `Switch`. Each field has a visible label and a focus ring.
  `Input`, `Textarea`, and `Select` take `hint` and `error`. An error shows an icon and
  text, sets `aria-invalid`, and is announced. `Button` has loading and disabled states.
  Checked and selected states stay visible in Windows High Contrast.
- Overlays for React, on Radix UI (MIT): `Dialog`, `Menu`, `Tooltip`, `Tabs`, and
  a toast (`ToastProvider`, `useToast`). Dialogs trap focus and give it back. An
  icon button shows its label as a tooltip. An error toast stays until dismissed.
- App patterns for React: `AppShell` (sidebar, top bar, optional side panel, skip link, a menu
  button on narrow screens), `SidebarNav`, a roving-focus `Toolbar` with groups and an overflow menu,
  `DocumentTitle`, `AgentBadge`, `EmptyState`, `FileList` (rows, or a sortable table or grid) and
  `FileRow`, and `PresenceChip` and `PresenceStack`. See App chrome above. A chip shows an agent by the word Agent in a pill, a
  square avatar with a robot, and who it acts for, never by color alone. The stack is a row of
  avatars: the shape shows an agent, and the name of each avatar and the count in words say
  who is an agent and who it acts for. A name can still resemble another where a script
  needs a joiner, so show an account handle where two people must be told apart. Display names pass a
  closed allow-list (`usableName`): a name with a hidden text-direction character or a
  zero-width space shows as unnamed.
- `ShareDialog`: people and agents with roles, an invite field (an email invites a person, an
  `@handle` invites an agent, and anything else is refused), a link with role, expiry, and a
  sign-in rule, and a snapshot link that holds the page in the URL fragment. `PresenceCursor`
  shows a remote cursor, and an agent's tag says Agent.
- `ThemeProvider` and `useTheme` for React, from `agentic-design/react`. They set `data-theme`, keep the pick on the device, and sync it across tabs. `themeInitScript()` returns a script for the page head, so a saved dark pick never flashes light. React is an optional peer: the root entry and the CLI do not need it.
- A demo site from the Worker: tokens, primitives, patterns, app chrome, and an editor-like page with
  presence, an agent suggestion, and the share dialog. Run `npm run build` first, then
  `npx wrangler dev`.
- A CLI and an MCP server so an agent can read the tokens:
  `npx agentic-design tokens --format json`, `npx agentic-design contrast`,
  `npx agentic-design mcp`.
- An HTTP route, `GET /api/v1/tokens`, from a Cloudflare Worker.

## Limits

- `ToolbarOverflow` is a menu you fill. The toolbar does not measure itself or move buttons into it.
- `FileList` shows one page of `items`. It has no paging, selection, or drag and drop. A long file
  name is cut with an ellipsis, and the full name is in its `title`.
- A `DocumentTitle` in a dialog closes the dialog when Escape cancels a rename.
- `ShareDialog` is a view. It calls your handlers, and it does not store or send anything.
- The demo snapshot link is not compressed or encrypted, and it holds text only. The demo page
  opens it as a read-only copy after it checks the size, the shape, and every paragraph. It is
  a demonstration of the idea, not a finished link format.
- `parseInvitee` accepts printable ASCII only. An address with a non-ASCII letter is refused
  until it is supported.
- Fonts cover Latin and Latin Extended only, and only upright faces ship. Italic text is
  synthesized by the browser.
- `Checkbox` and `Switch` have no error state yet, so a required checkbox cannot show an
  accessible error with these controls.
- A toast raised while a modal dialog is open stays out of reach until the dialog closes,
  because a modal hides the rest of the page. Show an error inside the dialog instead.
- The contrast check covers the pairs listed in `src/tokens/tokens.ts`. Add a
  pair there when you add a new use of color.

## Develop

```sh
npm ci
npm run ci:local
```

`ci:local` builds first. Run `npm run build` before `npm run typecheck` on a clean checkout,
because the tests import `dist/`.

## License

MIT. Fonts are SIL OFL 1.1. See `THIRD_PARTY_NOTICES.md`.
