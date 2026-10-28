import { defineConfig } from "@playwright/test";

const port = 8788;

export default defineConfig({
  testDir: "e2e",
  testMatch: /.*\.ui\.spec\.ts/,
  reporter: "list",
  outputDir: "e2e-artifacts",
  use: { baseURL: `http://127.0.0.1:${port}` },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
  webServer: {
    command: `npx wrangler dev --port ${port} --ip 127.0.0.1`,
    env: { WRANGLER_SEND_METRICS: "false", CI: "1" },
    url: `http://127.0.0.1:${port}/health`,
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
