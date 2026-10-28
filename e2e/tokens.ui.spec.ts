import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

async function violations(page: Page) {
  return (await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()).violations.map((v) => ({
    id: v.id,
    nodes: v.nodes.map((n) => n.target),
  }));
}

for (const scheme of ["light", "dark"] as const) {
  test(`token page has no axe violations in ${scheme}`, async ({ page }, testInfo) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto("/");
    await page.screenshot({ path: testInfo.outputPath(`tokens-${scheme}.png`), fullPage: true });
    await page.locator("summary").click();
    expect(await violations(page)).toEqual([]);
  });
}

test("axe reports a violation when one exists", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    document.body.insertAdjacentHTML("beforeend", '<button></button><img src="data:,">');
  });
  const ids = (await violations(page)).map((v) => v.id);
  expect(ids).toEqual(expect.arrayContaining(["button-name", "image-alt"]));
});

test("the page follows the OS until a person picks a theme", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");
  await expect(page.locator("html")).not.toHaveAttribute("data-theme", /.*/);
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe("rgb(20, 19, 17)");

  await page.getByLabel("Theme").selectOption("light");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe("rgb(250, 249, 247)");

  await page.reload();
  await expect(page.getByLabel("Theme")).toHaveValue("light");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});

test("the theme select works with the keyboard alone", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Theme")).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});

test("the focus ring is visible", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const ring = await page.getByRole("link", { name: "Skip to content" }).evaluate((el) => {
    const s = getComputedStyle(el);
    return { width: s.outlineWidth, style: s.outlineStyle };
  });
  expect(ring).toEqual({ width: "2px", style: "solid" });
});

test("every request stays on this origin and the fonts load", async ({ page }) => {
  const hosts = new Set<string>();
  page.on("request", (r) => hosts.add(new URL(r.url()).host));
  await page.goto("/");
  const fonts = await page.evaluate(async () => {
    await document.fonts.ready;
    return [...document.fonts].filter((f) => f.status === "loaded").map((f) => f.family);
  });
  expect([...hosts]).toEqual(["127.0.0.1:8788"]);
  expect(fonts.length).toBeGreaterThan(0);
  expect(fonts.every((f) => /Inter Variable|JetBrains Mono Variable/.test(f))).toBe(true);
});

test("reduced motion zeroes the motion tokens", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const base = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--ad-duration-base").trim());
  expect(base).toBe("0.01ms");
});

test("the Worker serves the tokens over HTTP", async ({ request }) => {
  const res = await request.get("/api/v1/tokens");
  expect(res.status()).toBe(200);
  expect(Object.keys((await res.json()).themes)).toEqual(["light", "dark"]);
  expect((await request.get("/nope")).status()).toBe(404);
});
