import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
const violations = async (page: Page) =>
  (await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()).violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) }));

for (const scheme of ["light", "dark"] as const) {
  test(`patterns have no axe violations in ${scheme}`, async ({ page }, testInfo) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto("/patterns");
    await page.waitForTimeout(200);
    await page.screenshot({ path: testInfo.outputPath(`patterns-${scheme}.png`), fullPage: true });
    expect(await violations(page)).toEqual([]);
    await page.getByRole("button", { name: "Show empty state" }).click();
    await expect(page.getByRole("heading", { name: "No files yet" })).toBeVisible();
    expect(await violations(page)).toEqual([]);
  });
}

test("the shell has a skip link, one main landmark, and marks the current page", async ({ page }) => {
  await page.goto("/patterns");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Skip to content" });
  await expect(skip).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("main")).toBeFocused();
  await expect(page.getByRole("main")).toHaveCount(1);
  await expect(page.getByRole("navigation", { name: "Demo pages" }).getByRole("link", { name: "Patterns" })).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Patterns");
});

test("on a narrow screen the sidebar hides behind a menu button that Escape closes", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto("/patterns");
  const nav = page.getByRole("navigation", { name: "Demo pages" });
  const toggle = page.getByRole("button", { name: "Navigation" });
  await expect(nav).toBeHidden();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await toggle.click();
  await expect(nav).toBeVisible();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  expect(await violations(page)).toEqual([]);
  await page.keyboard.press("Escape");
  await expect(nav).toBeHidden();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow).toBe(false);
});

test("the toolbar is one tab stop, moves with arrow keys, and toggles", async ({ page }) => {
  await page.goto("/patterns");
  const toolbar = page.getByRole("toolbar", { name: "Text formatting" });
  const bold = toolbar.getByRole("button", { name: "Bold" });
  const italic = toolbar.getByRole("button", { name: "Italic" });
  await bold.focus();
  await page.keyboard.press("ArrowRight");
  await expect(italic).toBeFocused();
  await page.keyboard.press("End");
  await expect(toolbar.getByRole("button", { name: "Insert item" })).toBeFocused();
  await page.keyboard.press("Home");
  await expect(bold).toBeFocused();
  await expect(bold).toHaveAttribute("aria-pressed", "false");
  await page.keyboard.press("Space");
  await expect(bold).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("Tab");
  expect(await page.evaluate(() => !!document.activeElement?.closest('[role="toolbar"]'))).toBe(false);
});

test("an agent is labeled as an agent by a word and a shape, never by color alone", async ({ page }) => {
  await page.goto("/patterns");
  const chips = page.locator(".ad-chip");
  const claude = chips.filter({ hasText: "Claude" }).first();
  await expect(claude).toContainText("Agent");
  await expect(claude).toContainText("for Ada Lovelace");
  await expect(chips.filter({ hasText: "Ada Lovelace" }).first()).not.toContainText("Agent");
  const bot = chips.filter({ hasText: "Review bot" });
  await expect(bot).toContainText("Agent");
  await expect(bot).toContainText("Paused");
  await expect(chips.filter({ hasText: "Grace Hopper" }).first()).toContainText("Away");

  const radius = (selector: string) => page.locator(selector).first().evaluate((el) => getComputedStyle(el).borderTopLeftRadius);
  expect(await radius(".ad-avatar--agent")).not.toBe(await radius(".ad-avatar--person"));

  await page.emulateMedia({ forcedColors: "active" });
  await expect(claude.locator(".ad-pill")).toBeVisible();
});

test("the stack counts people and agents in words and names every avatar", async ({ page }) => {
  await page.goto("/patterns");
  const stack = page.getByRole("list", { name: "Here now" });
  await expect(stack.getByRole("img")).toHaveCount(5);
  await expect(stack.getByRole("img", { name: "Claude, agent" })).toBeVisible();
  await expect(stack.getByRole("img", { name: "2 more" })).toBeVisible();
  await expect(page.locator(".ad-stack__summary")).toHaveText("4 people, 2 agents");
});

test("a hostile name shows as unnamed", async ({ page }) => {
  await page.goto("/patterns");
  await expect(page.locator(".ad-chip", { hasText: "Unnamed person" })).toHaveCount(1);
  await expect(page.getByText("evil")).toHaveCount(0);
});

test("a file row links by name, shows who edited, and labels an agent edit", async ({ page }) => {
  await page.goto("/patterns");
  const list = page.getByRole("list", { name: "Recent files" });
  await expect(list.getByRole("listitem")).toHaveCount(3);
  await expect(list.getByRole("link", { name: "Launch plan" })).toHaveAttribute("href", "#launch-plan");
  const notes = list.getByRole("listitem").filter({ hasText: "Meeting notes" });
  await expect(notes).toContainText("Edited by");
  await expect(notes).toContainText("Agent");
  await expect(notes.locator("time")).toHaveAttribute("datetime", "2026-10-26T15:30:00.000Z");
});

test("targets on the patterns page are at least 24 by 24 CSS pixels", async ({ page }) => {
  await page.goto("/patterns");
  const small: string[] = [];
  for (const el of await page.locator("button:visible, select, a:visible").all()) {
    const box = await el.boundingBox();
    if (box && (box.width < 24 || box.height < 24)) small.push(await el.evaluate((n) => n.outerHTML.slice(0, 70)));
  }
  expect(small).toEqual([]);
});
