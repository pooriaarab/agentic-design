import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
const violations = async (page: Page, selector: string) =>
  (await new AxeBuilder({ page }).withTags(WCAG_TAGS).include(selector).analyze()).violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) }));
const shot = (page: Page, name: string, scheme: string, outputPath: (n: string) => string) =>
  page.locator("#demo-appsidebar").screenshot({ path: process.env.SCREENSHOTS ? `docs/screenshots/${name}-${scheme}.png` : outputPath(`${name}-${scheme}.png`), animations: "disabled" });

const sidebar = (page: Page) => page.getByRole("complementary", { name: "Project" });

for (const scheme of ["light", "dark"] as const) {
  test(`the sidebar has no axe violations open or collapsed in ${scheme}`, async ({ page }, testInfo) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto("/chrome");
    await expect(sidebar(page).getByRole("link", { name: "Tasks" })).toBeVisible();
    await shot(page, "app-sidebar-open", scheme, (n) => testInfo.outputPath(n));
    expect(await violations(page, "#demo-appsidebar")).toEqual([]);
    await sidebar(page).getByRole("button", { name: "Collapse sidebar" }).click();
    await expect(sidebar(page).getByRole("link", { name: "Tasks" })).toBeHidden();
    await shot(page, "app-sidebar-collapsed", scheme, (n) => testInfo.outputPath(n));
    expect(await violations(page, "#demo-appsidebar")).toEqual([]);
  });
}

test("the toggle names its action, reports its state, and works with the keyboard", async ({ page }) => {
  await page.goto("/chrome");
  const button = sidebar(page).getByRole("button", { name: "Collapse sidebar" });
  await expect(button).toHaveAttribute("aria-expanded", "true");
  await button.focus();
  await page.keyboard.press("Enter");
  const expand = sidebar(page).getByRole("button", { name: "Expand sidebar" });
  await expect(expand).toHaveAttribute("aria-expanded", "false");
  await expect(expand).toBeFocused();
  await page.keyboard.press("Space");
  await expect(sidebar(page).getByRole("button", { name: "Collapse sidebar" })).toBeFocused();
  await expect(sidebar(page).getByRole("link", { name: "Files" })).toBeVisible();
});

test("a collapsed sidebar leaves its links out of the tab order and is narrow", async ({ page }) => {
  await page.goto("/chrome");
  const open = await sidebar(page).boundingBox();
  await sidebar(page).getByRole("button", { name: "Collapse sidebar" }).click();
  expect(open).not.toBeNull();
  // The width animates, so wait for it to settle.
  await expect.poll(async () => (await sidebar(page).boundingBox())?.width ?? 999).toBeLessThan(open!.width / 2);
  await expect(sidebar(page).getByRole("link")).toHaveCount(0);
});

test("the choice is remembered after a reload", async ({ page }) => {
  await page.goto("/chrome");
  await sidebar(page).getByRole("button", { name: "Collapse sidebar" }).click();
  await page.reload();
  await expect(sidebar(page).getByRole("button", { name: "Expand sidebar" })).toBeVisible();
  await sidebar(page).getByRole("button", { name: "Expand sidebar" }).click();
  await page.reload();
  await expect(sidebar(page).getByRole("button", { name: "Collapse sidebar" })).toBeVisible();
});

test("a saved value that is not a known choice is ignored", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem("demo-sidebar", "{\"evil\":1}"));
  await page.goto("/chrome");
  await expect(sidebar(page).getByRole("button", { name: "Collapse sidebar" })).toBeVisible();
});

test("a storage that throws still lets the sidebar toggle for the page", async ({ page }) => {
  await page.addInitScript(() => {
    const fail = () => { throw new Error("blocked"); };
    Object.defineProperty(window, "localStorage", { get: fail });
  });
  await page.goto("/chrome");
  await sidebar(page).getByRole("button", { name: "Collapse sidebar" }).click();
  await expect(sidebar(page).getByRole("button", { name: "Expand sidebar" })).toBeVisible();
});

test("a change in another tab reaches this one", async ({ page, context }) => {
  await page.goto("/chrome");
  const other = await context.newPage();
  await other.goto("/chrome");
  await sidebar(other).getByRole("button", { name: "Collapse sidebar" }).click();
  await expect(sidebar(page).getByRole("button", { name: "Expand sidebar" })).toBeVisible();
});

test("when saving fails but reading works, the toggle still works", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("demo-sidebar", "open");
    Storage.prototype.setItem = () => { throw new DOMException("full", "QuotaExceededError"); };
  });
  await page.goto("/chrome");
  await sidebar(page).getByRole("button", { name: "Collapse sidebar" }).click();
  await expect(sidebar(page).getByRole("button", { name: "Expand sidebar" })).toBeVisible();
  await sidebar(page).getByRole("button", { name: "Expand sidebar" }).click();
  await expect(sidebar(page).getByRole("button", { name: "Collapse sidebar" })).toBeVisible();
});

test("on a small screen with nothing saved, the sidebar starts collapsed", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto("/chrome");
  await expect(sidebar(page).getByRole("button", { name: "Expand sidebar" })).toBeVisible();
});

test("controlled mode calls the handler, saves nothing, and a function child stays mounted", async ({ page }) => {
  await page.goto("/chrome");
  const rail = page.getByRole("complementary", { name: "Rail" });
  await expect(rail.getByRole("link", { name: "Item 1", exact: true })).toBeVisible();
  await rail.getByRole("button", { name: "Collapse sidebar" }).click();
  await expect(rail.getByRole("button", { name: "Expand sidebar" })).toBeVisible();
  await expect(rail.getByText("T", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => window.localStorage.length)).toBe(0);
});

test("a window that turns narrow moves focus from the hidden links to the toggle", async ({ page }) => {
  await page.goto("/chrome");
  await sidebar(page).getByRole("link", { name: "Tasks" }).focus();
  await page.setViewportSize({ width: 320, height: 640 });
  await expect(sidebar(page).getByRole("button", { name: "Expand sidebar" })).toBeFocused();
});

test("a change in another tab replaces a choice that could not be saved", async ({ page, context }) => {
  await page.addInitScript(() => {
    if (location.hash === "#stuck") Storage.prototype.setItem = () => { throw new DOMException("full", "QuotaExceededError"); };
  });
  await page.goto("/chrome#stuck");
  await sidebar(page).getByRole("button", { name: "Collapse sidebar" }).click();
  await expect(sidebar(page).getByRole("button", { name: "Expand sidebar" })).toBeVisible();
  const other = await context.newPage();
  await other.goto("/chrome");
  await sidebar(other).getByRole("button", { name: "Collapse sidebar" }).click();
  await sidebar(other).getByRole("button", { name: "Expand sidebar" }).click();
  await expect(sidebar(page).getByRole("button", { name: "Collapse sidebar" })).toBeVisible();
});

test("a long sidebar in a frame of fixed height scrolls to its last item with the wheel", async ({ page }) => {
  await page.goto("/chrome");
  const rail = page.getByRole("complementary", { name: "Rail" });
  const last = rail.getByRole("link", { name: "Item 30" });
  await rail.scrollIntoViewIfNeeded();
  const content = rail.locator(".agd-appsidebar__content");
  await content.evaluate((el) => { el.scrollTop = 0; });
  const box = await content.boundingBox();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.wheel(0, 4000);
  await expect.poll(() => content.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
  await expect(last).toBeInViewport();
});

test("a sidebar that collapses from outside moves focus from a removed link to the toggle", async ({ page }) => {
  await page.goto("/chrome");
  const rail = page.getByRole("complementary", { name: "Rail" });
  await rail.getByRole("link", { name: "Item 3", exact: true }).focus();
  await page.locator("#demo-rail-collapse").evaluate((el) => (el as HTMLElement).click());
  await expect(rail.getByRole("button", { name: "Expand sidebar" })).toBeFocused();
});

test("a keyboard focus ring on a sidebar link is not cut off by the sidebar", async ({ page }) => {
  await page.goto("/chrome");
  const link = sidebar(page).getByRole("link", { name: "Overview" });
  await page.keyboard.press("Tab");
  await link.focus();
  const [linkBox, contentBox] = await Promise.all([link.boundingBox(), sidebar(page).locator(".agd-appsidebar__content").boundingBox()]);
  // The ring is 2px wide and 2px away from the link, so it needs 4px on each side.
  expect(linkBox!.x - contentBox!.x).toBeGreaterThanOrEqual(4);
  expect(contentBox!.x + contentBox!.width - (linkBox!.x + linkBox!.width)).toBeGreaterThanOrEqual(4);
  expect(linkBox!.y - contentBox!.y).toBeGreaterThanOrEqual(4);
});
