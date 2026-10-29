import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  reporter: "list",
  projects: [{ name: "node", testMatch: /(cli|mcp|worker|theme-ssr|safe-name|source-hygiene|invite)\.spec\.ts/ }],
});
