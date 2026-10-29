# agentic-design

[![npm version](https://img.shields.io/npm/v/agentic-design)](https://www.npmjs.com/package/agentic-design)
[![MIT license](https://img.shields.io/badge/license-MIT-blue)](https://opensource.org/license/mit)

[Package](https://www.npmjs.com/package/agentic-design) · [Source](https://github.com/pooriaarab/agentic-design) · [Support](https://github.com/pooriaarab/agentic-design/issues)

Accessible design tokens and UI primitives for calm, minimal apps.

> Status: early. The design tokens, the contrast check, and the fonts work.
> The form controls, the overlays, and most app patterns work. The share dialog and the editor demo are not built yet.
> The package is not on npm yet.

## Install

```sh
npm install agentic-design
```

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
  Checked and pressed states stay visible in Windows High Contrast.
- Overlays for React, on Radix UI (MIT): `Dialog`, `Menu`, `Tooltip`, `Tabs`, and
  a toast (`ToastProvider`, `useToast`). Dialogs trap focus and give it back. An
  icon button shows its label as a tooltip. An error toast stays until dismissed.
- App patterns for React: `AppShell` (sidebar, top bar, skip link, a menu button on narrow screens),
  `SidebarNav`, a roving-focus `Toolbar`, `EmptyState`, `FileList` and `FileRow`, and
  `PresenceChip` and `PresenceStack`. An agent shows as an agent by the word Agent in a
  pill and by a square avatar with a robot, never by color alone. Display names pass a
  closed allow-list (`usableName`): a name with a hidden text-direction character or a
  zero-width space shows as unnamed.
- `ThemeProvider` and `useTheme` for React, from `agentic-design/react`. They set `data-theme`, keep the pick on the device, and sync it across tabs. `themeInitScript()` returns a script for the page head, so a saved dark pick never flashes light. React is an optional peer: the root entry and the CLI do not need it.
- A token page at `/` from the Worker. Run `npm run build` first, then `npx wrangler dev`.
- A CLI and an MCP server so an agent can read the tokens:
  `npx agentic-design tokens --format json`, `npx agentic-design contrast`,
  `npx agentic-design mcp`.
- An HTTP route, `GET /api/v1/tokens`, from a Cloudflare Worker.

## Limits

- The share dialog and the editor demo are not built yet.
- Fonts cover Latin and Latin Extended only.
- The contrast check covers the pairs listed in `src/tokens/tokens.ts`. Add a
  pair there when you add a new use of color.

## Develop

```sh
npm ci
npm run ci:local
```

## License

MIT. Fonts are SIL OFL 1.1. See `THIRD_PARTY_NOTICES.md`.
