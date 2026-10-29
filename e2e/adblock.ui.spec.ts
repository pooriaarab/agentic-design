import { readFileSync } from "node:fs";
import { PlaywrightBlocker } from "@ghostery/adblocker-playwright";
import { expect, test, type Page } from "@playwright/test";

// A vendored snapshot of the generic EasyList cosmetic rules, so CI needs no network.
const EASYLIST = readFileSync(new URL("./fixtures/easylist-generic-cosmetic.txt", import.meta.url), "utf8");

const withBlocker = async (page: Page, { oldPrefix = false } = {}) => {
  const blocker = PlaywrightBlocker.parse(EASYLIST);
  await blocker.enableBlockingInPage(page);
  if (oldPrefix) {
    // Serve the old class prefix, to prove this guard fails on it.
    await page.route("**/*", async (route) => {
      const response = await route.fetch();
      const type = response.headers()["content-type"] ?? "";
      if (!/html|javascript|css/.test(type)) return route.fulfill({ response });
      await route.fulfill({ response, body: (await response.text()).replaceAll("agd-", "ad-") });
    });
  }
};

const hiddenByBlocker = (page: Page, selector: string) =>
  page.locator(selector).first().evaluate((el) => getComputedStyle(el).display === "none");

test("the filter list really hides ad- classes", async ({ page }) => {
  await withBlocker(page);
  await page.goto("/primitives");
  await page.evaluate(() => {
    document.body.insertAdjacentHTML("beforeend", '<button class="ad-button" id="probe">probe</button>');
  });
  await expect(page.locator("#probe")).toBeHidden();
});

test("with EasyList cosmetic filters, buttons and inputs stay visible", async ({ page }) => {
  await withBlocker(page);
  await page.goto("/primitives");
  await expect(page.getByRole("button", { name: "Add item" })).toBeVisible();
  await expect(page.locator("form").getByRole("button", { name: "Save" })).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByLabel(/^Name/)).toBeVisible();
});

test("with EasyList cosmetic filters, the skip link shows on focus", async ({ page }) => {
  await withBlocker(page);
  await page.goto("/patterns");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Skip to content" });
  await expect(skip).toBeFocused();
  await expect(skip).toBeVisible();
  expect(await hiddenByBlocker(page, ".agd-skip-link")).toBe(false);
});

test("with EasyList cosmetic filters, a dialog opens and stays visible", async ({ page }) => {
  await withBlocker(page);
  await page.goto("/primitives");
  await page.getByRole("button", { name: "Delete page…" }).click();
  const dialog = page.getByRole("dialog", { name: "Delete this page?" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Cancel" })).toBeVisible();
});

test("the guard fails on the old ad- prefix", async ({ page }) => {
  await withBlocker(page, { oldPrefix: true });
  await page.goto("/primitives");
  await expect(page.getByRole("button", { name: "Add item" })).toBeHidden();
});

for (const path of ["/", "/primitives", "/patterns", "/editor", "/chrome"]) {
  test(`on ${path} the filter list hides no element with an agd- class`, async ({ page }) => {
    await withBlocker(page);
    await page.goto(path);
    await expect(page.locator("main, #root").first()).toBeVisible();
    // Skip link, closed parts, and hidden text are hidden on purpose: compare with the same page without a blocker.
    const hidden = () =>
      page.evaluate(() =>
        [...document.querySelectorAll('[class*="agd-"]')]
          .filter((el) => getComputedStyle(el).display === "none")
          .map((el) => el.className),
      );
    const withList = await hidden();
    const plain = await page.context().newPage();
    await plain.goto(path);
    await expect(plain.locator("main, #root").first()).toBeVisible();
    const without = await plain.evaluate(() =>
      [...document.querySelectorAll('[class*="agd-"]')].filter((el) => getComputedStyle(el).display === "none").map((el) => el.className),
    );
    expect(withList).toEqual(without);
  });
}
