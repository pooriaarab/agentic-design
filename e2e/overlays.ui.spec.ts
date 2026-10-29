import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
const violations = async (page: Page) =>
  (await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()).violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) }));

// A spinner never finishes, so wait only for animations that have an end.
const settle = (page: Page) =>
  page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((a) => a.effect?.getComputedTiming().iterations !== Infinity)
        .map((a) => a.finished),
    ),
  );

const open = async (page: Page, scheme: "light" | "dark" = "light") => {
  await page.emulateMedia({ colorScheme: scheme });
  await page.goto("/primitives");
};

for (const scheme of ["light", "dark"] as const) {
  test(`overlays have no axe violations in ${scheme}`, async ({ page }, testInfo) => {
    await open(page, scheme);
    await page.getByRole("button", { name: "Delete page…" }).click();
    await expect(page.getByRole("dialog", { name: "Delete this page?" })).toBeVisible();
    await settle(page);
    await page.screenshot({ path: testInfo.outputPath(`dialog-${scheme}.png`) });
    expect(await violations(page)).toEqual([]);
    await page.keyboard.press("Escape");

    await page.getByRole("button", { name: "More actions" }).click();
    await expect(page.getByRole("menu")).toBeVisible();
    expect(await violations(page)).toEqual([]);
    await page.keyboard.press("Escape");

    await page.getByRole("button", { name: "Show error toast" }).click();
    await page.getByRole("button", { name: "Show toast", exact: true }).click();
    await expect(page.locator(".agd-toast", { hasText: "Link copied" })).toBeVisible();
    await settle(page);
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
  // A destructive dialog opens on its safest button, not on Close.
  await expect(dialog.getByRole("button", { name: "Cancel" })).toBeFocused();
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
  await expect(page.locator(".agd-toast", { hasText: "Page moved to the trash" })).toBeVisible();
});

test("the menu works with the keyboard alone", async ({ page }) => {
  await open(page);
  const trigger = page.getByRole("button", { name: "More actions" });
  await trigger.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("menuitem", { name: "Rename…" })).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("menuitem", { name: "Duplicate" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByText("Last menu action: duplicate")).toBeVisible();
  await expect(trigger).toBeFocused();
  await expect(page.getByRole("tooltip")).toHaveCount(0);
});

test("tabs have one tab stop, move with the arrow keys, and label their panel", async ({ page }) => {
  await open(page);
  const tablist = page.getByRole("tablist", { name: "Page sections" });
  const overview = tablist.getByRole("tab", { name: "Overview" });
  const history = tablist.getByRole("tab", { name: "History" });
  await page.getByRole("button", { name: "Show error toast" }).focus();
  await page.keyboard.press("Tab");
  await expect(overview).toBeFocused();
  await page.keyboard.press("Tab");
  expect(await page.evaluate(() => !!document.activeElement?.closest('[role="tablist"]'))).toBe(false);
  // The list itself is no tab stop: only the active tab is.
  // Keep this line: the key presses below pass even if the list is a stop, because Radix hands focus on.
  await expect(tablist).toHaveAttribute("tabindex", "-1");
  await expect(overview).toHaveAttribute("tabindex", "0");
  await expect(history).toHaveAttribute("tabindex", "-1");
  await page.keyboard.press("Shift+Tab");
  await expect(overview).toBeFocused();
  await overview.focus();
  await page.keyboard.press("ArrowRight");
  await expect(history).toBeFocused();
  await expect(history).toHaveAttribute("tabindex", "0");
  await expect(overview).toHaveAttribute("tabindex", "-1");
  await expect(history).toHaveAttribute("aria-selected", "true");
  const panel = page.getByRole("tabpanel");
  await expect(panel).toContainText("keeps its author");
  await expect(panel).toHaveAccessibleName("History");
});

test("a menu trigger shows no tooltip, so none pops up where the menu was", async ({ page }) => {
  await open(page);
  const trigger = page.getByRole("button", { name: "More actions" });
  await trigger.focus();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await expect(page.getByRole("tooltip")).toHaveCount(0);
});

test("selected tabs and highlighted menu items stay visible in forced colors", async ({ page }) => {
  await page.emulateMedia({ forcedColors: "active" });
  await open(page);
  const highlight = await page.evaluate(() => {
    const probe = document.createElement("div");
    probe.style.background = "Highlight";
    document.body.append(probe);
    const color = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return color;
  });
  const bar = await page.getByRole("tab", { name: "Overview" }).evaluate((el) => getComputedStyle(el, "::after").backgroundColor);
  expect(bar).toBe(highlight);

  await page.getByRole("button", { name: "More actions" }).click();
  await page.getByRole("menuitem", { name: "Duplicate" }).hover();
  const outline = await page.getByRole("menuitem", { name: "Duplicate" }).evaluate((el) => getComputedStyle(el).outlineStyle);
  expect(outline).toBe("solid");
});

test("an icon button shows its label as a tooltip on keyboard focus", async ({ page }) => {
  await open(page);
  await page.getByRole("button", { name: "Count a click" }).focus();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Add item" })).toBeFocused();
  await expect(page.getByRole("tooltip")).toHaveText("Add item");
  // The tooltip repeats the name, so it must not be read as a second description.
  await expect(page.getByRole("button", { name: "Add item" })).toHaveAccessibleDescription("");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("tooltip")).toBeHidden();
});

test("toasts are announced, tell their tone in words, and close on time or stay until dismissed", async ({ page }) => {
  await page.clock.install();
  await open(page);
  await page.getByRole("button", { name: "Show toast", exact: true }).click();
  await page.getByRole("button", { name: "Show error toast" }).click();
  const info = page.locator(".agd-toast", { hasText: "Link copied" });
  const error = page.locator(".agd-toast", { hasText: "We couldn't save your changes" });
  await expect(info).toBeVisible();
  await expect(error).toBeVisible();

  // An error is announced at once. Other tones wait their turn.
  await expect(page.locator('[role="status"][aria-live="assertive"]')).toContainText("Error: We couldn't save your changes");
  await expect(page.locator('[role="status"][aria-live="polite"]')).toContainText("Notice: Link copied");
  await expect(error.locator(".agd-sr-only")).toHaveText("Error: ");

  await page.clock.fastForward(9000);
  await expect(info).toBeHidden();
  await expect(error).toBeVisible();
  await error.getByRole("button", { name: "Dismiss" }).click();
  await expect(error).toBeHidden();
});

test("F8 moves focus to the notifications and the focus is visible", async ({ page }) => {
  await open(page);
  await page.getByRole("button", { name: "Show toast", exact: true }).click();
  await expect(page.locator(".agd-toast", { hasText: "Link copied" })).toBeVisible();
  await page.keyboard.press("F8");
  const viewport = page.locator(".agd-toast-viewport");
  await expect(viewport).toBeFocused();
  expect(await viewport.evaluate((el) => getComputedStyle(el).outlineStyle)).toBe("solid");
  await page.keyboard.press("Tab");
  expect(await page.evaluate(() => !!document.activeElement?.closest(".agd-toast"))).toBe(true);
});

test("a toast with an unknown tone is treated as an error and stays until dismissed", async ({ page }) => {
  await page.clock.install();
  await open(page);
  await page.getByRole("button", { name: "Show odd-tone toast" }).click();
  const toast = page.locator(".agd-toast", { hasText: "Something odd happened" });
  await expect(toast).toBeVisible();
  await expect(toast.locator(".agd-sr-only")).toHaveText("Error: ");
  await page.clock.fastForward(9000);
  await expect(toast).toBeVisible();
});

test("a toast whose tone is an inherited object key is treated as an error", async ({ page }) => {
  await page.clock.install();
  await open(page);
  await page.getByRole("button", { name: "Show inherited-tone toast" }).click();
  const toast = page.locator(".agd-toast", { hasText: "Another odd thing" });
  await expect(toast.locator(".agd-sr-only")).toHaveText("Error: ");
  await page.clock.fastForward(9000);
  await expect(toast).toBeVisible();
});

test("a dialog opened with no trigger gives focus back to what had it", async ({ page }) => {
  await open(page);
  const opener = page.getByRole("button", { name: "Rename…" });
  await opener.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Rename this page" });
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
});

test("a dialog opened from a menu item gives focus back to the menu button", async ({ page }) => {
  await open(page);
  const trigger = page.getByRole("button", { name: "More actions" });
  await trigger.focus();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Rename this page" });
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});
