import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
const violations = async (page: Page) =>
  (await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()).violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) }));

const open = async (page: Page, scheme: "light" | "dark" = "light") => {
  await page.emulateMedia({ colorScheme: scheme });
  await page.goto("/primitives");
};

for (const scheme of ["light", "dark"] as const) {
  test(`overlays have no axe violations in ${scheme}`, async ({ page }, testInfo) => {
    await open(page, scheme);
    await page.getByRole("button", { name: "Delete page…" }).click();
    await expect(page.getByRole("dialog", { name: "Delete this page?" })).toBeVisible();
    await page.waitForTimeout(300);
    await page.screenshot({ path: testInfo.outputPath(`dialog-${scheme}.png`) });
    expect(await violations(page)).toEqual([]);
    await page.keyboard.press("Escape");

    await page.getByRole("button", { name: "More actions" }).click();
    await expect(page.getByRole("menu")).toBeVisible();
    expect(await violations(page)).toEqual([]);
    await page.keyboard.press("Escape");

    await page.getByRole("button", { name: "Show error toast" }).click();
    await page.getByRole("button", { name: "Show toast", exact: true }).click();
    await expect(page.locator(".ad-toast", { hasText: "Link copied" })).toBeVisible();
    await page.waitForTimeout(300);
    await page.screenshot({ path: testInfo.outputPath(`toast-${scheme}.png`) });
    expect(await violations(page)).toEqual([]);
  });
}

test("the dialog has a name and a description, traps focus, and returns focus on Escape", async ({ page }) => {
  await open(page);
  const trigger = page.getByRole("button", { name: "Delete page…" });
  await trigger.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Delete this page?" });
  await expect(dialog).toHaveAccessibleDescription(/People and agents lose access/);
  await expect(dialog.locator(":focus")).toHaveCount(1);
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press("Tab");
    expect(await page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]'))).toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("the dialog confirms through a toast", async ({ page }) => {
  await open(page);
  await page.getByRole("button", { name: "Delete page…" }).click();
  await page.getByRole("button", { name: "Move to trash" }).click();
  await expect(page.locator(".ad-toast", { hasText: "Page moved to the trash" })).toBeVisible();
});

test("the menu works with the keyboard alone", async ({ page }) => {
  await open(page);
  const trigger = page.getByRole("button", { name: "More actions" });
  await trigger.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("menuitem", { name: "Rename" })).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("menuitem", { name: "Duplicate" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByText("Last menu action: duplicate")).toBeVisible();
  await expect(trigger).toBeFocused();
});

test("tabs move with the arrow keys and the panel follows", async ({ page }) => {
  await open(page);
  const tablist = page.getByRole("tablist", { name: "Page sections" });
  await tablist.getByRole("tab", { name: "Overview" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(tablist.getByRole("tab", { name: "History" })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tabpanel")).toContainText("keeps its author");
});

test("an icon button shows its label as a tooltip on keyboard focus", async ({ page }) => {
  await open(page);
  await page.getByRole("button", { name: "Add item" }).focus();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("tooltip")).toHaveText("Add item");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("tooltip")).toBeHidden();
});

test("a toast is announced, and an error toast stays until it is dismissed", async ({ page }) => {
  await open(page);
  await page.getByRole("button", { name: "Show error toast" }).click();
  const toast = page.locator(".ad-toast", { hasText: "We couldn't save your changes" });
  await expect(toast).toBeVisible();
  await page.waitForTimeout(9000);
  await expect(toast).toBeVisible();
  await toast.getByRole("button", { name: "Dismiss" }).click();
  await expect(toast).toBeHidden();
});
