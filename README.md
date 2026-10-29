# agentic-design

[![npm version](https://img.shields.io/npm/v/agentic-design)](https://www.npmjs.com/package/agentic-design)
[![MIT license](https://img.shields.io/badge/license-MIT-blue)](https://opensource.org/license/mit)

[Package](https://www.npmjs.com/package/agentic-design) · [Source](https://github.com/pooriaarab/agentic-design) · [Support](https://github.com/pooriaarab/agentic-design/issues)

Accessible design tokens and UI primitives for calm, minimal apps.

> Status: early. The design tokens, the contrast check, and the fonts work.
> The React primitives, the app patterns, and the demo are not built yet.
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
- `ThemeProvider` and `useTheme` for React. They set `data-theme` and keep the pick on the device.
- A token page at `/` from the Worker (`npm run build`, then `npx wrangler dev`).
- A CLI and an MCP server so an agent can read the tokens:
  `npx agentic-design tokens --format json`, `npx agentic-design contrast`,
  `npx agentic-design mcp`.
- An HTTP route, `GET /api/v1/tokens`, from a Cloudflare Worker.

## Limits

- No React components yet, apart from the theme provider.
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
