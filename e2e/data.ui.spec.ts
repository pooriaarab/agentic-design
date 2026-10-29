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
  await bar.getByRole("button", { name: "Clear selection" }).click();
  await expect(bar).toHaveCount(0);
});

test("Shift selects a range from the last row picked", async ({ page }) => {
  await page.goto("/data");
  await page.getByRole("checkbox", { name: "Select Task 2", exact: true }).click();
  await page.getByRole("checkbox", { name: "Select Task 5", exact: true }).click({ modifiers: ["Shift"] });
  await expect(page.getByRole("region", { name: "Bulk actions" })).toContainText("4 selected");
  await expect(page.getByRole("row", { name: /Task 4\b/ })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("row", { name: /Task 6\b/ })).toHaveAttribute("aria-selected", "false");
});

test("Page Down moves by a page and Enter opens the row", async ({ page }) => {
  await page.goto("/data");
  await page.locator('[data-index="0"]').focus();
  await page.keyboard.press("PageDown");
  const index = Number(await page.evaluate(() => document.activeElement?.getAttribute("data-index")));
  expect(index).toBeGreaterThan(4);
  await page.keyboard.press("Enter");
  await expect(page.locator("#opened")).toHaveText(`Task ${index + 1}`);
  await page.keyboard.press("PageUp");
  await expect(page.locator('[data-index="0"]')).toBeFocused();
});

test("a selection of rows that are gone does not show a bar", async ({ page }) => {
  await page.goto("/data");
  await page.getByRole("checkbox", { name: "Select Task 1", exact: true }).click();
  await page.getByRole("button", { name: "Show empty" }).click();
  await expect(page.getByRole("heading", { name: "No rows" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Bulk actions" })).toHaveCount(0);
});

test("clearing the selection from the bar keeps focus in the table", async ({ page }) => {
  await page.goto("/data");
  await page.locator('[data-index="0"]').focus();
  await page.keyboard.press("Space");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Clear selection" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator('[data-index="0"]')).toBeFocused();
});

test("the bar does not cover the row that has focus", async ({ page }) => {
  await page.goto("/data");
  await page.locator('[data-index="0"]').focus();
  for (let i = 0; i < 8; i++) await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Space");
  const row = await page.locator('[data-index="8"]').boundingBox();
  const bar = await page.getByRole("region", { name: "Bulk actions" }).boundingBox();
  expect(row).not.toBeNull();
  expect(bar).not.toBeNull();
  expect(row!.y + row!.height).toBeLessThanOrEqual(bar!.y);
});

test("on a narrow screen the headers line up with the cells", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto("/data");
  const grid = page.getByRole("grid", { name: "Tasks" });
  const header = await grid.getByRole("columnheader", { name: "Owner" }).boundingBox();
  const cell = await grid.getByRole("row", { name: /Task 1\b/ }).getByRole("gridcell").last().boundingBox();
  expect(header).not.toBeNull();
  expect(cell).not.toBeNull();
  expect(Math.abs(header!.x - cell!.x)).toBeLessThan(1);
});

test("at 320px the bulk bar and its last button fit inside the table", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto("/data");
  await page.getByRole("checkbox", { name: "Select Task 1", exact: true }).click();
  const bar = await page.getByRole("region", { name: "Bulk actions" }).boundingBox();
  const clear = await page.getByRole("button", { name: "Clear selection" }).boundingBox();
  const frame = await page.getByRole("grid", { name: "Tasks" }).boundingBox();
  expect(bar && clear && frame).toBeTruthy();
  expect(clear!.x + clear!.width).toBeLessThanOrEqual(bar!.x + bar!.width);
  expect(bar!.x + bar!.width).toBeLessThanOrEqual(frame!.x + frame!.width);
});

test("select-all after a wheel scroll does not move the grid", async ({ page }) => {
  await page.goto("/data");
  const grid = page.getByRole("grid", { name: "Tasks" });
  await grid.evaluate((el) => { el.scrollTop = 200000; });
  await expect(page.getByRole("row", { name: /Task 5001\b/ })).toBeVisible();
  await page.getByRole("checkbox", { name: "Select all 10000 rows" }).click();
  await expect(page.getByRole("region", { name: "Bulk actions" })).toBeVisible();
  expect(await grid.evaluate((el) => el.scrollTop)).toBe(200000);
});

test("a range from a row that is gone becomes a plain pick", async ({ page }) => {
  await page.goto("/data");
  await page.locator('[data-index="0"]').focus();
  await page.keyboard.press("End");
  await page.keyboard.press("Space");
  await page.getByRole("button", { name: "100 rows" }).click();
  await page.getByRole("grid", { name: "Tasks" }).evaluate((el) => { el.scrollTop = 0; });
  await page.getByRole("checkbox", { name: "Select Task 5", exact: true }).click({ modifiers: ["Shift"] });
  await expect(page.getByRole("region", { name: "Bulk actions" })).toContainText("1 selected");
});

test("clearing the selection scrolls focus back into view", async ({ page }) => {
  await page.goto("/data");
  await page.getByRole("checkbox", { name: "Select Task 1", exact: true }).click();
  const grid = page.getByRole("grid", { name: "Tasks" });
  await grid.evaluate((el) => { el.scrollTop = 100000; });
  await page.getByRole("button", { name: "Clear selection" }).click();
  await expect(page.locator('[data-index="0"]')).toBeFocused();
  expect(await grid.evaluate((el) => el.scrollTop)).toBe(0);
});

test("picks among rows that left the list count again when the rows return", async ({ page }) => {
  await page.goto("/data");
  const grid = page.getByRole("grid", { name: "Tasks" });
  await grid.getByRole("checkbox", { name: "Select Task 1", exact: true }).click();
  await page.getByRole("button", { name: "Show empty" }).click();
  await page.getByRole("button", { name: "100 rows" }).click();
  await grid.getByRole("checkbox", { name: "Select Task 2", exact: true }).click();
  await expect(page.getByRole("region", { name: "Bulk actions" })).toContainText("2 selected");
  await page.getByRole("button", { name: "10,000 rows" }).click();
  await expect(page.getByRole("region", { name: "Bulk actions" })).toContainText("2 selected");
});

test("a double click on a checkbox does not open the row", async ({ page }) => {
  await page.goto("/data");
  await page.getByRole("checkbox", { name: "Select Task 3", exact: true }).dblclick();
  await expect(page.locator("#opened")).toHaveText("none");
});

test("focus returns to the row after the rows reload", async ({ page }) => {
  await page.goto("/data");
  await page.locator('[data-index="0"]').focus();
  // A refetch comes from code, not a click, so the button must not take focus. Click it from the page.
  await page.evaluate(() => {
    const press = (name: string) => [...document.querySelectorAll("button")].find((b) => b.textContent === name)?.click();
    press("Show loading");
  });
  await expect(page.getByRole("status").filter({ hasText: "Loading rows" })).toBeVisible();
  await page.evaluate(() => [...document.querySelectorAll("button")].find((b) => b.textContent === "Show rows")?.click());
  await expect(page.locator('[data-index="0"]')).toBeFocused();
});

test("the active row survives a list that shrinks and returns", async ({ page }) => {
  await page.goto("/data");
  await page.locator('[data-index="0"]').focus();
  for (let i = 0; i < 60; i++) await page.keyboard.press("ArrowDown");
  await expect(page.locator('[data-index="60"]')).toBeFocused();
  // Cut the list to 100 rows from the page, so the button never takes focus. Row 60 still exists.
  await page.evaluate(() => [...document.querySelectorAll("button")].find((b) => b.textContent === "100 rows")?.click());
  await expect(page.locator('[data-index="60"]')).toBeFocused();
  await page.evaluate(() => [...document.querySelectorAll("button")].find((b) => b.textContent === "Show empty")?.click());
  await page.evaluate(() => [...document.querySelectorAll("button")].find((b) => b.textContent === "10,000 rows")?.click());
  await expect(page.locator('[data-index="60"]')).toHaveAttribute("tabindex", "0");
});
