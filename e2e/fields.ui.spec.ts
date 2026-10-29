import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { build } from "esbuild";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement as h, Fragment, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Checkbox, Input, Select, Switch, Textarea } from "../src/components/fields.js";

const css = readFileSync(new URL("../dist/styles.css", import.meta.url), "utf8");
const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

async function mount(page: Page, ...els: ReactElement[]) {
  const body = renderToStaticMarkup(h(Fragment, null, ...els));
  await page.setContent(`<!doctype html><html lang="en"><head><title>Fields</title><style>${css}</style></head><body><main>${body}</main></body></html>`);
}

// Controlled state needs React in the browser, so bundle a small harness once per worker.
const HARNESS = `
import { createElement as h, Fragment, useState } from "react";
import { createRoot } from "react-dom/client";
import { Checkbox, Input, Select, Switch, Textarea } from "./fields.js";

const fields = { Input, Textarea, Select, Checkbox, Switch };
const opts = [h("option", { key: "a", value: "a" }, "Viewer"), h("option", { key: "b", value: "b" }, "Editor")];

function Controlled({ kind }) {
  const [text, setText] = useState(kind === "Select" ? "a" : "start");
  const [on, setOn] = useState(false);
  const isToggle = kind === "Checkbox" || kind === "Switch";
  const props = isToggle
    ? { label: "Name", checked: on, onChange: (e) => setOn(e.currentTarget.checked) }
    : { label: "Name", value: text, onChange: (e) => setText(e.currentTarget.value) };
  // Each click changes the parent value again, so a test can set it and then set it back.
  const parentSet = () => {
    if (isToggle) return setOn(!on);
    if (kind === "Select") return setText(text === "b" ? "a" : "b");
    return setText(text === "from parent" ? "" : "from parent");
  };
  return h(Fragment, null,
    kind === "Select" ? h(Select, props, opts) : h(fields[kind], props),
    h("output", { id: "state" }, isToggle ? String(on) : text),
    h("button", { type: "button", onClick: parentSet }, "Set from parent"),
  );
}

window.mountControlled = (kind) => createRoot(document.getElementById("root")).render(h(Controlled, { kind }));
`;

let harness: Promise<string> | undefined;
const bundleHarness = () => build({
  stdin: { contents: HARNESS, resolveDir: fileURLToPath(new URL("../src/components/", import.meta.url)), loader: "tsx" },
  bundle: true,
  write: false,
  format: "iife",
  platform: "browser",
  define: { "process.env.NODE_ENV": '"development"' },
}).then((out) => out.outputFiles[0].text);

async function mountControlled(page: Page, kind: string) {
  await page.setContent(`<!doctype html><html lang="en"><head><title>Controlled</title><style>${css}</style></head><body><main><div id="root"></div></main></body></html>`);
  harness ??= bundleHarness();
  await page.addScriptTag({ content: await harness });
  await page.evaluate((k) => (window as unknown as { mountControlled: (k: string) => void }).mountControlled(k), kind);
}

const opts = [h("option", { key: "a", value: "a" }, "Viewer"), h("option", { key: "b", value: "b" }, "Editor")];

const kinds = [
  { name: "Input", role: "textbox", make: (p: object) => h(Input, { label: "Name", ...p }) },
  { name: "Textarea", role: "textbox", make: (p: object) => h(Textarea, { label: "Name", ...p }) },
  { name: "Select", role: "combobox", make: (p: object) => h(Select, { label: "Name", ...p }, opts) },
];

for (const k of kinds) {
  test.describe(k.name, () => {
    test("the label names the control", async ({ page }) => {
      await mount(page, k.make({}));
      await expect(page.getByRole(k.role as "textbox", { name: "Name" })).toBeVisible();
      await expect(page.getByText("Name", { exact: true })).toHaveAttribute("for", /.+/);
    });

    test("a given id ties the label to the control", async ({ page }) => {
      await mount(page, k.make({ id: "mine" }));
      await expect(page.locator("#mine")).toHaveAccessibleName("Name");
    });

    test("hint and error are the accessible description, and the error sets aria-invalid", async ({ page }) => {
      await mount(page, k.make({ hint: "Shown to others.", error: "Enter a name." }));
      const c = page.getByLabel("Name");
      await expect(c).toHaveAttribute("aria-invalid", "true");
      await expect(c).toHaveAccessibleDescription("Shown to others. Enter a name.");
      await expect(page.getByRole("alert")).toHaveText("Enter a name.");
    });

    test("no hint or error means no description and no invalid flag", async ({ page }) => {
      await mount(page, k.make({}));
      const c = page.getByLabel("Name");
      await expect(c).not.toHaveAttribute("aria-describedby", /.*/);
      await expect(c).not.toHaveAttribute("aria-invalid", /.*/);
    });

    test("the caller's aria-describedby joins the generated one", async ({ page }) => {
      await mount(page, k.make({ hint: "Shown to others.", "aria-describedby": "note" }), h("p", { id: "note" }, "Extra note."));
      await expect(page.getByLabel("Name")).toHaveAccessibleDescription("Shown to others. Extra note.");
    });

    test("required is exposed and the star is hidden from the name", async ({ page }) => {
      await mount(page, k.make({ required: true }));
      const c = page.getByLabel("Name");
      await expect(c).toHaveAttribute("required", "");
      await expect(c).toHaveAccessibleName("Name");
      await expect(page.locator("label span[aria-hidden]")).toBeVisible();
    });

    test("disabled is not focusable by keyboard", async ({ page }) => {
      await mount(page, k.make({ disabled: true }), h("button", null, "After"));
      await expect(page.getByLabel("Name")).toBeDisabled();
      await page.keyboard.press("Tab");
      await expect(page.getByRole("button", { name: "After" })).toBeFocused();
    });

    test("Tab reaches the control", async ({ page }) => {
      await mount(page, k.make({}));
      await page.keyboard.press("Tab");
      await expect(page.getByLabel("Name")).toBeFocused();
    });

    test("an empty label throws", () => {
      expect(() => renderToStaticMarkup(k.make({ label: "  " }))).toThrow(/non-empty label/);
    });

    test("axe finds nothing, with hint, error and required", async ({ page }) => {
      await mount(page, k.make({ hint: "Shown to others.", error: "Enter a name.", required: true }));
      expect((await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()).violations).toEqual([]);
    });
  });
}

test("Input types and Textarea keep what the user types", async ({ page }) => {
  await mount(page, h(Input, { label: "Email", type: "email" }), h(Textarea, { label: "Notes" }));
  await page.getByLabel("Email").fill("a@b.org");
  await page.getByLabel("Notes").fill("one\ntwo");
  await expect(page.getByLabel("Email")).toHaveValue("a@b.org");
  await expect(page.getByLabel("Notes")).toHaveValue("one\ntwo");
});

test("a Select hides its label from sight but keeps it in the name", async ({ page }) => {
  await mount(page, h(Select, { label: "Role", hideLabel: true }, opts));
  await expect(page.getByRole("combobox", { name: "Role" })).toBeVisible();
  await expect(page.locator("label")).toHaveClass(/ad-sr-only/);
  const box = await page.locator("label").boundingBox();
  expect(box === null || (box.width <= 1 && box.height <= 1)).toBe(true);
});

test("a Select changes with the arrow keys", async ({ page }) => {
  await mount(page, h(Select, { label: "Role", defaultValue: "a" }, opts));
  await page.getByLabel("Role").focus();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByLabel("Role")).toHaveValue("b");
});

for (const [name, role, C] of [["Checkbox", "checkbox", Checkbox], ["Switch", "switch", Switch]] as const) {
  test.describe(name, () => {
    test("the label names the control and the hint describes it", async ({ page }) => {
      await mount(page, h(C, { label: "Notify me", hint: "Once a day." }));
      const c = page.getByRole(role, { name: "Notify me" });
      await expect(c).toHaveAccessibleDescription("Once a day.");
    });

    test("clicking the label toggles the control", async ({ page }) => {
      await mount(page, h(C, { label: "Notify me" }));
      await page.getByText("Notify me").click();
      await expect(page.getByRole(role)).toBeChecked();
    });

    test("Space toggles it, and Tab reaches it", async ({ page }) => {
      await mount(page, h(C, { label: "Notify me" }));
      await page.keyboard.press("Tab");
      await expect(page.getByRole(role)).toBeFocused();
      await page.keyboard.press("Space");
      await expect(page.getByRole(role)).toBeChecked();
      await page.keyboard.press("Space");
      await expect(page.getByRole(role)).not.toBeChecked();
    });

    test("disabled blocks the keyboard and the click", async ({ page }) => {
      await mount(page, h(C, { label: "Notify me", disabled: true }));
      await expect(page.getByRole(role)).toBeDisabled();
      await page.getByText("Notify me").click({ force: true });
      await expect(page.getByRole(role)).not.toBeChecked();
      await page.keyboard.press("Tab");
      await expect(page.getByRole(role)).not.toBeFocused();
      await page.keyboard.press("Space");
      await expect(page.getByRole(role)).not.toBeChecked();
    });

    test("required is exposed", async ({ page }) => {
      await mount(page, h(C, { label: "Agree", required: true }));
      await expect(page.getByRole(role)).toHaveAttribute("required", "");
      await expect(page.getByRole(role)).toHaveAccessibleName("Agree");
      await expect(page.locator("label span[aria-hidden]")).toBeVisible();
    });

    test("the caller's aria-describedby joins the hint", async ({ page }) => {
      await mount(page, h(C, { label: "Notify me", hint: "Once a day.", "aria-describedby": "n" }), h("p", { id: "n" }, "More."));
      await expect(page.getByRole(role)).toHaveAccessibleDescription("Once a day. More.");
    });

    test("an empty label throws", () => {
      expect(() => renderToStaticMarkup(h(C, { label: "" }))).toThrow(/non-empty label/);
    });

    test("axe finds nothing, on and off, with a hint", async ({ page }) => {
      await mount(page, h(C, { label: "On one", hint: "Hint.", defaultChecked: true }), h(C, { label: "Off one" }), h(C, { label: "Locked", disabled: true }));
      expect((await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()).violations).toEqual([]);
    });
  });
}

test("every field passes axe in the dark scheme", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await mount(page, h(Input, { label: "Name", error: "Enter a name.", hint: "Hint." }), h(Select, { label: "Role" }, opts), h(Switch, { label: "Agents" }), h(Checkbox, { label: "Replies" }), h(Textarea, { label: "Notes", disabled: true }));
  expect((await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()).violations).toEqual([]);
});

test("the dark scheme really changes the page colors", async ({ page }) => {
  await mount(page, h(Input, { label: "Name" }));
  await page.emulateMedia({ colorScheme: "light" });
  const light = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  await page.emulateMedia({ colorScheme: "dark" });
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).not.toBe(light);
});

test("an error alone describes the control, and the caller's aria-invalid is kept", async ({ page }) => {
  await mount(page, h(Input, { label: "Name", error: "Enter a name." }), h(Input, { label: "Phone", "aria-invalid": true }));
  await expect(page.getByLabel("Name")).toHaveAccessibleDescription("Enter a name.");
  await expect(page.getByLabel("Phone")).toHaveAttribute("aria-invalid", "true");
});

const controlled = [
  { kind: "Input", role: "textbox", change: (p: Page) => p.getByLabel("Name").fill("Ada"), typed: "Ada", parent: ["from parent", ""] },
  { kind: "Textarea", role: "textbox", change: (p: Page) => p.getByLabel("Name").fill("Ada"), typed: "Ada", parent: ["from parent", ""] },
  { kind: "Select", role: "combobox", change: (p: Page) => p.getByLabel("Name").selectOption("b"), typed: "b", parent: ["b", "a"] },
  { kind: "Checkbox", role: "checkbox", change: (p: Page) => p.getByLabel("Name").check(), typed: "true", parent: ["true", "false"] },
  { kind: "Switch", role: "switch", change: (p: Page) => p.getByLabel("Name").check(), typed: "true", parent: ["true", "false"] },
] as const;

for (const c of controlled) {
  test.describe(`${c.kind} as a controlled component`, () => {
    test("a user change reaches the parent state and the control shows it", async ({ page }) => {
      await mountControlled(page, c.kind);
      await c.change(page);
      await expect(page.locator("#state")).toHaveText(c.typed);
      if (c.role === "checkbox" || c.role === "switch") {
        await expect(page.getByRole(c.role, { name: "Name" })).toBeChecked();
      } else {
        await expect(page.getByLabel("Name")).toHaveValue(c.typed);
      }
    });

    test("a change made by the parent reaches the control, both ways", async ({ page }) => {
      await mountControlled(page, c.kind);
      for (const expected of c.parent) {
        await page.getByRole("button", { name: "Set from parent" }).click();
        await expect(page.locator("#state")).toHaveText(expected);
        if (c.role === "checkbox" || c.role === "switch") {
          await expect(page.getByRole(c.role, { name: "Name" })).toBeChecked({ checked: expected === "true" });
        } else {
          await expect(page.getByLabel("Name")).toHaveValue(expected);
        }
      }
    });
  });
}
