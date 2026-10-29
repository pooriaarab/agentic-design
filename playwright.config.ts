import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  reporter: "list",
  projects: [{ name: "node", testMatch: /(cli|mcp|mcp-flags|mcp-bin|worker|theme-ssr|notices|safe-name|source-hygiene|invite|chrome|files|calm-contrast|tabs-ssr|virtual-window)\.spec\.ts/ }],
});
