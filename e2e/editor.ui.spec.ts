import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
const violations = async (page: Page) =>
  (await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()).violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) }));

const dialog = (page: Page) => page.getByRole("dialog", { name: /^Share/ });
const openShare = async (page: Page) => {
  await page.getByRole("button", { name: "Share", exact: true }).click();
  await expect(dialog(page)).toBeVisible();
};

for (const scheme of ["light", "dark"] as const) {
  test(`the editor and every share tab have no axe violations in ${scheme}`, async ({ page }, testInfo) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto("/editor");
    await page.waitForTimeout(300);
    await page.screenshot({ path: testInfo.outputPath(`editor-${scheme}.png`) });
    expect(await violations(page)).toEqual([]);

    await openShare(page);
    await page.getByLabel("Invite a person or an agent").fill("@review-bot");
    await page.getByRole("button", { name: "Invite", exact: true }).click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: testInfo.outputPath(`share-people-${scheme}.png`) });
    expect(await violations(page)).toEqual([]);

    await page.getByRole("tab", { name: "Link" }).click();
    await page.getByRole("switch", { name: "Anyone with the link" }).check();
    await page.getByLabel("Link expires").selectOption("1d");
    await page.waitForTimeout(300);
    await page.screenshot({ path: testInfo.outputPath(`share-link-${scheme}.png`) });
    expect(await violations(page)).toEqual([]);

    await page.getByRole("tab", { name: "Snapshot" }).click();
    await page.getByRole("button", { name: "Create snapshot link" }).click();
    await expect(page.getByLabel("Snapshot link")).toBeVisible();
    expect(await violations(page)).toEqual([]);
  });
}

test("the page says an agent edited it, and an agent cursor carries the word Agent", async ({ page }) => {
  await page.goto("/editor");
  await expect(page.getByText("Last edited by Claude, an agent.")).toBeVisible();
  await expect(page.locator(".ad-cursor--agent")).toContainText("Claude · Agent");
  await expect(page.locator(".ad-cursor--person")).not.toContainText("Agent");
  await expect(page.locator(".ad-stack__summary")).toHaveText("2 people, 1 agent");
});

test("a person accepts an agent suggestion, and the edit stays labeled", async ({ page }) => {
  await page.goto("/editor");
  const card = page.getByRole("complementary", { name: "Suggestion from Claude" });
  await expect(card).toContainText("Agent");
  await expect(card).toContainText("Agents suggest. Only people accept or reject.");
  await card.getByRole("button", { name: "Accept" }).click();
  await expect(card).toBeHidden();
  await expect(page.getByRole("textbox", { name: "Page text" })).toContainText("report the result to the whole team");
  await expect(page.locator(".ad-toast", { hasText: "labeled as made by Claude, an agent" })).toBeVisible();
});

test("rejecting a suggestion keeps the text", async ({ page }) => {
  await page.goto("/editor");
  await page.getByRole("complementary", { name: "Suggestion from Claude" }).getByRole("button", { name: "Reject" }).click();
  await expect(page.getByRole("textbox", { name: "Page text" })).not.toContainText("report the result");
  await expect(page.getByRole("complementary", { name: "Suggestion from Claude" })).toBeHidden();
});

test("the share dialog traps focus and gives it back", async ({ page }) => {
  await page.goto("/editor");
  const trigger = page.getByRole("button", { name: "Share", exact: true });
  await trigger.focus();
  await page.keyboard.press("Enter");
  await expect(dialog(page)).toBeVisible();
  for (let i = 0; i < 14; i++) {
    await page.keyboard.press("Tab");
    expect(await page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]'))).toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(dialog(page)).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("an invite to a wrong target is refused with a fix, and the list does not change", async ({ page }) => {
  await page.goto("/editor");
  await openShare(page);
  const people = page.getByRole("list", { name: "People and agents with access" });
  await expect(people.getByRole("listitem")).toHaveCount(3);
  const field = page.getByLabel("Invite a person or an agent");
  await field.fill("ada");
  await page.getByRole("button", { name: "Invite", exact: true }).click();
  await expect(field).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByRole("alert")).toContainText("Enter an email like ada@example.org, or an agent handle like @claude.");
  await expect(people.getByRole("listitem")).toHaveCount(3);
});

test("an email invites a person and an @handle invites an agent that shows as an agent", async ({ page }) => {
  await page.goto("/editor");
  await openShare(page);
  const people = page.getByRole("list", { name: "People and agents with access" });
  const field = page.getByLabel("Invite a person or an agent");

  await field.fill("linus@example.org");
  await page.getByRole("button", { name: "Invite", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "Invited linus@example.org as view" })).toBeVisible();
  const person = people.getByRole("listitem").filter({ hasText: "linus@example.org" });
  await expect(person).not.toContainText("Agent");

  await page.getByLabel("Role", { exact: true }).selectOption("commenter");
  await field.fill("@review-bot");
  await page.getByRole("button", { name: "Invite", exact: true }).click();
  const agent = people.getByRole("listitem").filter({ hasText: "@review-bot" });
  await expect(agent).toContainText("Agent");
  await expect(agent).toContainText("for Ada Lovelace");
  await expect(agent.getByLabel("Access for @review-bot")).toHaveValue("commenter");
  await expect(page.locator(".ad-stack__summary")).toHaveText("3 people, 2 agents");
});

test("roles change and access is removed from the list", async ({ page }) => {
  await page.goto("/editor");
  await openShare(page);
  const people = page.getByRole("list", { name: "People and agents with access" });
  await expect(people.getByRole("listitem").first()).toContainText("Owner");
  await expect(people.getByLabel("Access for Ada Lovelace")).toHaveCount(0);
  const grace = people.getByLabel("Access for Grace Hopper");
  await grace.selectOption("viewer");
  await expect(grace).toHaveValue("viewer");
  await grace.selectOption("remove");
  await expect(people.getByRole("listitem")).toHaveCount(2);
  await expect(people).not.toContainText("Grace Hopper");
});

test("the link tab sets role, expiry, and sign-in, and shows when the link stops working", async ({ page }) => {
  await page.goto("/editor");
  await openShare(page);
  await page.getByRole("tab", { name: "Link" }).click();
  await expect(page.getByRole("textbox", { name: "Link", exact: true })).toHaveCount(0);
  await expect(page.getByText("Only people you invite can open this page.")).toBeVisible();

  await page.getByRole("switch", { name: "Anyone with the link" }).check();
  await expect(page.getByLabel("Require sign-in")).toBeChecked();
  await page.getByLabel("Access", { exact: true }).selectOption("commenter");
  await page.getByLabel("Link expires").selectOption("1d");
  await expect(page.getByText(/^Stops working on /)).toBeVisible();
  await page.getByLabel("Link expires").selectOption("never");
  await expect(page.getByText(/^Stops working on /)).toHaveCount(0);
  await expect(page.getByRole("textbox", { name: "Link", exact: true })).toHaveAttribute("readonly", "");

  await page.getByRole("button", { name: "Copy link" }).click();
  await expect(page.locator(".ad-toast", { hasText: "Link copied" })).toBeVisible();
});

test("a snapshot link holds the page in the fragment, so a server never sees it", async ({ page }) => {
  await page.goto("/editor");
  await openShare(page);
  await page.getByRole("tab", { name: "Snapshot" }).click();
  await expect(page.getByLabel("Snapshot link")).toHaveCount(0);
  await page.getByRole("button", { name: "Create snapshot link" }).click();
  const url = await page.getByLabel("Snapshot link").inputValue();
  expect(url).toMatch(/\/editor#snapshot=[A-Za-z0-9_-]+$/);
  const fragment = url.split("#snapshot=")[1];
  const json = JSON.parse(Buffer.from(fragment.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"));
  expect(json.v).toBe(1);
  expect(json.text).toContain("We ship the beta on 12 November.");
  await expect(page.getByText("Anyone who has this link can read this copy.")).toBeVisible();
  // The server must never receive the fragment.
  const requests: string[] = [];
  page.on("request", (r) => requests.push(r.url()));
  await page.goto(url);
  expect(requests.some((r) => r.includes("snapshot="))).toBe(false);
});

test("targets in the open share dialog are at least 24 by 24 CSS pixels", async ({ page }) => {
  await page.goto("/editor");
  await openShare(page);
  for (const tab of ["Link", "Snapshot"]) {
    await page.getByRole("tab", { name: tab }).click();
    if (tab === "Link") await page.getByRole("switch", { name: "Anyone with the link" }).check();
    const small: string[] = [];
    for (const el of await dialog(page).locator("button:visible, input:not([type=checkbox]):not([role=switch]), select, .ad-toggle__row, [role=tab]").all()) {
      const box = await el.boundingBox();
      if (box && (box.width < 24 || box.height < 24)) small.push(await el.evaluate((n) => n.outerHTML.slice(0, 70)));
    }
    expect(small).toEqual([]);
  }
});
