#!/usr/bin/env node
import { VERSION } from "./version.js";

const HELP = `agentic-design-mcp ${VERSION}
Usage: agentic-design-mcp [mcp] [--help | --version]

Runs the MCP server on stdio. An MCP client starts it.
`;

// The `mcp` word may come first, as the package CLI takes it: `agentic-design-mcp mcp --help`.
const argv = process.argv.slice(2);
const mcpWord = argv[0] === "mcp";
const args = mcpWord ? argv.slice(1) : argv;
// Without the mcp word, only the first argument is a flag, as before. After it, every argument is read, as the package CLI does.
const flags = mcpWord ? args : args.slice(0, 1);
const has = (...names: string[]) => flags.some((a) => names.includes(a));

if (has("--help", "-h")) {
  process.stdout.write(HELP);
} else if (has("--version", "-V")) {
  process.stdout.write(`${VERSION}\n`);
} else {
  // Loaded only when serving, so --help and --version never pay for the server's imports.
  import("./mcp.js")
    .then(({ startMcp }) => startMcp())
    .catch((error: unknown) => {
      console.error(error instanceof Error ? error.message : String(error));
      process.exit(1);
    });
}
