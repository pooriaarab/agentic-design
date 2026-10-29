import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    tokens: "src/tokens/index.ts",
    react: "src/react.ts",
    cli: "src/cli.ts",
    mcp: "src/mcp.ts",
    "mcp-bin": "src/mcp-bin.ts",
    worker: "src/worker.ts",
  },
  format: ["esm"],
  dts: true,
  clean: true,
  onSuccess: "node scripts/build-assets.mjs",
});
