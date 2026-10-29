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

const hexToRgb = (hex: string) => {
  const v = parseInt(hex.slice(1), 16);
  return `rgb(${v >> 16}, ${(v >> 8) & 255}, ${v & 255})`;
};

for (const scheme of ["light", "dark"] as const) {
  test(`the focus ring is a 2px solid line in the focus color in ${scheme}`, async ({ page, request }) => {
    const { themes } = await (await request.get("/api/v1/tokens")).json();
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto("/");
    await page.keyboard.press("Tab");
    const ring = await page.getByRole("link", { name: "Skip to content" }).evaluate((el) => {
      const s = getComputedStyle(el);
      return { width: s.outlineWidth, style: s.outlineStyle, color: s.outlineColor };
    });
    expect(ring).toEqual({ width: "2px", style: "solid", color: hexToRgb(themes[scheme].focus) });
  });
}

test("a dark pick on a light system shows the dark theme with no axe violations", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  await page.getByLabel("Theme").selectOption("dark");
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe("rgb(20, 19, 17)");
  await page.locator("summary").click();
  expect(await violations(page)).toEqual([]);
});

test("a saved dark pick is applied before the app loads, so there is no light flash", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.addInitScript(() => localStorage.setItem("agentic-design-theme", "dark"));
  await page.route("**/main.js", (route) => route.abort());
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe("rgb(20, 19, 17)");
});

test("a pick in one tab reaches another tab of the same app", async ({ context }) => {
  const first = await context.newPage();
  const second = await context.newPage();
  await first.goto("/");
  await second.goto("/");
  await first.getByLabel("Theme").selectOption("dark");
  await expect(second.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(second.getByLabel("Theme")).toHaveValue("dark");
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

test("reduced motion zeroes the motion tokens, everywhere, and only when asked", async ({ page }) => {
  const duration = () =>
    page.evaluate(() => {
      document.body.insertAdjacentHTML("beforeend", '<div id="region" data-theme="light"></div>');
      const read = (el: Element) => getComputedStyle(el).getPropertyValue("--ad-duration-base").trim();
      return { root: read(document.documentElement), region: read(document.getElementById("region") as Element) };
    });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  expect(await duration()).toEqual({ root: "160ms", region: "160ms" });
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(await duration()).toEqual({ root: "0.01ms", region: "0.01ms" });
});

test("the Worker serves the tokens over HTTP", async ({ request }) => {
  const res = await request.get("/api/v1/tokens");
  expect(res.status()).toBe(200);
  expect(Object.keys((await res.json()).themes)).toEqual(["light", "dark"]);
  expect((await request.get("/nope")).status()).toBe(404);
});
