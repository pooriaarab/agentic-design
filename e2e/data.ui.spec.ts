import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
const violations = async (page: Page, selector: string) =>
  (await new AxeBuilder({ page }).withTags(WCAG_TAGS).include(selector).analyze()).violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) }));
const shot = (page: Page, name: string, scheme: string, outputPath: (n: string) => string) =>
  page.locator("#demo-data").screenshot({ path: process.env.SCREENSHOTS ? `docs/screenshots/${name}-${scheme}.png` : outputPath(`${name}-${scheme}.png`), animations: "disabled" });

for (const scheme of ["light", "dark"] as const) {
  test(`the data table has no axe violations in ${scheme}`, async ({ page }, testInfo) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto("/data");
    const grid = page.getByRole("grid", { name: "Tasks" });
    await expect(grid.getByRole("row", { name: /Task 1\b/ })).toBeVisible();
    await shot(page, "data-table", scheme, (n) => testInfo.outputPath(n));
    expect(await violations(page, "#demo-data")).toEqual([]);

    await grid.getByRole("checkbox", { name: "Select Task 1", exact: true }).click();
    await expect(page.getByRole("region", { name: "Bulk actions" })).toBeVisible();
    await shot(page, "data-table-selected", scheme, (n) => testInfo.outputPath(n));
    expect(await violations(page, "#demo-data")).toEqual([]);

    await page.getByRole("button", { name: "Show loading" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Loading rows" })).toBeVisible();
    await shot(page, "data-table-loading", scheme, (n) => testInfo.outputPath(n));
    expect(await violations(page, "#demo-data")).toEqual([]);

    await page.getByRole("button", { name: "Show empty" }).click();
    await page.getByRole("button", { name: "Show rows" }).click();
    await expect(page.getByRole("heading", { name: "No rows" })).toBeVisible();
    await shot(page, "data-table-empty", scheme, (n) => testInfo.outputPath(n));
    expect(await violations(page, "#demo-data")).toEqual([]);
  });
}

test("10,000 rows draw only the rows in view and scroll to the end", async ({ page }) => {
  await page.goto("/data");
  const grid = page.getByRole("grid", { name: "Tasks" });
  await expect(grid).toHaveAttribute("aria-rowcount", "10001");
  const drawn = () => page.locator('[data-index]').count();
  expect(await drawn()).toBeLessThan(60);
  await grid.evaluate((el) => { el.scrollTop = el.scrollHeight; });
  await expect(page.getByRole("row", { name: /Task 10000\b/ })).toBeVisible();
  expect(await drawn()).toBeLessThan(60);
  await grid.evaluate((el) => { el.scrollTop = 0; });
  await expect(page.getByRole("row", { name: /Task 1\b/ })).toBeVisible();
});

test("keys move through rows, select, and clear", async ({ page }) => {
  await page.goto("/data");
  const first = page.locator('[data-index="0"]');
  await first.focus();
  await page.keyboard.press("ArrowDown");
  await expect(page.locator('[data-index="1"]')).toBeFocused();
  await page.keyboard.press("Space");
  await expect(page.locator('[data-index="1"]')).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("region", { name: "Bulk actions" })).toContainText("1 selected");
  await page.keyboard.press("End");
  await expect(page.locator('[data-index="9999"]')).toBeFocused();
  await expect(page.getByRole("row", { name: /Task 10000\b/ })).toBeVisible();
  await page.keyboard.press("Home");
  await expect(page.locator('[data-index="0"]')).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("region", { name: "Bulk actions" })).toHaveCount(0);
});

test("select all and a bulk action", async ({ page }) => {
  await page.goto("/data");
  await page.getByRole("checkbox", { name: "Select all 10000 rows" }).click();
  const bar = page.getByRole("region", { name: "Bulk actions" });
  await expect(bar).toContainText("10000 selected");
  await bar.getByRole("button", { name: "Archive" }).click();
  await expect(page.locator("#archived")).toHaveText("10000");
  await page.getByRole("checkbox", { name: "Select Task 3", exact: true }).click({ modifiers: ["Shift"] });
  await bar.getByRole("button", { name: "Clear selection" }).click();
  await expect(bar).toHaveCount(0);
});
