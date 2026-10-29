#!/usr/bin/env node
import { VERSION } from "./version.js";

const HELP = `agentic-design-mcp ${VERSION}
Usage: agentic-design-mcp [--help | --version]

Runs the MCP server on stdio. An MCP client starts it.
`;

// The `mcp` word may come first, as the package CLI takes it: `agentic-design-mcp mcp --help`.
const [first, second] = process.argv.slice(2);
const flag = first === "mcp" ? second : first;
if (flag === "--version" || flag === "-V") {
  process.stdout.write(`${VERSION}\n`);
} else if (flag === "--help" || flag === "-h") {
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
