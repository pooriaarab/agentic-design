import { expect, test, type Page } from "@playwright/test";

// Fonts and cursor tags move the text, so measure after both have settled.
const settle = (page: Page) =>
  page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
  });

const pages = ["/", "/primitives", "/patterns", "/editor", "/chrome", "/data"];

for (const width of [320, 360, 390]) {
  for (const path of pages) {
    test(`${path} does not scroll sideways at ${width}px`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto(path);
      await page.locator(".agd-shell__topbar").waitFor();
      if (path === "/editor") await page.locator(".agd-cursor__tag").first().waitFor();
      await settle(page);
      const widths = await page.evaluate(() => {
        const el = document.scrollingElement!;
        const bar = document.querySelector(".agd-shell__topbar")!;
        const boxes = [...bar.querySelectorAll("*")].filter((e) => e.getClientRects().length > 0).map((e) => e.getBoundingClientRect());
        // Anything past the left edge cannot be scrolled to, so it is lost.
        return { scroll: el.scrollWidth, client: el.clientWidth, bar: Math.ceil(Math.max(...boxes.map((b) => b.right))), barLeft: Math.floor(Math.min(...boxes.map((b) => b.left))), tags: [...document.querySelectorAll(".agd-cursor__tag")].map((t) => [Math.floor(t.getBoundingClientRect().left), Math.ceil(t.getBoundingClientRect().right)]) };
      });
      await page.screenshot({ path: testInfo.outputPath(`top-${width}.png`), clip: { x: 0, y: 0, width, height: 200 } });
      expect(widths.scroll).toBeLessThanOrEqual(widths.client);
      // Nothing in the top bar is drawn past the right edge, even if a parent hides it.
      expect(widths.bar).toBeLessThanOrEqual(width);
      expect(widths.barLeft).toBeGreaterThanOrEqual(0);
      // A cursor name tag stays whole on the screen, so the name and the word Agent can be read.
      for (const [left, right] of widths.tags) {
        expect(left).toBeGreaterThanOrEqual(0);
        expect(right).toBeLessThanOrEqual(width);
      }
    });
  }
}

test("the theme picker folds behind a More options button on a narrow screen, and the keyboard works it", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto("/editor");
  const more = page.getByRole("button", { name: "More options", exact: true });
  const theme = page.getByLabel("Theme");
  await expect(more).toHaveAttribute("aria-expanded", "false");
  await expect(theme).toBeHidden();
  await more.focus();
  await page.keyboard.press("Enter");
  await expect(more).toHaveAttribute("aria-expanded", "true");
  await expect(theme).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(theme).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(theme).toBeHidden();
  await expect(more).toBeFocused();
});

test("on a wide screen there is no More button and the theme picker is in the top bar", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/editor");
  await expect(page.getByRole("button", { name: "More options", exact: true })).toBeHidden();
  await expect(page.locator(".agd-shell__topbar").getByLabel("Theme")).toBeVisible();
});

test("in a right-to-left page nothing leaves the screen at 390px", async ({ page }) => {
  await page.addInitScript(() => {
    const set = () => document.documentElement && (document.documentElement.dir = "rtl");
    set();
    new MutationObserver(set).observe(document, { childList: true });
  });
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto("/editor");
  await page.locator(".agd-shell__topbar").waitFor();
  await page.locator(".agd-cursor__tag").first().waitFor();
  await settle(page);
  const out = await page.evaluate(() => {
    const el = document.scrollingElement!;
    const edges = [...document.querySelectorAll(".agd-shell__topbar *, .agd-cursor__tag")].filter((e) => e.getClientRects().length > 0).map((e) => e.getBoundingClientRect());
    return { scroll: el.scrollWidth <= el.clientWidth, left: Math.floor(Math.min(...edges.map((b) => b.left))), right: Math.ceil(Math.max(...edges.map((b) => b.right))) };
  });
  expect(out.scroll).toBe(true);
  expect(out.left).toBeGreaterThanOrEqual(0);
  expect(out.right).toBeLessThanOrEqual(390);
});

for (const dir of ["ltr", "rtl"]) {
  test(`a very long agent cursor tag stays whole on a 320px ${dir} screen`, async ({ page }) => {
    await page.addInitScript((d) => {
      const set = () => document.documentElement && (document.documentElement.dir = d);
      set();
      new MutationObserver(set).observe(document, { childList: true });
    }, dir);
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto("/editor");
    const tag = page.locator(".agd-cursor--agent .agd-cursor__tag");
    await tag.waitFor();
    // The longest name the name check allows, twice: the agent and who it acts for.
    const long = "A".repeat(20) + " " + "B".repeat(19);
    await tag.evaluate((el, text) => {
      el.textContent = `${text} · Agent · for ${text}`;
      window.dispatchEvent(new Event("resize"));
    }, long);
    const box = await tag.evaluate((el) => {
      const b = el.getBoundingClientRect();
      return { left: b.left, right: b.right, scroll: document.scrollingElement!.scrollWidth <= document.scrollingElement!.clientWidth };
    });
    expect(box.left).toBeGreaterThanOrEqual(0);
    expect(box.right).toBeLessThanOrEqual(320);
    expect(box.scroll).toBe(true);
  });
}

test("narrowing with focus in the folded actions opens them, and Escape returns focus to the button", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/editor");
  await page.getByLabel("Theme").focus();
  await page.setViewportSize({ width: 390, height: 800 });
  const more = page.getByRole("button", { name: "More options", exact: true });
  await expect(more).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByLabel("Theme")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(more).toBeFocused();
  await expect(page.getByLabel("Theme")).toBeHidden();
});
