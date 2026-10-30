import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("a synchronous rename does not announce a pending save", async ({ page }) => {
  await page.goto("/chrome");
  const title = page.locator("#demo-title");
  await title.getByRole("button", { name: "Launch plan, rename" }).click();
  const field = title.getByRole("textbox", { name: "Document title" });
  await field.fill("New title");
  await title.evaluate((element) => {
    const observer = new MutationObserver(() => {
      if (element.textContent?.includes("Saving title…")) element.setAttribute("data-saw-saving", "yes");
    });
    observer.observe(element, { childList: true, subtree: true, characterData: true });
  });
  await field.press("Enter");
  await expect(title.getByRole("button", { name: "New title, rename" })).toBeVisible();
  await expect(title).not.toHaveAttribute("data-saw-saving", "yes");
});

for (const scheme of ["light", "dark"] as const) {
  test(`item header supports async rename and passes axe in ${scheme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto("/chrome");
    await expect(page.getByRole("heading", { name: "Project notes", level: 3 })).toBeVisible();
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
