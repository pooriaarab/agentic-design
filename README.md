# agentic-design

[![MIT license](https://img.shields.io/badge/license-MIT-blue)](https://opensource.org/license/mit)

[Live demo](https://agentic-design-demo.hello-fd1.workers.dev) · [Source](https://github.com/pooriaarab/agentic-design) · [Support](https://github.com/pooriaarab/agentic-design/issues)

Accessible design tokens and UI primitives for calm, minimal apps.

> Status: 0.7.1. The design tokens, the contrast check, and the fonts work.
> The tokens, the controls, the overlays, the app patterns, the app chrome, the file table and grid, the share dialog, and the editor demo work.
> See [CHANGELOG.md](CHANGELOG.md) for what is in this release, its breaking changes, and its limits.

## Install

Run `npm install agentic-design`.

## Quick start

Import the stylesheet once. It holds the fonts, the tokens, and base rules.

```js
import "agentic-design/styles.css";
```

To use the tokens alone, import `agentic-design/tokens.css` instead. It sets the custom properties
and the `color-scheme` for each theme. It loads no fonts, no base rules, and sets no font on any
element. Apply a font token in your own CSS, for example `font-family: var(--agd-font-family-sans)`.
The font tokens use the family names `Inter Variable` and `JetBrains Mono Variable`. Register your
font files under those names, or set the two tokens yourself.

```js
import "agentic-design/tokens.css";
```

Use a token in your own CSS:

```css
.card {
  background: var(--agd-color-surface);
  border: 1px solid var(--agd-color-border);
  border-radius: var(--agd-radius-md);
  padding: var(--agd-space-4);
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
- App patterns for React: `AppShell` (sidebar, top bar, skip link, a menu button on narrow screens),
  `SidebarNav`, a roving-focus `Toolbar`, `EmptyState`, `FileList` and `FileRow`, and
  `PresenceChip` and `PresenceStack`. A chip shows an agent by the word Agent in a pill, a
  square avatar with a robot, and who it acts for, never by color alone. The stack is a row of
  avatars: the shape shows an agent, and the name of each avatar and the count in words say
  who is an agent and who it acts for. A name can still resemble another where a script
  needs a joiner, so show an account handle where two people must be told apart. Display names pass a
  closed allow-list (`usableName`): a name with a hidden text-direction character or a
  zero-width space shows as unnamed.
- App chrome for React: `AppShell` takes a `title` slot in the top bar and a side `panel` with a
  `panelLabel`, which must not be blank (from 64rem the panel sits beside the content, and below that it
  sits under it). `DocumentTitle` renames in place: Enter, Space, or F2 opens the field, and Escape
  cancels. `AgentBadge` marks anything an agent made, with the words "Made by an agent" by default, a
  square avatar, and who the agent acts for. A custom `label` should say that an agent made the item. A `Toolbar` takes `ToolbarGroup` for named
  groups of buttons and `ToolbarOverflow` for a "More tools" menu.
- Landmarks and links: `AppShell` puts `brand` first in the top bar, inside the banner landmark.
  `SidebarNav` renders plain anchors. To use a router link, pass `linkComponent`, or pass
  `renderLink={(props, item) => <Link to={props.href} className={props.className} aria-current={props["aria-current"]}>{props.children}</Link>}`.
  `renderLink` wins over `linkComponent`. Keep `className` and `aria-current` on the element you render.
- File lists for React: `FileList` with `items` shows a table with sortable column headers (name, owner,
  modified). Pass `view="grid"` for a grid with a "Sort by" select. `loading` shows placeholders, and
  `empty` replaces the default empty state. `locale` (default `en`) sets the date and sort language.
  Pass `FileRow` children for a plain list.
- `DataTable` for React: a grid for many rows. Only the rows in view are in the page, so 10,000 rows scroll
  smoothly. Pass `rows`, `columns`, and `getRowId`. Add `selectable` for a checkbox column, select-all, and a
  bar at the bottom with your `bulkActions` and "Clear selection". `loading` shows placeholders and says so to a
  screen reader. `empty` replaces the default empty state. The rows are one tab stop (with `selectable`, select-all is another). Arrow keys, Home, End,
  and Page Up and Down move between rows. Space selects a row (with Shift, a range), Enter calls `onRowActivate`,
  and Escape clears the selection. Keep focusable controls out of cells, because each one adds a tab stop.
  A selection keeps the ids of rows that leave the list, and they count again when the rows return.

```tsx
<DataTable
  label="Tasks"
  rows={tasks}
  columns={[{ id: "title", header: "Title", cell: (t) => t.title }]}
  getRowId={(t) => t.id}
  selectable
  bulkActions={(ids) => <Button size="sm" onClick={() => archive(ids)}>Archive</Button>}
/>
```

- `ShareDialog`: people and agents with roles, an invite field (an email invites a person, an
  `@handle` invites an agent, and anything else is refused), a link with role, expiry, and a
  sign-in rule, and a snapshot link that holds the page in the URL fragment. `PresenceCursor`
  shows a remote cursor, and an agent's tag says Agent.
- `ThemeProvider` and `useTheme` for React, from `agentic-design/react`. They set `data-theme`, keep the pick on the device, and sync it across tabs. `themeInitScript()` returns a script for the page head, so a saved dark pick never flashes light. React is an optional peer: the root entry and the CLI do not need it.
- A demo site from the Worker: tokens, primitives, patterns, app chrome, and an editor-like page with
  presence, an agent suggestion, and the share dialog. It runs live at
  https://agentic-design-demo.hello-fd1.workers.dev. To run it here, run `npm run build`, then
  `npx wrangler dev`.
- A CLI and an MCP server so an agent can read the tokens:
  `npx agentic-design tokens --format json`, `npx agentic-design contrast`,
  `npx agentic-design mcp`.
- An HTTP route, `GET /api/v1/tokens`, from a Cloudflare Worker.

## Limits

- `DataTable` rows have one fixed height (`rowHeight`), so a cell cannot wrap. It does not sort or fetch pages.
- `ShareDialog` is a view. It calls your handlers, and it does not store or send anything.
- `FileList` sorts only the `items` you pass, and only when it is not controlled. If you pass `sort`,
  your code must sort `items` itself. It does not paginate.
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
