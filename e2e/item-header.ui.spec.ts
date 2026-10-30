import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

for (const scheme of ["light", "dark"] as const) {
  test(`item header supports async rename and passes axe in ${scheme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto("/chrome");
    const header = page.locator("#demo-item-header");
    const rename = header.getByRole("button", { name: "Project notes, rename" });
    await rename.focus();
    await page.keyboard.press("Enter");
    const field = header.getByRole("textbox", { name: "Item title" });
    await field.fill("   ");
    await field.press("Enter");
    await expect(header.getByRole("alert")).toHaveText("Enter a title.");
    await field.fill("Discard");
    await field.press("Escape");
    await expect(rename).toBeFocused();
    await rename.click();
    await field.fill("Fail");
    await field.press("Enter");
    await expect(field).toHaveAttribute("aria-busy", "true");
    await expect(header.getByRole("status")).toHaveText("Saving title…");
    await expect(header.getByRole("alert")).toContainText("Could not save");
    expect((await new AxeBuilder({ page }).include("#demo-item-header").withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze()).violations).toEqual([]);
    await field.fill("Saved notes");
    await field.press("Enter");
    await expect(header.getByRole("button", { name: "Saved notes, rename" })).toBeFocused();
    await header.getByRole("button", { name: "Saved notes, rename" }).click();
    await field.fill("Blur saved");
    await header.getByRole("button", { name: "Share item" }).focus();
    await expect(header.getByRole("button", { name: "Blur saved, rename" })).toBeVisible();
    await expect(header.getByRole("button", { name: "Share item" })).toBeFocused();
    expect((await new AxeBuilder({ page }).include("#demo-item-header").withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze()).violations).toEqual([]);
    await page.setViewportSize({ width: 320, height: 720 });
    expect(await header.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
  });
}
