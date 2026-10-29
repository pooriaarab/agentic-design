import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
const violations = async (page: Page, selector?: string) => {
  const axe = new AxeBuilder({ page }).withTags(WCAG_TAGS);
  if (selector) axe.include(selector);
  return (await axe.analyze()).violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) }));
};
const shot = (page: Page, selector: string, name: string, scheme: string, outputPath: (n: string) => string) =>
  page.locator(selector).screenshot({ path: process.env.SCREENSHOTS ? `docs/screenshots/${name}-${scheme}.png` : outputPath(`${name}-${scheme}.png`), animations: "disabled" });

const names = (page: Page) => page.locator(".ad-filetable tbody .ad-file-row__name").allTextContents();

for (const scheme of ["light", "dark"] as const) {
  test(`the file table, grid, loading, and empty states have no axe violations in ${scheme}`, async ({ page }, testInfo) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto("/chrome");
    const files = page.locator("#demo-files");
    await expect(files.getByRole("table", { name: "Recent files" })).toBeVisible();
    await shot(page, "#demo-files", "file-table", scheme, (n) => testInfo.outputPath(n));
    expect(await violations(page, "#demo-files")).toEqual([]);

    await page.getByRole("button", { name: "Show grid" }).click();
    await expect(files.getByRole("list", { name: "Recent files" })).toBeVisible();
    await shot(page, "#demo-files", "file-grid", scheme, (n) => testInfo.outputPath(n));
    expect(await violations(page, "#demo-files")).toEqual([]);

    await page.getByRole("button", { name: "Show loading" }).click();
    await expect(files.getByRole("status")).toHaveText("Loading files");
    await shot(page, "#demo-files", "file-loading", scheme, (n) => testInfo.outputPath(n));
    expect(await violations(page, "#demo-files")).toEqual([]);

    await page.getByRole("button", { name: "Show empty" }).click();
    await expect(files.getByRole("heading", { name: "No files" })).toBeVisible();
    await shot(page, "#demo-files", "file-empty", scheme, (n) => testInfo.outputPath(n));
    expect(await violations(page, "#demo-files")).toEqual([]);
  });

  test(`the share dialog has no axe violations in ${scheme}`, async ({ page }, testInfo) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto("/chrome");
    await page.getByRole("button", { name: "Share" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await dialog.screenshot({ path: process.env.SCREENSHOTS ? `docs/screenshots/share-dialog-${scheme}.png` : testInfo.outputPath(`share-dialog-${scheme}.png`), animations: "disabled" });
    expect(await violations(page, '[role="dialog"]')).toEqual([]);
  });
}

test("column headers sort by keyboard, name order is natural, and a bad date sorts last both ways", async ({ page }) => {
  await page.goto("/chrome");
  const table = page.getByRole("table", { name: "Recent files" });
  const name = table.getByRole("columnheader", { name: "Name" });
  await expect(name).toHaveAttribute("aria-sort", "ascending");
  expect(await names(page)).toEqual(["Budget 2", "Budget 10", "Launch plan", "Meeting notes", expect.stringMatching(/^Quarterly planning/), "Research"]);

  await name.getByRole("button").focus();
  await page.keyboard.press("Enter");
  await expect(name).toHaveAttribute("aria-sort", "descending");
  expect((await names(page))[0]).toBe("Research");
  await expect(page.locator("#demo-files").getByRole("status")).toHaveText("Sorted by name, descending");

  const modified = table.getByRole("columnheader", { name: "Modified" });
  await modified.getByRole("button").focus();
  await page.keyboard.press("Space");
  await expect(modified).toHaveAttribute("aria-sort", "ascending");
  await expect(name).not.toHaveAttribute("aria-sort", /.+/);
  expect(await names(page)).toEqual(["Budget 10", expect.stringMatching(/^Quarterly planning/), "Research", "Meeting notes", "Launch plan", "Budget 2"]);
  await page.keyboard.press("Space");
  await expect(modified).toHaveAttribute("aria-sort", "descending");
  expect((await names(page)).at(-1)).toBe("Budget 2");
});

test("an agent owner shows as an agent in the table and the grid, and the grid sorts with a select", async ({ page }) => {
  await page.goto("/chrome");
  await expect(page.locator(".ad-filetable tbody tr", { hasText: "Meeting notes" })).toContainText("Agent");
  await page.getByRole("button", { name: "Show grid" }).click();
  const card = page.locator(".ad-filegrid__item", { hasText: "Meeting notes" });
  await expect(card).toContainText("Agent");
  await expect(card).toContainText("for Ada Lovelace");
  await page.getByRole("combobox", { name: "Sort by" }).selectOption("modified:descending");
  await expect(page.locator(".ad-filegrid__item .ad-file-row__name").first()).toHaveText("Launch plan");
  await expect(page.locator("#demo-files").getByRole("status")).toHaveText("Sorted by modified, descending");
});

test("placeholders hold still when the user asks for reduced motion", async ({ page }) => {
  await page.goto("/chrome");
  await page.getByRole("button", { name: "Show loading" }).click();
  const table = page.getByRole("table", { name: "Recent files" });
  await expect(table).toHaveAttribute("aria-busy", "true");
  const duration = () => page.locator(".ad-skeleton").first().evaluate((n) => getComputedStyle(n).animationDuration);
  expect(await duration()).toBe("1.4s");
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(Number.parseFloat(await duration())).toBeLessThan(0.001);
});

test("in forced colors a placeholder is a system color, not the page color", async ({ page }) => {
  await page.emulateMedia({ forcedColors: "active" });
  await page.goto("/chrome");
  await page.getByRole("button", { name: "Show loading" }).click();
  const fill = page.locator(".ad-skeleton").first().evaluate((n) => getComputedStyle(n).backgroundColor);
  const canvas = page.evaluate(() => {
    const probe = document.createElement("div");
    probe.style.backgroundColor = "Canvas";
    document.body.append(probe);
    const value = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return value;
  });
  expect(await fill).not.toBe(await canvas);
});

test("a very long file name is cut by an ellipsis, and the page does not scroll sideways on a desktop screen", async ({ page }) => {
  await page.goto("/chrome");
  await expect(page.getByRole("table", { name: "Recent files" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
  const link = page.locator(".ad-filetable .ad-file-row__name", { hasText: /^Quarterly planning/ });
  expect(await link.evaluate((n) => n.scrollWidth > n.clientWidth)).toBe(true);
  // Every cell of a row has the height of the row, so the row line is whole.
  const heights = await page.locator(".ad-filetable tbody tr").first().locator("td").evaluateAll((cells) => cells.map((c) => Math.round(c.getBoundingClientRect().height)));
  expect(new Set(heights).size).toBe(1);
});

test("the status element stays in the page across views, and the sort message waits for a sort", async ({ page }) => {
  await page.goto("/chrome");
  const status = page.locator("#demo-files").getByRole("status");
  await expect(status).toHaveText("");
  const handle = await status.elementHandle();
  await page.getByRole("button", { name: "Show grid" }).click();
  await expect(status).toHaveText("");
  await page.getByRole("button", { name: "Show empty" }).click();
  await page.getByRole("button", { name: "Show loading" }).click();
  await expect(status).toHaveText("Loading files");
  // The same node held the text throughout, so a screen reader hears each change.
  expect(await handle?.evaluate((n) => n.isConnected)).toBe(true);
  await page.getByRole("button", { name: "Show files" }).click();
  await page.getByRole("combobox", { name: "Sort by" }).selectOption("owner:ascending");
  await expect(status).toHaveText("Sorted by owner, ascending");
});

test("on a narrow screen the table does not scroll sideways and passes axe", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto("/chrome");
  await expect(page.getByRole("table", { name: "Recent files" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
  expect(await violations(page, "#demo-files")).toEqual([]);
  await page.getByRole("button", { name: "Show grid" }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
});

test("in a right-to-left page the table starts on the right and passes axe", async ({ page }) => {
  await page.goto("/chrome");
  await page.evaluate(() => document.documentElement.setAttribute("dir", "rtl"));
  const [name, modified] = [await page.getByRole("columnheader", { name: "Name" }).boundingBox(), await page.getByRole("columnheader", { name: "Modified" }).boundingBox()];
  expect((name?.x ?? 0) > (modified?.x ?? 0)).toBe(true);
  // A date sits under its own header, and a row has one full line, so cells do not drift.
  const row = page.locator(".ad-filetable tbody tr", { hasText: "Launch plan" });
  const date = await row.locator("td").nth(2).boundingBox();
  expect(Math.abs((date?.x ?? 0) - (modified?.x ?? 0))).toBeLessThan(1);
  expect(Math.abs((date?.width ?? 0) - (modified?.width ?? 0))).toBeLessThan(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
  expect(await violations(page, "#demo-files")).toEqual([]);
});
