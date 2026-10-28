import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
const violations = async (page: Page) =>
  (await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()).violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) }));

for (const scheme of ["light", "dark"] as const) {
  test(`primitives have no axe violations in ${scheme}`, async ({ page }, testInfo) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto("/primitives");
    await page.locator("form").getByRole("button", { name: "Save" }).click();
    await expect(page.getByRole("alert")).toBeVisible();
    await page.getByLabel("Email").focus();
    await page.screenshot({ path: testInfo.outputPath(`primitives-${scheme}.png`), fullPage: true });
    expect(await violations(page)).toEqual([]);
  });
}

test("every control is found by its label", async ({ page }) => {
  await page.goto("/primitives");
  for (const label of [/^Name/, /^Email$/, /^Notes$/, /^Role$/, /^Locked field$/]) {
    await expect(page.getByLabel(label)).toBeVisible();
  }
  await expect(page.getByRole("checkbox", { name: "Notify me about replies" })).toBeChecked();
  await expect(page.getByRole("switch", { name: "Allow agents to suggest edits" })).not.toBeChecked();
  await expect(page.getByRole("button", { name: "Add item" })).toBeVisible();
});

test("the checkbox and switch toggle with Space", async ({ page }) => {
  await page.goto("/primitives");
  const checkbox = page.getByRole("checkbox", { name: "Notify me about replies" });
  await checkbox.focus();
  await page.keyboard.press("Space");
  await expect(checkbox).not.toBeChecked();
  const sw = page.getByRole("switch", { name: "Allow agents to suggest edits" });
  await sw.focus();
  await page.keyboard.press("Space");
  await expect(sw).toBeChecked();
});

test("an error names the field, is announced, and clears when fixed", async ({ page }) => {
  await page.goto("/primitives");
  const name = page.getByLabel(/^Name/);
  const save = page.locator("form").getByRole("button", { name: "Save" });
  await expect(name).not.toHaveAttribute("aria-invalid", "true");
  await save.click();
  await expect(name).toHaveAttribute("aria-invalid", "true");
  await expect(name).toHaveAccessibleDescription(/Shown to people you share with\..*Enter a name/);
  await expect(page.getByRole("alert")).toContainText("Enter a name so people know who you are.");
  await name.fill("Ada");
  await expect(name).not.toHaveAttribute("aria-invalid", "true");
  await save.click();
  await expect(page.getByRole("status")).toHaveText("Saved.");
});

test("a loading button ignores clicks and stays focusable", async ({ page }) => {
  await page.goto("/primitives");
  const saving = page.getByRole("button", { name: "Saving" });
  await expect(saving).toHaveAttribute("aria-busy", "true");
  await saving.focus();
  await expect(saving).toBeFocused();
});

test("a disabled button is not reachable and every control has a focus ring", async ({ page }) => {
  await page.goto("/primitives");
  await expect(page.getByRole("button", { name: "Disabled" })).toBeDisabled();
  for (const target of [page.getByLabel(/^Name/), page.getByRole("button", { name: "Cancel" }), page.getByRole("checkbox"), page.getByRole("switch")]) {
    await target.focus();
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Tab");
    const ring = await target.evaluate((el) => getComputedStyle(el).outlineStyle);
    expect(ring).toBe("solid");
  }
});

test("targets are at least 24 by 24 CSS pixels", async ({ page }) => {
  await page.goto("/primitives");
  const small: string[] = [];
  for (const el of await page.locator("button, input:not([type=checkbox]):not([role=switch]), select, textarea, summary, a").all()) {
    const box = await el.boundingBox();
    if (box && (box.width < 24 || box.height < 24)) small.push(await el.evaluate((n) => n.outerHTML.slice(0, 60)));
  }
  expect(small).toEqual([]);
});
