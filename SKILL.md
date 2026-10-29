---
name: agentic-design
description: Accessible design tokens and UI primitives for calm, minimal apps. Keywords: design-system,tokens,ui,accessibility,wcag,react,components,minimal,dark-mode.
---

# agentic-design

Accessible design tokens and UI primitives for calm, minimal apps.

## Use the CSS

```js
import "agentic-design/styles.css";
```

```css
.panel { background: var(--ad-color-surface); color: var(--ad-color-text); }
```

Set `data-theme="dark"` on `<html>` for dark. Leave it off to follow the system.

## Use the tokens in code

```ts
import { themes, scale } from "agentic-design/tokens";
```

## Use the React parts

```tsx
import { Button, Dialog, PresenceChip, ShareDialog } from "agentic-design/react";
```

Show an agent with `PresenceChip entry={{ kind: "agent", ... }}`. It adds the word Agent and a
square avatar. A name from a peer passes `usableName` first.

## Use the CLI and MCP

```sh
npx agentic-design tokens --format json
npx agentic-design contrast
npx agentic-design mcp
```

## Rules

- Use semantic tokens only.
- Run the contrast check after a color change.
- Never signal state by color alone.
