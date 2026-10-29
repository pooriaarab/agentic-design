#!/usr/bin/env node
import { VERSION } from "./version.js";

const HELP = `agentic-design-mcp ${VERSION}
Usage: agentic-design-mcp [mcp] [--help | --version]

Runs the MCP server on stdio. An MCP client starts it.
`;

// The `mcp` word may come first, as the package CLI takes it: `agentic-design-mcp mcp --help`.
const argv = process.argv.slice(2);
const args = argv[0] === "mcp" ? argv.slice(1) : argv;
const has = (...names: string[]) => args.some((a) => names.includes(a));

if (has("--version", "-V")) {
  process.stdout.write(`${VERSION}\n`);
} else if (has("--help", "-h")) {
  process.stdout.write(HELP);
} else {
  // Loaded only when serving, so --help and --version never pay for the server's imports.
  import("./mcp.js")
    .then(({ startMcp }) => startMcp())
    .catch((error: unknown) => {
      console.error(error instanceof Error ? error.message : String(error));
      process.exit(1);
    });
}
