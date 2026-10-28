import { readFileSync } from "node:fs";
import { defineConfig } from "tsup";

const pkg = JSON.parse(
  readFileSync(new URL("./package.json", import.meta.url), "utf8"),
) as { version: string };

export default defineConfig({
  entry: {
    index: "src/index.ts",
    tokens: "src/tokens/index.ts",
    cli: "src/cli.ts",
    mcp: "src/mcp.ts",
    "mcp-bin": "src/mcp-bin.ts",
    worker: "src/worker.ts",
  },
  format: ["esm"],
  dts: true,
  clean: true,
  define: {
    __PACK_VERSION__: JSON.stringify(pkg.version),
  },
  onSuccess: "node scripts/build-css.mjs",
});
