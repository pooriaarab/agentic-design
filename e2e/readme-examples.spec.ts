import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

// Each tsx block in the App chrome section of the README is a whole module. A reader copies it, so it must compile.
const readme = readFileSync("README.md", "utf8");
const section = readme.slice(readme.indexOf("## App chrome"), readme.indexOf("## Features"));
const blocks = [...section.matchAll(/```tsx\n([\s\S]*?)```/g)].map((m) => m[1] as string);
const dir = "e2e-artifacts/readme-examples";

test("the App chrome section has an example for each part", () => {
  expect(blocks.length).toBe(6);
  for (const part of ["AppShell", "Toolbar", "DocumentTitle", "ShareDialog", "FileList", "AgentBadge"]) {
    expect(blocks.some((b) => b.includes(`<${part}`)), part).toBe(true);
  }
});

test("every example compiles against the built types", () => {
  // The types come from dist/, so a missing build is an error here, not a pass.
  expect(existsSync("dist/react.d.ts"), "run npm run build first").toBe(true);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  blocks.forEach((code, i) => writeFileSync(`${dir}/example-${i}.tsx`, code));
  writeFileSync(
    `${dir}/tsconfig.json`,
    JSON.stringify({
      compilerOptions: { target: "ES2022", module: "ESNext", moduleResolution: "Bundler", jsx: "react-jsx", strict: true, noEmit: true, skipLibCheck: true, lib: ["ES2022", "DOM"], baseUrl: ".", paths: { "agentic-design/react": ["../../dist/react.d.ts"] } },
      include: ["*.tsx"],
    }),
  );
  // tsc exits non-zero and prints the errors when an example does not compile.
  expect(() => execFileSync("npx", ["tsc", "-p", `${dir}/tsconfig.json`], { stdio: "pipe", encoding: "utf8" })).not.toThrow();
});
