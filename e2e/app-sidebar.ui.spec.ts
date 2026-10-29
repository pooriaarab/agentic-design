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
