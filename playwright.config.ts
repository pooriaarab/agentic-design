import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  reporter: "list",
  projects: [{ name: "node", testMatch: /(cli|mcp|mcp-bin|worker|theme-ssr|notices|safe-name|source-hygiene|invite|chrome|files)\.spec\.ts/ }],
});
