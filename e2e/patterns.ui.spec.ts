import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
const violations = async (page: Page) =>
  (await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()).violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) }));

for (const scheme of ["light", "dark"] as const) {
  test(`patterns have no axe violations in ${scheme}`, async ({ page }, testInfo) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto("/patterns");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath(`patterns-${scheme}.png`), fullPage: true });
    expect(await violations(page)).toEqual([]);
    await page.getByRole("button", { name: "Show empty state" }).click();
    await expect(page.getByRole("heading", { name: "No files yet" })).toBeVisible();
    expect(await violations(page)).toEqual([]);
  });
}

test("the shell has a skip link, one main landmark, and marks the current page", async ({ page }) => {
  await page.goto("/patterns");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Theme" })).toBeVisible();
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Skip to content" });
  await expect(skip).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("main")).toBeFocused();
  await expect(page.getByRole("main")).toHaveCount(1);
  await expect(page.getByRole("navigation", { name: "Demo pages" }).getByRole("link", { name: "Patterns" })).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Patterns");
});

test("on a narrow screen the nav opens under its button, takes focus, and Escape gives focus back", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto("/patterns");
  const nav = page.getByRole("navigation", { name: "Demo pages" });
  const toggle = page.getByRole("button", { name: "Navigation" });
  await expect(nav).toBeHidden();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await toggle.click();
  await expect(nav).toBeVisible();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  // The opened nav sits below the top bar, and focus is already inside it.
  const [toggleBox, navBox] = [await toggle.boundingBox(), await nav.boundingBox()];
  expect((navBox?.y ?? 0) > (toggleBox?.y ?? 0)).toBe(true);
  await expect(nav.getByRole("link").first()).toBeFocused();
  expect(await violations(page)).toEqual([]);

  await nav.getByRole("link", { name: "Patterns" }).focus();
  await page.keyboard.press("Escape");
  await expect(nav).toBeHidden();
  await expect(toggle).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
});

test("Escape from a menu elsewhere does not close the open nav", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto("/patterns");
  await page.getByRole("button", { name: "Navigation" }).click();
  await page.getByRole("button", { name: "More actions for Launch plan" }).click();
  await expect(page.getByRole("menu")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("menu")).toBeHidden();
  await expect(page.getByRole("navigation", { name: "Demo pages" })).toBeVisible();
});

test("the toolbar is one tab stop, moves with arrow keys, and toggles", async ({ page }) => {
  await page.goto("/patterns");
  const toolbar = page.getByRole("toolbar", { name: "Text formatting" });
  const bold = toolbar.getByRole("button", { name: "Bold" });
  const italic = toolbar.getByRole("button", { name: "Italic" });
  const insert = toolbar.getByRole("button", { name: "Insert item" });
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  // Tab enters the toolbar on one item, and the next Tab leaves it.
  await page.getByRole("combobox", { name: "Theme" }).focus();
  await page.keyboard.press("Tab");
  await expect(toolbar.locator(":focus")).toHaveCount(1);
  await page.keyboard.press("Tab");
  expect(await page.evaluate(() => !!document.activeElement?.closest('[role="toolbar"]'))).toBe(false);

  await bold.focus();
  await page.keyboard.press("ArrowRight");
  await expect(italic).toBeFocused();
  await page.keyboard.press("End");
  await expect(insert).toBeFocused();
  await page.keyboard.press("Home");
  await expect(bold).toBeFocused();
  await expect(bold).toHaveAttribute("aria-pressed", "false");
  await page.keyboard.press("Space");
  await expect(bold).toHaveAttribute("aria-pressed", "true");
});

test("a pressed toggle differs by shape, not only by color, and in forced colors", async ({ page }) => {
  await page.goto("/patterns");
  const bold = page.getByRole("button", { name: "Bold" });
  const italic = page.getByRole("button", { name: "Italic" });
  const shadow = (el: Locator) => el.evaluate((n) => getComputedStyle(n).boxShadow);
  // Italic starts pressed. Bold does not.
  expect(await shadow(bold)).toBe("none");
  expect(await shadow(italic)).not.toBe("none");

  await page.emulateMedia({ forcedColors: "active" });
  const fill = (el: Locator) => el.evaluate((n) => getComputedStyle(n).backgroundColor);
  // Assert the rule itself: a pressed fill is the system Highlight, which is not the page Canvas.
  const system = (color: string) => page.evaluate((c) => {
    const probe = document.createElement("div");
    probe.style.backgroundColor = c;
    document.body.append(probe);
    const value = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return value;
  }, color);
  // The button animates its fill, so wait for it to settle.
  await expect.poll(() => fill(italic)).toBe(await system("Highlight"));
  expect(await fill(italic)).not.toBe(await system("Canvas"));
});

test("an agent is labeled as an agent by a word and a shape, never by color alone", async ({ page }) => {
  await page.goto("/patterns");
  const chips = page.locator(".agd-chip");
  const claude = chips.filter({ hasText: "Claude" }).first();
  await expect(claude).toContainText("Agent");
  await expect(claude).toContainText("for Ada Lovelace");
  await expect(chips.filter({ hasText: "Ada Lovelace" }).first()).not.toContainText("Agent");
  const bot = chips.filter({ hasText: "Review bot" });
  await expect(bot).toContainText("Agent");
  await expect(bot).toContainText("Paused");
  // An agent with no principal says so. It never leaves the line out.
  await expect(bot).toContainText("for unknown");
  await expect(chips.filter({ hasText: "Grace Hopper" }).first()).toContainText("Away");

  const radius = (selector: string) => page.locator(selector).first().evaluate((el) => getComputedStyle(el).borderTopLeftRadius);
  expect(await radius(".agd-avatar--agent")).not.toBe(await radius(".agd-avatar--person"));

  // In forced colors the pill keeps its line and the avatar keeps its shape.
  await page.emulateMedia({ forcedColors: "active" });
  const pill = await claude.locator(".agd-pill").evaluate((el) => {
    const s = getComputedStyle(el);
    return { style: s.borderTopStyle, width: parseFloat(s.borderTopWidth) };
  });
  expect(pill.style).toBe("solid");
  expect(pill.width).toBeGreaterThanOrEqual(1);
  expect(await radius(".agd-avatar--agent")).not.toBe(await radius(".agd-avatar--person"));
});

test("the stack counts people and agents in words and names every avatar", async ({ page }) => {
  await page.goto("/patterns");
  const stack = page.getByRole("list", { name: "Here now" });
  await expect(stack.getByRole("img")).toHaveCount(5);
  await expect(stack.getByRole("img", { name: "Claude, agent, acting for Ada Lovelace" })).toBeVisible();
  await expect(stack.getByRole("img", { name: "Review bot, agent, acting for an unknown person, paused" })).toBeVisible();
  await expect(stack.getByRole("img", { name: "Grace Hopper, person, away" })).toBeVisible();
  await expect(stack.getByRole("img", { name: "2 more" })).toBeVisible();
  await expect(page.locator(".agd-stack__summary")).toHaveText("4 people, 2 agents");
});

test("a hostile name shows as unnamed", async ({ page }) => {
  await page.goto("/patterns");
  await expect(page.locator(".agd-chip", { hasText: "Unnamed person" })).toHaveCount(1);
  await expect(page.getByText("evil")).toHaveCount(0);
});

test("a file row links by name, shows who edited, and labels an agent edit", async ({ page }) => {
  await page.goto("/patterns");
  const list = page.getByRole("list", { name: "Recent files" });
  await expect(list.getByRole("listitem")).toHaveCount(4);
  await expect(list.getByRole("link", { name: "Launch plan" })).toHaveAttribute("href", "#launch-plan");
  const notes = list.getByRole("listitem").filter({ hasText: "Meeting notes" });
  await expect(notes).toContainText("Edited by");
  await expect(notes).toContainText("Agent");
  await expect(notes.locator("time")).toHaveAttribute("datetime", "2026-10-26T15:30:00.000Z");
});

for (const width of [1280, 390]) {
  test(`targets on the patterns page are at least 24 by 24 CSS pixels at ${width} px wide`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/patterns");
    if (width < 768) await page.getByRole("button", { name: "Navigation" }).click();
    const small: string[] = [];
    for (const el of await page.locator("button:visible, select, a:visible").all()) {
      const box = await el.boundingBox();
      if (box && (box.width < 24 || box.height < 24)) small.push(await el.evaluate((n) => n.outerHTML.slice(0, 70)));
    }
    expect(small).toEqual([]);
  });
}

test("on a narrow screen every file row still shows its date", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto("/patterns");
  const times = page.getByRole("list", { name: "Recent files" }).locator("time");
  await expect(times).toHaveCount(3);
  for (const time of await times.all()) await expect(time).toBeVisible();
  await expect(page.getByText("Date unknown")).toBeVisible();
});

test("a malformed peer entry still renders, and an unknown kind shows as an agent", async ({ page }) => {
  await page.goto("/patterns");
  const list = page.getByRole("list", { name: "Malformed entries" });
  const mallory = list.getByRole("listitem").filter({ hasText: "Mallory" });
  await expect(mallory).toContainText("Agent");
  await expect(mallory.locator(".agd-avatar--agent")).toHaveCount(1);
  const trent = list.getByRole("listitem").filter({ hasText: "Trent" });
  await expect(trent).toBeVisible();
  await expect(trent).not.toContainText("busy");
  // A status that is an inherited object key must not crash the page or show as a status.
  await expect(list.getByRole("listitem").filter({ hasText: "Oscar" })).toBeVisible();
  await expect(page.getByRole("list", { name: "Here now" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Patterns");
});

test("a file name with a hidden direction character shows as untitled", async ({ page }) => {
  await page.goto("/patterns");
  const row = page.getByRole("list", { name: "Recent files" }).getByRole("listitem").filter({ hasText: "Untitled" });
  await expect(row).toHaveCount(1);
  await expect(row.getByRole("link", { name: "Untitled" })).toHaveAttribute("href", "#untitled");
  await expect(page.getByText(/txt\.exe/)).toHaveCount(0);
});

test("on a narrow screen the tab order follows what is on the screen", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto("/patterns");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const toggle = page.getByRole("button", { name: "Navigation" });
  await toggle.click();
  const nav = page.getByRole("navigation", { name: "Demo pages" });
  const inHeader = () => page.evaluate(() => !!document.activeElement?.closest("header"));
  const inMain = () => page.evaluate(() => !!document.activeElement?.closest("main"));
  // The nav sits below the top bar. Shift+Tab from its first link goes up into the top bar, not past it.
  await expect(nav.getByRole("link").first()).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  expect(await inHeader()).toBe(true);
  // Tab from the last link goes down into the content.
  await nav.getByRole("link").last().focus();
  await page.keyboard.press("Tab");
  expect(await inMain()).toBe(true);
});

test("a screen reader gets one built sentence per chip, so a person named Agent still reads as a person", async ({ page }) => {
  await page.goto("/patterns");
  const claude = page.locator(".agd-chip").filter({ hasText: "Claude" }).first();
  await expect(claude.locator(".agd-sr-only")).toHaveText("Claude, agent, acting for Ada Lovelace");
  await expect(claude.locator('[aria-hidden="true"]').first()).toBeAttached();
  const trickster = page.locator(".agd-chip").filter({ hasText: "Ada Agent for Bob" });
  await expect(trickster.locator(".agd-sr-only")).toHaveText("Ada Agent for Bob, person");
  await expect(trickster.locator(".agd-pill")).toHaveCount(0);
});

test("the toolbar arrow keys follow a right-to-left page", async ({ page }) => {
  // The root element does not exist when the init script runs, so set the direction when it appears.
  await page.addInitScript(() => {
    const set = () => document.documentElement && (document.documentElement.dir = "rtl");
    set();
    new MutationObserver(set).observe(document, { childList: true });
  });
  await page.goto("/patterns");
  const toolbar = page.getByRole("toolbar", { name: "Text formatting" });
  await toolbar.getByRole("button", { name: "Bold" }).focus();
  await page.keyboard.press("ArrowLeft");
  await expect(toolbar.getByRole("button", { name: "Italic" })).toBeFocused();
});

test("crossing the breakpoint keeps the top bar and its state, and does not remount it", async ({ page }) => {
  await page.goto("/patterns");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const theme = page.getByRole("combobox", { name: "Theme" });
  await theme.selectOption("dark");
  const handle = await theme.elementHandle();
  await page.setViewportSize({ width: 390, height: 800 });
  await expect(page.getByRole("button", { name: "Navigation" })).toBeVisible();
  expect(await handle?.evaluate((el) => el.isConnected)).toBe(true);
  // Narrow folds the picker behind a button, so read it through its handle.
  expect(await handle?.evaluate((el) => (el as HTMLSelectElement).value)).toBe("dark");
  await page.setViewportSize({ width: 1280, height: 800 });
  expect(await handle?.evaluate((el) => el.isConnected)).toBe(true);
  await expect(theme).toHaveValue("dark");
});

test("keyboard focus stays on the top bar when the layout crosses the breakpoint, both ways", async ({ page }) => {
  await page.goto("/patterns");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const theme = page.getByRole("combobox", { name: "Theme" });
  await theme.focus();
  await page.setViewportSize({ width: 390, height: 800 });
  await expect(page.getByRole("button", { name: "Navigation" })).toBeVisible();
  await expect(theme).toBeFocused();
  await page.setViewportSize({ width: 1280, height: 800 });
  await expect(page.getByRole("button", { name: "Navigation" })).toBeHidden();
  await expect(theme).toBeFocused();
});

test("narrowing with focus in the sidebar opens the nav and keeps focus in it", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/patterns");
  const nav = page.getByRole("navigation", { name: "Demo pages" });
  await nav.getByRole("link", { name: "Patterns" }).focus();
  await page.setViewportSize({ width: 390, height: 800 });
  await expect(nav).toBeVisible();
  await expect(nav.getByRole("link", { name: "Patterns" })).toBeFocused();
  await expect(page.getByRole("button", { name: "Navigation" })).toHaveAttribute("aria-expanded", "true");
});

test("widening closes the nav state, so Escape later does not send focus to a hidden button", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto("/patterns");
  const toggle = page.getByRole("button", { name: "Navigation" });
  await toggle.click();
  await page.setViewportSize({ width: 1280, height: 800 });
  // The button is hidden when wide, so reach it by class.
  await expect(page.locator(".agd-shell__menu")).toHaveAttribute("aria-expanded", "false");
  const link = page.getByRole("navigation", { name: "Demo pages" }).getByRole("link", { name: "Patterns" });
  await link.focus();
  await page.keyboard.press("Escape");
  await expect(link).toBeFocused();
  // Narrowing again with focus outside the sidebar starts closed.
  await link.blur();
  await page.setViewportSize({ width: 390, height: 800 });
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
});

test("closing the nav in the narrow layout, then widening, does not move focus to a link nobody chose", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto("/patterns");
  const toggle = page.getByRole("button", { name: "Navigation" });
  await toggle.click();
  await expect(page.getByRole("navigation", { name: "Demo pages" }).getByRole("link").first()).toBeFocused();
  // A click that does not move focus to the button: the link blurs because it is hidden.
  await toggle.dispatchEvent("click");
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  // The browser drops focus from a hidden link on its next frame. Widen only after it has.
  await page.waitForFunction(() => document.activeElement === document.body);
  await page.setViewportSize({ width: 1280, height: 800 });
  await expect(page.getByRole("navigation", { name: "Demo pages" })).toBeVisible();
  expect(await page.evaluate(() => document.activeElement?.closest("nav") !== null)).toBe(false);
});
