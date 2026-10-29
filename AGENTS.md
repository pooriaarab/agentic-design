# agentic-design agent guide

Accessible design tokens and UI primitives for calm, minimal apps.

## Mental model

Tokens are the source of truth. They live in `src/tokens/tokens.ts`. The build
turns them into CSS variables. The CLI, the MCP server, and the Worker all read
the same object, so each returns the same shape.

## The faces

- Library: `import { themes, scale } from "agentic-design/tokens"`. React parts come from `agentic-design/react`.
- CSS: `import "agentic-design/styles.css"`, then use `var(--agd-color-*)`.
- CLI: `npx agentic-design tokens --format json`.
- MCP: `npx agentic-design mcp`, then call a tool below.
- HTTP: `GET /api/v1/tokens`.

Keywords: design-system,tokens,ui,accessibility,wcag,react,components,minimal,dark-mode.

## MCP tools

| Tool | Use it for |
| --- | --- |
| get_tokens | Read the tokens as JSON or CSS. |
| check_contrast | Check every text and background pair against WCAG 2.2 AA. |

## Rules

- Use semantic tokens only. Never use a hex value or a palette step in a component.
- Add a contrast pair in `src/tokens/tokens.ts` for each new color use.
- Run `npm run check:contrast` after any color change. Do not lower a minimum to pass.
- Never load a font or asset from a remote host.
- Never use color as the only signal. Pair it with text, a shape, or an icon.
- Show an agent as an agent wherever there is room for its name: the word Agent, a square avatar, and who it acts for. Where there is room for only an avatar, use the square shape and put the same facts in its name.
- Treat a peer display name as hostile. Pass it through `usableName` before you show it.
