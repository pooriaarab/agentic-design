# agentic-design

[![MIT license](https://img.shields.io/badge/license-MIT-blue)](https://opensource.org/license/mit)

[Source](https://github.com/pooriaarab/agentic-design) · [Support](https://github.com/pooriaarab/agentic-design/issues)

Accessible design tokens and UI primitives for calm, minimal apps.

> Status: early. The design tokens, the contrast check, and the fonts work.
> The form controls work. The overlays, the app patterns, and the demo are not built yet.
> The package is not on npm yet.

## Install

The package is not on npm yet. Build it from a checkout and install the tarball:

```sh
npm ci && npm run build && npm pack
npm install ./agentic-design-0.0.0.tgz
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
  Checked states stay visible in Windows High Contrast.
- `ThemeProvider` and `useTheme` for React, from `agentic-design/react`. They set `data-theme`, keep the pick on the device, and sync it across tabs. `themeInitScript()` returns a script for the page head, so a saved dark pick never flashes light. React is an optional peer: the root entry and the CLI do not need it.
- A token page at `/` from the Worker. Run `npm run build` first, then `npx wrangler dev`.
- A CLI and an MCP server so an agent can read the tokens:
  `npx agentic-design tokens --format json`, `npx agentic-design contrast`,
  `npx agentic-design mcp`.
- An HTTP route, `GET /api/v1/tokens`, from a Cloudflare Worker.

## Limits

- Dialog, menu, tooltip, tabs, toast, and the app patterns are not built yet.
- Fonts cover Latin and Latin Extended only, and only upright faces ship. Italic text is
  synthesized by the browser.
- `Checkbox` and `Switch` have no error state yet, so a required checkbox cannot show an
  accessible error with these controls.
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
