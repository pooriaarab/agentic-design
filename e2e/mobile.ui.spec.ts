import { expect, test } from "@playwright/test";

const pages = ["/", "/primitives", "/patterns", "/editor", "/chrome"];

for (const width of [360, 390]) {
  for (const path of pages) {
    test(`${path} does not scroll sideways at ${width}px`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto(path);
      await page.locator(".agd-shell__topbar").waitFor();
      const widths = await page.evaluate(() => {
        const el = document.scrollingElement!;
        const bar = document.querySelector(".agd-shell__topbar")!;
        const right = Math.max(...[...bar.querySelectorAll("*")].filter((e) => e.getClientRects().length > 0).map((e) => e.getBoundingClientRect().right));
        return { scroll: el.scrollWidth, client: el.clientWidth, bar: Math.ceil(right) };
      });
      await page.screenshot({ path: testInfo.outputPath(`top-${width}.png`), clip: { x: 0, y: 0, width, height: 200 } });
      expect(widths.scroll).toBeLessThanOrEqual(widths.client);
      // Nothing in the top bar is drawn past the right edge, even if a parent hides it.
      expect(widths.bar).toBeLessThanOrEqual(width);
    });
  }
}

test("the theme picker folds behind a More button on a narrow screen, and the keyboard works it", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto("/editor");
  const more = page.getByRole("button", { name: "More" });
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
  await expect(page.getByRole("button", { name: "More", exact: true })).toBeHidden();
  await expect(page.locator(".agd-shell__topbar").getByLabel("Theme")).toBeVisible();
});
