import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { checkContrast, tokensCss, tokensJson } from "./tokens/index.js";
import { VERSION } from "./version.js";

function ok(value: unknown): { content: { type: "text"; text: string }[] } {
  return { content: [{ type: "text", text: typeof value === "string" ? value : JSON.stringify(value) }] };
}

export function createMcpServer(): McpServer {
  const server = new McpServer({ name: "agentic-design", version: VERSION });

  server.registerTool(
    "get_tokens",
    {
      description: "Read the design tokens: semantic colors for light and dark, shadows, and scales.",
      inputSchema: { format: z.enum(["json", "css"]).default("json").describe("Output format.") },
      annotations: { readOnlyHint: true },
    },
    async ({ format }) => ok(format === "css" ? tokensCss() : tokensJson()),
  );

  server.registerTool(
    "check_contrast",
    {
      description: "Check every text and background pair in both themes against WCAG 2.2 AA.",
      inputSchema: {},
      annotations: { readOnlyHint: true },
    },
    async () => {
      const results = checkContrast();
      return ok({ pass: results.every((r) => r.pass), failures: results.filter((r) => !r.pass) });
    },
  );

  return server;
}

export async function startMcp(): Promise<void> {
  await createMcpServer().connect(new StdioServerTransport());
}
