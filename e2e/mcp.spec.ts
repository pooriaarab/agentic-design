import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { expect, test } from "@playwright/test";

test("the MCP server over stdio serves tokens and the contrast check", async () => {
  const client = new Client({ name: "e2e", version: "0.0.0" });
  await client.connect(new StdioClientTransport({ command: "node", args: ["dist/cli.js", "mcp"] }));
  try {
    const { tools } = await client.listTools();
    expect(tools.map((t) => t.name).sort()).toEqual(["check_contrast", "get_tokens"]);

    const tokens = await client.callTool({ name: "get_tokens", arguments: {} });
    const body = JSON.parse((tokens.content as { text: string }[])[0].text);
    expect(Object.keys(body.themes)).toEqual(["light", "dark"]);

    const contrast = await client.callTool({ name: "check_contrast", arguments: {} });
    expect(JSON.parse((contrast.content as { text: string }[])[0].text)).toEqual({ pass: true, failures: [] });
  } finally {
    await client.close();
  }
});
