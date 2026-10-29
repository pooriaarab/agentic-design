import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
const violations = async (page: Page, selector?: string) => {
  const axe = new AxeBuilder({ page }).withTags(WCAG_TAGS);
  if (selector) axe.include(selector);
  return (await axe.analyze()).violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) }));
};

// The review set. A run with SCREENSHOTS=1 refreshes the committed files in docs/screenshots.
const shot = async (page: Page, selector: string, name: string, scheme: string, testInfo: { outputPath: (n: string) => string }) => {
  const path = process.env.SCREENSHOTS ? `docs/screenshots/${name}-${scheme}.png` : testInfo.outputPath(`${name}-${scheme}.png`);
  await page.locator(selector).screenshot({ path, animations: "disabled" });
};

const parts = [
  ["document-title", "#demo-title"],
  ["toolbar", "#demo-toolbar"],
  ["agent-badge", "#demo-agent"],
] as const;

for (const scheme of ["light", "dark"] as const) {
  for (const [name, selector] of parts) {
    test(`${name} has no axe violations in ${scheme}`, async ({ page }, testInfo) => {
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto("/chrome");
      await expect(page.locator(selector)).toBeVisible();
      await shot(page, selector, name, scheme, testInfo);
      expect(await violations(page, selector)).toEqual([]);
    });
  }

  test(`the shell with a side panel has no axe violations in ${scheme}`, async ({ page }, testInfo) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto("/chrome");
    await expect(page.getByRole("complementary", { name: "Notes" })).toBeVisible();
    await page.screenshot({ path: process.env.SCREENSHOTS ? `docs/screenshots/app-shell-${scheme}.png` : testInfo.outputPath(`app-shell-${scheme}.png`), animations: "disabled" });
    expect(await violations(page)).toEqual([]);
  });
}

test("a title renames in place by keyboard and gives focus back", async ({ page }) => {
  await page.goto("/chrome");
  const button = page.getByRole("button", { name: "Launch plan, rename" });
  await button.focus();
  await page.keyboard.press("Enter");
  const field = page.getByRole("textbox", { name: "Document title" });
  await expect(field).toBeFocused();
  await page.keyboard.type("Q4 plan");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: "Q4 plan, rename" })).toBeFocused();

  // Escape drops the edit. F2 opens the field too.
  await page.keyboard.press("F2");
  await page.keyboard.type("Nope");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Q4 plan, rename" })).toBeFocused();
});

test("a blank or hidden-character title is refused with a message", async ({ page }) => {
  await page.goto("/chrome");
  await page.getByRole("button", { name: "Launch plan, rename" }).click();
  const field = page.getByRole("textbox", { name: "Document title" });
  await field.fill("   ");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("alert")).toHaveText("Enter a title.");
  await expect(field).toHaveAttribute("aria-invalid", "true");
  await field.fill("Plan\u202Eexe");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("alert")).toContainText("no hidden characters");
  expect(await violations(page, "#demo-title")).toEqual([]);
  // A double space gets its own message, and leaving the field keeps the edit and the message.
  await field.fill("Q4  roadmap");
  await page.getByRole("heading", { name: "Document title" }).click();
  await expect(page.getByRole("alert")).toHaveText("Use single spaces only.");
  await expect(field).toHaveValue("Q4  roadmap");
  // Escape drops the edit and keeps the old title.
  await field.focus();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Launch plan, rename" })).toBeFocused();
});

test("a stored title over the limit can be opened and left without a change", async ({ page }) => {
  await page.goto("/chrome");
  const long = "A stored title that is longer than its limit";
  await page.getByRole("button", { name: `${long}, rename` }).click();
  await expect(page.getByRole("textbox", { name: "Imported title" })).toHaveValue(long);
  await page.getByRole("heading", { name: "Document title" }).click();
  await expect(page.getByRole("button", { name: `${long}, rename` })).toBeVisible();
  await expect(page.getByRole("alert")).toHaveCount(0);
});

test("leaving the field saves a good title", async ({ page }) => {
  await page.goto("/chrome");
  await page.getByRole("button", { name: "Launch plan, rename" }).click();
  await page.getByRole("textbox", { name: "Document title" }).fill("Roadmap");
  await page.getByRole("heading", { name: "Document title" }).click();
  await expect(page.getByRole("button", { name: "Roadmap, rename" })).toBeVisible();
});

test("the toolbar has named groups, one tab stop, and an overflow menu in the same roving focus", async ({ page }) => {
  await page.goto("/chrome");
  const toolbar = page.getByRole("toolbar", { name: "Editor tools" });
  await expect(toolbar.getByRole("group", { name: "Text style" })).toBeVisible();
  await expect(toolbar.getByRole("group", { name: "Insert" })).toBeVisible();

  // The imported title is the last tab stop before the toolbar.
  await page.getByRole("button", { name: /^A stored title.*, rename$/ }).focus();
  await page.keyboard.press("Tab");
  await expect(toolbar.locator(":focus")).toHaveCount(1);
  await page.keyboard.press("Tab");
  expect(await page.evaluate(() => !!document.activeElement?.closest('[role="toolbar"]'))).toBe(false);

  await toolbar.getByRole("button", { name: "Bold" }).focus();
  await page.keyboard.press("End");
  const more = toolbar.getByRole("button", { name: "More tools" });
  await expect(more).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("menu")).toBeVisible();
  expect(await violations(page, '[role="menu"]')).toEqual([]);
  // The menu opens with its first item active.
  await page.keyboard.press("Enter");
  await expect(page.locator("#last-action")).toHaveText("clear");
  await expect(more).toBeFocused();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Escape");
  await expect(more).toBeFocused();
});

test("the badge says it in words and keeps the facts when only the avatar fits", async ({ page }) => {
  await page.goto("/chrome");
  const badge = page.locator(".agd-agent-badge:not(.agd-agent-badge--compact)").first();
  await expect(badge).toContainText("Made by an agent");
  await expect(badge).toContainText("Claude, for Ada Lovelace");
  await expect(page.locator(".agd-agent-badge").nth(1)).toContainText("for unknown");
  const compact = page.locator(".agd-agent-badge--compact").getByRole("img");
  // The hostile name fails the allow-list, so the badge shows the generic name.
  await expect(compact).toHaveAttribute("aria-label", "Made by an agent: Unnamed agent, acting for Ada Lovelace");
  const radius = (el: ReturnType<Page["locator"]>) => el.evaluate((n) => getComputedStyle(n).borderTopLeftRadius);
  expect(await radius(compact)).not.toBe("9999px");
});

test("in forced colors the badge keeps its line and the title field keeps its focus outline", async ({ page }) => {
  await page.emulateMedia({ forcedColors: "active" });
  await page.goto("/chrome");
  const border = (selector: string) => page.locator(selector).first().evaluate((n) => getComputedStyle(n).borderTopColor);
  const system = (color: string) => page.evaluate((c) => {
    const probe = document.createElement("div");
    probe.style.color = c;
    document.body.append(probe);
    const value = getComputedStyle(probe).color;
    probe.remove();
    return value;
  }, color);
  // The page border color is replaced by the system text color, so the badge keeps its line.
  expect(await border(".agd-agent-badge:not(.agd-agent-badge--compact)")).toBe(await system("CanvasText"));
  await page.getByRole("button", { name: "Launch plan, rename" }).click();
  const outline = await page.getByRole("textbox", { name: "Document title" }).evaluate((n) => getComputedStyle(n).outlineStyle);
  expect(outline).not.toBe("none");
});

test("the side panel is a landmark, sits after the content, and falls under it on a narrow screen", async ({ page }) => {
  await page.goto("/chrome");
  const panel = page.getByRole("complementary", { name: "Notes" });
  const main = page.getByRole("main");
  const [p, m] = [await panel.boundingBox(), await main.boundingBox()];
  expect((p?.x ?? 0) > (m?.x ?? 0)).toBe(true);
  await page.setViewportSize({ width: 390, height: 800 });
  const [p2, m2] = [await panel.boundingBox(), await main.boundingBox()];
  expect((p2?.y ?? 0) >= (m2?.y ?? 0) + (m2?.height ?? 0) - 1).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
});

test("between 48rem and 64rem the panel sits under the content and the content keeps its room", async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 800 });
  await page.goto("/chrome");
  const [p, m] = [await page.getByRole("complementary", { name: "Notes" }).boundingBox(), await page.getByRole("main").boundingBox()];
  expect((p?.y ?? 0) >= (m?.y ?? 0) + (m?.height ?? 0) - 1).toBe(true);
  expect((m?.width ?? 0) > 500).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
});

test("in a right-to-left page the panel moves to the start side", async ({ page }) => {
  await page.goto("/chrome");
  await page.evaluate(() => document.documentElement.setAttribute("dir", "rtl"));
  const [p, m] = [await page.getByRole("complementary", { name: "Notes" }).boundingBox(), await page.getByRole("main").boundingBox()];
  expect((p?.x ?? 0) < (m?.x ?? 0)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
  expect(await violations(page)).toEqual([]);
});

test("in a right-to-left page the toolbar arrow keys follow the page direction", async ({ page }) => {
  // The page is right-to-left from its first render, as a real RTL app is.
  await page.addInitScript(() => {
    const set = () => document.documentElement?.setAttribute("dir", "rtl");
    set();
    document.addEventListener("readystatechange", set);
  });
  await page.goto("/chrome");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  const toolbar = page.getByRole("toolbar", { name: "Editor tools" });
  await toolbar.getByRole("button", { name: "Bold" }).focus();
  await page.keyboard.press("ArrowLeft");
  await expect(toolbar.getByRole("button", { name: "Italic" })).toBeFocused();
});

test("the brand sits in the banner landmark, and every landmark holds all content", async ({ page }) => {
  await page.goto("/chrome");
  const banner = page.getByRole("banner");
  await expect(banner).toHaveCount(1);
  await expect(banner.getByText("agentic-design", { exact: true })).toBeVisible();
  // Everything outside the skip link must sit in a landmark. Axe reports this as `region`.
  const result = await new AxeBuilder({ page }).withRules(["region", "landmark-one-main", "landmark-no-duplicate-banner", "landmark-banner-is-top-level"]).analyze();
  expect(result.violations.map((v) => v.id)).toEqual([]);
});

test("SidebarNav keeps plain anchors by default and accepts a host link component or a render prop", async ({ page }) => {
  await page.goto("/chrome");
  const plain = page.getByRole("navigation", { name: "Demo pages" }).getByRole("link", { name: "Tokens" });
  await expect(plain).toHaveCount(1);
  await expect(plain).not.toHaveAttribute("data-host-link", /.*/);
  const component = page.getByRole("navigation", { name: "Host component links" }).getByRole("link", { name: "Component link" });
  await expect(component).toHaveAttribute("data-host-link", "component");
  await expect(component).toHaveAttribute("aria-current", "page");
  await expect(component).toHaveClass(/agd-sidebar-nav__link/);
  const render = page.getByRole("navigation", { name: "Render prop links" }).getByRole("link", { name: "Render prop link" });
  await expect(render).toHaveAttribute("data-host-link", "render");
  await expect(render).toHaveClass(/agd-sidebar-nav__link/);
  expect(await violations(page, "#demo-links")).toEqual([]);
});
