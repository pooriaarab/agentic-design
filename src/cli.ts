#!/usr/bin/env node
import { realpathSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { checkContrast, tokensCss, tokensJson } from "./tokens/index.js";
import { VERSION } from "./version.js";

const HELP = `agentic-design ${VERSION}
Accessible design tokens and UI primitives for calm, minimal apps.

Usage: agentic-design <command> [flags]

Commands:
  tokens [--format css|json]  Print the design tokens. Default format is css.
  contrast                    Check every text and background pair. Print JSON.
  mcp                         Start the MCP server on stdio.

Flags:
  --help, -h     Print this help.
  --version, -V  Print the version.`;

export async function runCli(argv: string[], out = console.log, err = console.error): Promise<number> {
  const [command, ...rest] = argv;
  if (command === undefined || command === "--help" || command === "-h") {
    out(HELP);
    return 0;
  }
  if (command === "--version" || command === "-V") {
    out(VERSION);
    return 0;
  }
  if (command === "tokens") {
    const flag = rest.length === 0 ? "css" : rest.length === 2 && rest[0] === "--format" ? rest[1] : undefined;
    if (flag !== "css" && flag !== "json") {
      err('tokens takes "--format css" or "--format json".');
      return 2;
    }
    out(flag === "css" ? tokensCss() : JSON.stringify(tokensJson(), null, 2));
    return 0;
  }
  if (command === "contrast" && rest.length === 0) {
    const results = checkContrast();
    out(JSON.stringify(results.map((r) => ({ ...r, ratio: Number(r.ratio.toFixed(2)) })), null, 2));
    return results.every((r) => r.pass) ? 0 : 1;
  }
  if (command === "mcp" && rest.length === 0) {
    const { startMcp } = await import("./mcp.js");
    await startMcp();
    return 0;
  }
  err(`Unknown command "${command}". Run "agentic-design --help".`);
  return 2;
}

function isMainModule(): boolean {
  const invoked = process.argv[1];
  if (typeof invoked !== "string") return false;
  try {
    return import.meta.url === pathToFileURL(realpathSync(invoked)).href;
  } catch {
    return false;
  }
}

if (isMainModule()) {
  runCli(process.argv.slice(2)).then(
    (code) => {
      // On zero, fall off the end so a running MCP server keeps its stdio open.
      if (code !== 0) process.exit(code);
    },
    (error: unknown) => {
      console.error(error instanceof Error ? error.message : String(error));
      process.exit(1);
    },
  );
}
