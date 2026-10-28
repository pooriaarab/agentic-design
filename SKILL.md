---
name: agentic-design
description: Accessible design tokens and UI primitives for calm, minimal apps. Keywords: design-system,tokens,ui,accessibility,wcag,react,components,minimal,dark-mode.
---

# agentic-design

Accessible design tokens and UI primitives for calm, minimal apps.

## Use the SDK

```js
import { summarizeText, dispatchText } from "agentic-design";

summarizeText("some text");
await dispatchText("some text", { dryRun: true });
```

## Use the CLI

```sh
agentic-design summary --text "some text"
agentic-design dispatch --text "some text" --dry-run
```

## Use the MCP server

Start the server with `agentic-design mcp`. Call `summarize_text`
for stats, `dispatch_text` for routes, `get_cost_report` for costs.

## Rules

- Preview each route with dry run first.
- Report guard denials and adapter errors as failures.
- Read the cost report at the end.
