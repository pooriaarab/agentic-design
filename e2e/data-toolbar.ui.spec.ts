import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
const violations = async (page: Page, selector: string) =>
  (await new AxeBuilder({ page }).withTags(WCAG_TAGS).include(selector).analyze()).violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) }));
const shot = (page: Page, selector: string, name: string, scheme: string, outputPath: (n: string) => string) =>
  page.locator(selector).screenshot({ path: process.env.SCREENSHOTS ? `docs/screenshots/${name}-${scheme}.png` : outputPath(`${name}-${scheme}.png`), animations: "disabled" });
const rowCount = async (page: Page) => Number(await page.getByRole("grid", { name: "Tasks" }).getAttribute("aria-rowcount"));

for (const scheme of ["light", "dark"] as const) {
  test(`the toolbar, filter chip, and display popover have no axe violations in ${scheme}`, async ({ page }, testInfo) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto("/data");
    await page.getByRole("button", { name: "Search" }).click();
    await page.getByRole("searchbox", { name: "Search" }).fill("Task 1");
    await page.getByRole("button", { name: "Add filter" }).click();
    await page.getByRole("menuitem", { name: "Status: Open" }).click();
    await expect(page.getByRole("list", { name: "Active filters" })).toContainText("Status: Open");
    await shot(page, "#demo-data", "data-toolbar", scheme, (n) => testInfo.outputPath(n));
    expect(await violations(page, "#demo-data")).toEqual([]);

    await page.getByRole("button", { name: "Display" }).click();
    await page.getByLabel("Group by").selectOption("owner");
    await expect(page.getByRole("gridcell", { name: /^Grace Hopper/ }).first()).toBeVisible();
    await page.screenshot({ path: process.env.SCREENSHOTS ? `docs/screenshots/data-display-${scheme}.png` : testInfo.outputPath(`data-display-${scheme}.png`), animations: "disabled" });
    expect(await violations(page, "body")).toEqual([]);
  });
}

test("the search opens on a click, filters rows, and closes with Escape", async ({ page }) => {
  await page.goto("/data");
  await expect(page.getByRole("searchbox")).toHaveCount(0);
  await page.getByRole("button", { name: "Search" }).click();
  const box = page.getByRole("searchbox", { name: "Search" });
  await expect(box).toBeFocused();
  await box.fill("Task 10000");
  await expect.poll(() => rowCount(page)).toBe(2);
  await expect(page.getByRole("row", { name: /Task 10000\b/ })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(box).toHaveValue("");
  await expect.poll(() => rowCount(page)).toBe(10001);
  await page.keyboard.press("Escape");
  await expect(box).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Search" })).toBeFocused();
});

test("a search with no match shows an empty state with a way back", async ({ page }) => {
  await page.goto("/data");
  await page.getByRole("button", { name: "Search" }).click();
  await page.getByRole("searchbox", { name: "Search" }).fill("zzzz");
  await expect(page.getByRole("heading", { name: "No matches" })).toBeVisible();
  await page.getByRole("button", { name: "Clear search and filters" }).click();
  await expect.poll(() => rowCount(page)).toBe(10001);
});

test("a filter chip narrows the rows and its button removes it", async ({ page }) => {
  await page.goto("/data");
  await page.getByRole("button", { name: "Add filter" }).click();
  await page.getByRole("menuitem", { name: "Status: Done" }).click();
  await expect(page.getByRole("list", { name: "Active filters" })).toContainText("Status: Done");
  await expect.poll(() => rowCount(page)).toBe(3335);
  await page.getByRole("button", { name: "Remove filter Status: Done" }).click();
  await expect(page.getByRole("list", { name: "Active filters" })).toHaveCount(0);
  await expect.poll(() => rowCount(page)).toBe(10001);
});

test("the display popover groups, orders, hides a column, resets, and closes with Escape", async ({ page }) => {
  await page.goto("/data");
  const grid = page.getByRole("grid", { name: "Tasks" });
  await page.getByRole("button", { name: "Display" }).click();
  const reset = page.getByRole("button", { name: "Reset to defaults" });
  await expect(reset).toHaveAttribute("aria-disabled", "true");

  await page.getByLabel("Group by").selectOption("status");
  await expect(grid.getByRole("gridcell", { name: /^Done/ })).toBeVisible();
  await expect.poll(() => rowCount(page)).toBe(10003);

  await page.getByLabel("Group by").selectOption("");
  await page.getByLabel("Order by").selectOption("title");
  await page.getByLabel("Direction").selectOption("descending");
  await expect(grid.getByRole("row", { name: /Task 10000\b/ }).first()).toBeVisible();
  expect(await grid.getByRole("gridcell").nth(1).textContent()).toBe("Task 10000");

  await page.getByRole("checkbox", { name: "Owner" }).uncheck();
  await expect(grid.getByRole("columnheader", { name: "Owner" })).toHaveCount(0);
  await page.getByRole("checkbox", { name: "Status" }).uncheck();
  await expect(page.getByRole("checkbox", { name: "Title" })).toBeDisabled();

  await reset.click();
  await expect(grid.getByRole("columnheader", { name: "Owner" })).toBeVisible();
  await expect(page.getByLabel("Order by")).toHaveValue("");
  await expect(reset).toHaveAttribute("aria-disabled", "true");

  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Display" })).toBeFocused();
});

test("with groups, a long scroll still draws few rows and keys skip the labels", async ({ page }) => {
  await page.goto("/data");
  await page.getByRole("button", { name: "Display" }).click();
  await page.getByLabel("Group by").selectOption("owner");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Display" })).toBeFocused();
  const grid = page.getByRole("grid", { name: "Tasks" });
  await expect.poll(() => page.locator("[data-index]").count()).toBeLessThan(60);
  await grid.evaluate((el) => { el.scrollTop = el.scrollHeight; });
  await expect(page.getByRole("row").last()).toBeVisible();
  expect(await page.locator("[data-index]").count()).toBeLessThan(60);
  await page.locator('[data-index="0"]').focus();
  await page.keyboard.press("End");
  const last = page.locator('[data-index="9999"]');
  await expect(last).toBeFocused();
  const box = await last.boundingBox();
  const frame = await grid.boundingBox();
  expect(box && frame && box.y + box.height <= frame.y + frame.height + 1).toBe(true);
});

test("removing a chip with the keyboard keeps focus on the controls", async ({ page }) => {
  await page.goto("/data");
  await page.getByRole("button", { name: "Add filter" }).click();
  await page.getByRole("menuitem", { name: "Status: Done" }).click();
  await page.getByRole("button", { name: "Add filter" }).click();
  await page.getByRole("menuitem", { name: "Owner: Grace Hopper" }).click();
  const remove = page.getByRole("button", { name: "Remove filter Status: Done" });
  await remove.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: "Remove filter Owner: Grace Hopper" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: "Add filter" })).toBeFocused();
});

test("clearing from the empty state keeps focus in the table", async ({ page }) => {
  await page.goto("/data");
  await page.getByRole("button", { name: "Search" }).click();
  await page.getByRole("searchbox", { name: "Search" }).fill("zzzz");
  const clear = page.getByRole("button", { name: "Clear search and filters" });
  await clear.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator('[data-index="0"]')).toBeFocused();
});

test("group order flips with Direction when only grouping is set", async ({ page }) => {
  await page.goto("/data");
  await page.getByRole("button", { name: "Display" }).click();
  await page.getByLabel("Group by").selectOption("status");
  const grid = page.getByRole("grid", { name: "Tasks" });
  await expect(grid.getByRole("gridcell", { name: "Done 3334 rows" })).toBeVisible();
  await page.getByLabel("Direction").selectOption("descending");
  await expect(grid.getByRole("gridcell", { name: "Open 6666 rows" })).toBeVisible();
});

test("row indexes count the group labels", async ({ page }) => {
  await page.goto("/data");
  await page.getByRole("button", { name: "Display" }).click();
  await page.getByLabel("Group by").selectOption("status");
  await page.keyboard.press("Escape");
  const grid = page.getByRole("grid", { name: "Tasks" });
  await expect(grid).toHaveAttribute("aria-rowcount", "10003");
  const indexes = await page.locator('[role="row"][aria-rowindex]').evaluateAll((els) => els.map((e) => Number(e.getAttribute("aria-rowindex"))));
  expect(indexes).toEqual([...indexes].sort((a, b) => a - b));
  expect(new Set(indexes).size).toBe(indexes.length);
  // Header is 1, the first label is 2, the first row is 3.
  await expect(page.locator('[data-index="0"]')).toHaveAttribute("aria-rowindex", "3");
});

test("a search that starts with text keeps focus on the controls when it is cleared by keyboard", async ({ page }) => {
  await page.goto("/data?q=Task%2099");
  const box = page.getByRole("searchbox", { name: "Search" });
  await expect(box).toHaveValue("Task 99");
  await box.focus();
  await page.keyboard.press("Escape");
  await expect(box).toHaveValue("");
  await expect(box).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Search" })).toBeFocused();
});

test("the search closes by itself when the text is cleared from outside", async ({ page }) => {
  await page.goto("/data");
  await page.getByRole("button", { name: "Search" }).click();
  await page.getByRole("searchbox", { name: "Search" }).fill("zzzz");
  await page.getByRole("button", { name: "Clear search and filters" }).click();
  await expect(page.getByRole("searchbox")).toHaveCount(0);
});

test("a search says how many rows are left", async ({ page }) => {
  await page.goto("/data");
  await page.getByRole("button", { name: "Search" }).click();
  await page.getByRole("searchbox", { name: "Search" }).fill("Task 10000");
  await expect(page.getByRole("status").filter({ hasText: /^1 row$/ })).toBeAttached();
  await page.getByRole("searchbox", { name: "Search" }).fill("zzzz");
  await expect(page.getByRole("status").filter({ hasText: /^No rows$/ })).toBeAttached();
});

test("arrow keys across a group boundary bring the next label into view", async ({ page }) => {
  await page.goto("/data");
  await page.getByRole("button", { name: "100 rows" }).click();
  await page.getByRole("button", { name: "Display" }).click();
  await page.getByLabel("Group by").selectOption("status");
  await page.getByLabel("Direction").selectOption("descending");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Display" })).toBeFocused();
  await page.locator('[data-index="0"]').focus();
  for (let i = 0; i < 66; i++) await page.keyboard.press("ArrowDown");
  await expect(page.locator('[data-index="66"]')).toBeFocused();
  const label = await page.getByRole("gridcell", { name: "Done 34 rows" }).boundingBox();
  const frame = await page.getByRole("grid", { name: "Tasks" }).boundingBox();
  expect(label && frame).toBeTruthy();
  // The label sits under the sticky header, inside the grid.
  expect(label!.y).toBeGreaterThanOrEqual(frame!.y + 40);
  expect(label!.y + label!.height).toBeLessThanOrEqual(frame!.y + frame!.height);
});

test("the first row of a group is described by its label", async ({ page }) => {
  await page.goto("/data");
  await page.getByRole("button", { name: "Display" }).click();
  await page.getByLabel("Group by").selectOption("status");
  await page.keyboard.press("Escape");
  await expect(page.locator('[data-index="0"]')).toHaveAccessibleDescription("Done 3334 rows");
  await expect(page.locator('[data-index="1"]')).not.toHaveAccessibleDescription(/rows/);
});

test("clearing a selection does not say an old row count again", async ({ page }) => {
  await page.goto("/data");
  await page.getByRole("button", { name: "Show loading" }).click();
  await page.getByRole("button", { name: "Show rows" }).click();
  await expect(page.getByRole("status").filter({ hasText: "10000 rows" })).toBeAttached();
  await page.locator('[data-index="0"]').focus();
  await page.keyboard.press("Space");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("status").filter({ hasText: "10000 rows" })).toHaveCount(0);
});
