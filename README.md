# agentic-design

[![npm version](https://img.shields.io/npm/v/agentic-design)](https://www.npmjs.com/package/agentic-design)
[![MIT license](https://img.shields.io/badge/license-MIT-blue)](https://opensource.org/license/mit)

[Package](https://www.npmjs.com/package/agentic-design) · [Source](https://github.com/pooriaarab/agentic-design) · [Support](https://github.com/pooriaarab/agentic-design/issues)

Accessible design tokens and UI primitives for calm, minimal apps.

> Status: scaffold. This repository holds the starter code only. It is not on npm
> yet, and none of the features below work yet.

## Planned features

- Design tokens for color, type, space, and motion, with light and dark themes.
- Accessible primitives that meet WCAG 2.2 AA.
- Self-hosted fonts and assets, with no remote calls.
- A small set of app patterns: shell, sidebar, toolbar, dialog, menu, toast.
- Presence chips that label agents as agents.

## Surfaces

One package gives you each way in:

- **Library and SDK**: `import { ... } from "agentic-design"`.
- **CLI**: `npx agentic-design --help`.
- **MCP server**: `npx agentic-design mcp`, for Claude Code and other MCP clients.
- **HTTP API**: a Cloudflare Worker you deploy to your own account.
- **Web UI**: a small app served by the same Worker.

## Develop

```sh
npm ci
npm run build && npm run typecheck && npm test
```

## License

MIT.
