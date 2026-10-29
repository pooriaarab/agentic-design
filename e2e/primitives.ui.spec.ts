import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
const violations = async (page: Page) =>
  (await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()).violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) }));

for (const scheme of ["light", "dark"] as const) {
  test(`primitives have no axe violations in ${scheme}`, async ({ page }, testInfo) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto("/primitives");
    await page.locator("form").getByRole("button", { name: "Save" }).click();
    await expect(page.getByRole("alert")).toBeVisible();
    await page.getByLabel("Email").focus();
    await page.screenshot({ path: testInfo.outputPath(`primitives-${scheme}.png`), fullPage: true });
    expect(await violations(page)).toEqual([]);
  });
}

test("every control is found by its label", async ({ page }) => {
  await page.goto("/primitives");
  for (const label of [/^Name/, /^Email$/, /^Notes$/, /^Role$/, /^Locked field$/]) {
    await expect(page.getByLabel(label)).toBeVisible();
  }
  await expect(page.getByRole("checkbox", { name: "Notify me about replies" })).toBeChecked();
  await expect(page.getByRole("switch", { name: "Allow agents to suggest edits" })).not.toBeChecked();
  await expect(page.getByRole("button", { name: "Add item" })).toBeVisible();
});

test("the checkbox and switch toggle with Space", async ({ page }) => {
  await page.goto("/primitives");
  const checkbox = page.getByRole("checkbox", { name: "Notify me about replies" });
  await checkbox.focus();
  await page.keyboard.press("Space");
  await expect(checkbox).not.toBeChecked();
  const sw = page.getByRole("switch", { name: "Allow agents to suggest edits" });
  await sw.focus();
  await page.keyboard.press("Space");
  await expect(sw).toBeChecked();
});

test("an error names the field, is announced, and clears when fixed", async ({ page }) => {
  await page.goto("/primitives");
  const name = page.getByLabel(/^Name/);
  const save = page.locator("form").getByRole("button", { name: "Save" });
  await expect(name).not.toHaveAttribute("aria-invalid", "true");
  await save.click();
  await expect(name).toHaveAttribute("aria-invalid", "true");
  await expect(name).toHaveAccessibleDescription(/Shown to people you share with\..*Enter a name/);
  await expect(page.getByRole("alert")).toContainText("Enter a name so people know who you are.");
  await name.fill("Ada");
  await expect(name).not.toHaveAttribute("aria-invalid", "true");
  await save.click();
  await expect(page.getByRole("status").filter({ hasText: "Saved." })).toHaveText("Saved.");
});

test("a loading button says it is loading in its name, not only in an attribute", async ({ page }) => {
  await page.goto("/primitives");
  const saving = page.getByRole("button", { name: /^Saving/ });
  await expect(saving).toHaveAttribute("aria-busy", "true");
  await expect(saving).toHaveAccessibleName(/^Saving\s*,\s*loading$/);
  await expect(page.getByRole("button", { name: "Count a click" })).toHaveAccessibleName("Count a click");
});

test("a field given an empty id still has its label tied to it", async ({ page }) => {
  await page.goto("/primitives");
  const input = page.getByLabel("Nickname");
  await expect(input).toBeVisible();
  expect(await input.evaluate((el) => el.id)).not.toBe("");
});

test("a loading button ignores clicks and stays focusable, while a normal one counts them", async ({ page }) => {
  await page.goto("/primitives");
  const saving = page.getByRole("button", { name: /^Saving/ });
  await expect(saving).toHaveAttribute("aria-busy", "true");
  await saving.click({ force: true });
  await saving.focus();
  await expect(saving).toBeFocused();
  await page.getByRole("button", { name: "Count a click" }).click();
  await expect(page.getByText("Clicks while loading: 0. Clicks on the normal button: 1.")).toBeVisible();
});

test("Tab skips a disabled button and reaches the rest", async ({ page }) => {
  await page.goto("/primitives");
  const stops: string[] = [];
  for (let i = 0; i < 40; i++) {
    await page.keyboard.press("Tab");
    stops.push(await page.evaluate(() => document.activeElement?.getAttribute("aria-label") ?? document.activeElement?.textContent ?? ""));
  }
  expect(stops.some((stop) => stop.startsWith("Saving"))).toBe(true);
  expect(stops).toContain("Add item");
  expect(stops).not.toContain("Disabled");
});

test("every control has a focus ring", async ({ page }) => {
  await page.goto("/primitives");
  for (const target of [page.getByLabel(/^Name/), page.getByRole("button", { name: "Cancel" }), page.getByRole("checkbox"), page.getByRole("switch")]) {
    await target.focus();
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Tab");
    expect(await target.evaluate((el) => getComputedStyle(el).outlineStyle)).toBe("solid");
  }
});

test("a caller's aria-describedby joins the generated one and does not replace it", async ({ page }) => {
  await page.goto("/primitives");
  await page.locator("form").getByRole("button", { name: "Save" }).click();
  const description = await page.getByLabel(/^Name/).evaluate((el) => el.getAttribute("aria-describedby"));
  expect(description?.split(" ")).toHaveLength(3);
  await expect(page.getByLabel(/^Name/)).toHaveAccessibleDescription(/Shown to people you share with\..*Enter a name.*Use the name on your badge\./);
});

test("a caller's aria-invalid is kept when the field has no error of its own", async ({ page }) => {
  await page.goto("/primitives");
  await expect(page.getByLabel("Phone")).toHaveAttribute("aria-invalid", "true");
  // The reason is text on the page and in the description, and the line is thicker than a valid field's.
  await expect(page.getByLabel("Phone")).toHaveAccessibleDescription("Enter a phone number with its country code.");
  const ring = (label: string) => page.getByLabel(label).evaluate((el) => getComputedStyle(el).boxShadow);
  expect(await ring("Phone")).not.toBe("none");
  expect(await ring("Email")).toBe("none");
  await expect(page.getByLabel("Email")).not.toHaveAttribute("aria-invalid", /.*/);
});

test("checked, selected, and busy states stay visible in forced colors", async ({ page }) => {
  await page.emulateMedia({ forcedColors: "active" });
  await page.goto("/primitives");
  const fill = (loc: Locator) => loc.evaluate((el) => getComputedStyle(el).backgroundColor);
  const checked = page.getByRole("checkbox", { name: "Notify me about replies" });
  const sw = page.getByRole("switch", { name: "Allow agents to suggest edits" });
  const checkedFill = await fill(checked);
  await checked.uncheck();
  await expect.poll(() => fill(checked)).not.toBe(checkedFill);
  const offFill = await fill(sw);
  await sw.check();
  await expect.poll(() => fill(sw)).not.toBe(offFill);
  // A loading button gets a dashed line, so it differs from an idle one without color.
  const saving = page.getByRole("button", { name: /^Saving/ });
  expect(await saving.evaluate((el) => getComputedStyle(el).borderTopStyle)).toBe("dashed");
  expect(await page.getByRole("button", { name: "Count a click" }).evaluate((el) => getComputedStyle(el).borderTopStyle)).toBe("solid");
});

test("targets are at least 24 by 24 CSS pixels", async ({ page }) => {
  await page.goto("/primitives");
  const small: string[] = [];
  // Checkbox and switch boxes are under 24px. Their label row is the target, so the row is measured.
  for (const el of await page.locator("button, input:not([type=checkbox]):not([role=switch]), select, textarea, summary, a, .agd-toggle__row").all()) {
    const box = await el.boundingBox();
    if (box && (box.width < 24 || box.height < 24)) small.push(await el.evaluate((n) => n.outerHTML.slice(0, 60)));
  }
  expect(small).toEqual([]);
});

for (const dir of ["ltr", "rtl"] as const) {
  test(`the switch thumb moves to the end side and stays inside the track in ${dir}`, async ({ page }) => {
    await page.goto("/primitives");
    await page.evaluate((d) => (document.documentElement.dir = d), dir);
    const sw = page.getByRole("switch", { name: "Allow agents to suggest edits" });
    const left = () => sw.evaluate((el) => parseFloat(getComputedStyle(el, "::before").left));
    const trackWidth = (await sw.boundingBox())?.width ?? 0;
    await sw.uncheck();
    await expect.poll(left).toBeGreaterThanOrEqual(0);
    const off = await left();
    await sw.check();
    await expect.poll(async () => (dir === "ltr" ? (await left()) > off : (await left()) < off)).toBe(true);
    await expect.poll(async () => (await left()) >= 0 && (await left()) <= trackWidth).toBe(true);
  });
}
