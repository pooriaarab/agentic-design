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
  await expect(page.locator(".ad-cursor--agent")).toContainText("Claude · Agent · for Ada Lovelace");
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
  // The card held focus and is gone, so focus must land in the text and not on the page body.
  await expect(page.getByRole("textbox", { name: "Page text" })).toBeFocused();
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
  await expect(agent.getByLabel("Access for @review-bot", { exact: true })).toHaveValue("commenter");
  await expect(page.locator(".ad-stack__summary")).toHaveText("3 people, 2 agents");
});

test("roles change, and access is removed with its own button that keeps focus on the page", async ({ page }) => {
  await page.goto("/editor");
  await openShare(page);
  const people = page.getByRole("list", { name: "People and agents with access" });
  await expect(people.getByRole("listitem").first()).toContainText("Owner");
  await expect(people.getByLabel("Access for Ada Lovelace", { exact: true })).toHaveCount(0);
  const grace = people.getByLabel("Access for Grace Hopper", { exact: true });
  await grace.selectOption("viewer");
  await expect(grace).toHaveValue("viewer");
  // Stepping through the options never removes anyone. Removal is a button.
  await expect(grace.locator("option")).toHaveText(["Can edit", "Can comment", "Can view"]);
  await people.getByRole("button", { name: "Remove access for Grace Hopper" }).click();
  await expect(people.getByRole("listitem")).toHaveCount(2);
  await expect(people).not.toContainText("Grace Hopper");
  await expect(page.getByLabel("Invite a person or an agent")).toBeFocused();
});

test("an agent can be invited to comment or view, never to edit", async ({ page }) => {
  await page.goto("/editor");
  await openShare(page);
  const role = page.getByLabel("Role", { exact: true });
  await expect(role.locator("option")).toHaveText(["Can edit", "Can comment", "Can view"]);
  await page.getByLabel("Invite a person or an agent").fill("@review-bot");
  await expect(role.locator("option")).toHaveText(["Can comment", "Can view"]);
  await page.getByRole("button", { name: "Invite", exact: true }).click();
  await expect(page.getByLabel("Access for @review-bot", { exact: true }).locator("option")).toHaveText(["Can comment", "Can view"]);
  await expect(page.getByLabel("Access for Claude", { exact: true }).locator("option")).toHaveText(["Can comment", "Can view"]);
});

test("a long address is shown shortened and not as unnamed", async ({ page }) => {
  await page.goto("/editor");
  await openShare(page);
  await page.getByLabel("Invite a person or an agent").fill("margaret.hamilton.engineering@example-company.org");
  await page.getByRole("button", { name: "Invite", exact: true }).click();
  const people = page.getByRole("list", { name: "People and agents with access" });
  await expect(people).toContainText("margaret.hamilton.engineering@example…");
  await expect(people).not.toContainText("Unnamed");
});

test("the first invite is announced: the status line was in the page before it had text", async ({ page }) => {
  await page.goto("/editor");
  await openShare(page);
  const status = dialog(page).getByRole("status");
  await expect(status).toHaveCount(1);
  await expect(status).toHaveText("");
  await page.getByLabel("Invite a person or an agent").fill("linus@example.org");
  await page.getByRole("button", { name: "Invite", exact: true }).click();
  await expect(status).toHaveText("Invited linus@example.org as viewer.");
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

});

test("Copy link copies the link and says so", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/editor");
  await openShare(page);
  await page.getByRole("tab", { name: "Link" }).click();
  await page.getByRole("switch", { name: "Anyone with the link" }).check();
  const url = await page.getByRole("textbox", { name: "Link", exact: true }).inputValue();
  await page.getByRole("button", { name: "Copy link" }).click();
  await expect(page.locator(".ad-toast", { hasText: "Link copied" })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(url);
});

test("when the copy fails, the page says it failed and never says Link copied", async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, "clipboard", { value: { writeText: () => Promise.reject(new Error("denied")) } }));
  await page.goto("/editor");
  await openShare(page);
  await page.getByRole("tab", { name: "Link" }).click();
  await page.getByRole("switch", { name: "Anyone with the link" }).check();
  await page.getByRole("button", { name: "Copy link" }).click();
  await expect(page.locator(".ad-toast", { hasText: "We couldn't copy the link" })).toBeVisible();
  await expect(page.locator(".ad-toast", { hasText: "Link copied" })).toHaveCount(0);
});

async function makeSnapshotUrl(page: Page): Promise<string> {
  await page.goto("/editor");
  await openShare(page);
  await page.getByRole("tab", { name: "Snapshot" }).click();
  await expect(page.getByLabel("Snapshot link")).toHaveCount(0);
  await page.getByRole("button", { name: "Create snapshot link" }).click();
  return page.getByLabel("Snapshot link").inputValue();
}

test("a snapshot link carries the page text and no cursor names", async ({ page }) => {
  const url = await makeSnapshotUrl(page);
  expect(url).toMatch(/\/editor#snapshot=[A-Za-z0-9_-]+$/);
  const json = JSON.parse(Buffer.from(url.split("#snapshot=")[1].replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"));
  expect(json.v).toBe(1);
  expect(json.text).toContain("We ship the beta on 12 November.");
  expect(json.text).toContain("practice the new flow before launch day.");
  expect(json.text).not.toContain("Grace Hopper");
  expect(json.text).not.toContain("Agent");
  await expect(page.getByText("Anyone who has this link can read this copy.")).toBeVisible();
});

test("opening a snapshot link shows a read-only copy and sends the page to no server", async ({ page, context }) => {
  const url = await makeSnapshotUrl(page);
  const payload = url.split("#snapshot=")[1];
  const reader = await context.newPage();
  const sent: string[] = [];
  reader.on("request", (r) => sent.push(`${r.url()} ${r.postData() ?? ""}`));
  await reader.goto(url);
  const copy = reader.getByRole("article", { name: "Snapshot of Launch plan" });
  await expect(copy).toContainText("We ship the beta on 12 November.");
  await expect(reader.getByRole("textbox")).toHaveCount(0);
  await expect(reader.getByText("It was not read from a server")).toBeVisible();
  expect(sent.some((r) => r.includes(payload))).toBe(false);
  // Control: the check does see a request that carries the payload.
  await reader.evaluate((p) => fetch(`/health?x=${p}`), payload);
  expect(sent.some((r) => r.includes(payload))).toBe(true);
});

for (const [why, hash] of [
  ["is not base64", "#snapshot=%%%"],
  ["is not JSON", `#snapshot=${Buffer.from("hello").toString("base64url")}`],
  ["has the wrong version", `#snapshot=${Buffer.from(JSON.stringify({ v: 2, text: "x" })).toString("base64url")}`],
  ["has no text", `#snapshot=${Buffer.from(JSON.stringify({ v: 1 })).toString("base64url")}`],
  ["holds a hidden direction character", `#snapshot=${Buffer.from(JSON.stringify({ v: 1, text: "Ada\u202Eevil" })).toString("base64url")}`],
  ["is longer than the page will read, though every paragraph is short", `#snapshot=${Buffer.from(JSON.stringify({ v: 1, text: Array(6).fill("a".repeat(4_500)).join("\n\n") })).toString("base64url")}`],
]) {
  test(`a snapshot link that ${why} opens nothing`, async ({ page }) => {
    await page.goto("/editor");
    const reader = await page.context().newPage();
    await reader.goto(`/editor${hash}`);
    await expect(reader.getByRole("alert")).toHaveText("This snapshot link is not valid, so nothing was opened.");
    await expect(reader.getByRole("article")).toHaveCount(0);
  });
}

test("targets in the open share dialog are at least 24 by 24 CSS pixels", async ({ page }) => {
  await page.goto("/editor");
  await openShare(page);
  for (const tab of ["People and agents", "Link", "Snapshot"]) {
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

test("inviting the same address twice is refused, with a way to fix it", async ({ page }) => {
  await page.goto("/editor");
  await openShare(page);
  const field = page.getByLabel("Invite a person or an agent");
  await field.fill("linus@example.org");
  await page.getByRole("button", { name: "Invite", exact: true }).click();
  await field.fill("Linus@Example.org");
  await page.getByRole("button", { name: "Invite", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Linus@Example.org already has access. Change their role in the list below.");
  await expect(page.getByRole("list", { name: "People and agents with access" }).getByRole("listitem")).toHaveCount(4);
});

test("changing another link setting keeps the expiry date it had", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-10-28T12:00:00Z") });
  await page.goto("/editor");
  await openShare(page);
  await page.getByRole("tab", { name: "Link" }).click();
  await page.getByRole("switch", { name: "Anyone with the link" }).check();
  await page.getByLabel("Link expires").selectOption("1d");
  await expect(page.getByText("Stops working on Oct 29, 2026.")).toBeVisible();
  await page.getByLabel("Require sign-in").uncheck();
  await page.getByLabel("Access", { exact: true }).selectOption("commenter");
  await expect(page.getByText("Stops working on Oct 29, 2026.")).toBeVisible();
  // Two days pass. The link has expired, and the dialog says so and never shows it as live.
  await page.clock.fastForward("48:00:00");
  await page.getByLabel("Link expires").selectOption("never");
  await page.getByLabel("Link expires").selectOption("1d");
  await page.clock.fastForward("48:00:00");
  await page.getByLabel("Require sign-in").check();
  await expect(page.getByText("This link expired on Oct 31, 2026. Choose a new expiry.")).toBeVisible();
  await page.getByLabel("Link expires").selectOption("7d");
  await expect(page.getByText("Stops working on Nov 8, 2026.")).toBeVisible();
});

test("a snapshot carries the text as edited, and no cursor names", async ({ page }) => {
  await page.goto("/editor");
  const text = page.getByRole("textbox", { name: "Page text" });
  await text.locator("p").last().click();
  await page.keyboard.press("End");
  await page.keyboard.type(" Edited by hand.");
  await openShare(page);
  await page.getByRole("tab", { name: "Snapshot" }).click();
  await page.getByRole("button", { name: "Create snapshot link" }).click();
  const url = await page.getByLabel("Snapshot link").inputValue();
  const json = JSON.parse(Buffer.from(url.split("#snapshot=")[1].replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"));
  expect(json.text).toContain("Measure sign-ups for two weeks. Edited by hand.");
  expect(json.text).not.toContain("Grace Hopper");
});

test("turning the link on starts a new expiry clock", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-10-28T12:00:00Z") });
  await page.goto("/editor");
  await page.clock.fastForward(8 * 24 * 3600 * 1000);
  await openShare(page);
  await page.getByRole("tab", { name: "Link" }).click();
  await page.getByRole("switch", { name: "Anyone with the link" }).check();
  await expect(page.getByText("Stops working on Nov 12, 2026.")).toBeVisible();
  await expect(page.getByText(/expired on/)).toHaveCount(0);
});

test("inviting an agent that is already in the list is refused", async ({ page }) => {
  await page.goto("/editor");
  await openShare(page);
  await page.getByLabel("Invite a person or an agent").fill("@claude");
  await page.getByRole("button", { name: "Invite", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("@claude already has access. Change their role in the list below.");
  await expect(page.locator(".ad-stack__summary")).toHaveText("2 people, 1 agent");
});

test("accepting a suggestion after the paragraph was edited changes nothing", async ({ page }) => {
  await page.goto("/editor");
  const text = page.getByRole("textbox", { name: "Page text" });
  await text.locator("p").last().click();
  await page.keyboard.press("End");
  await page.keyboard.type(" Edited by hand.");
  await page.getByRole("complementary", { name: "Suggestion from Claude" }).getByRole("button", { name: "Accept" }).click();
  await expect(page.locator(".ad-toast", { hasText: "We didn't apply the suggestion" })).toBeVisible();
  await expect(text).toContainText("Measure sign-ups for two weeks. Edited by hand.");
  await expect(page.getByRole("complementary", { name: "Suggestion from Claude" })).toBeVisible();
});

test("a paragraph the reader would refuse makes no snapshot link, and the page says why", async ({ page }) => {
  await page.goto("/editor");
  const text = page.getByRole("textbox", { name: "Page text" });
  await text.locator("p").last().click();
  await page.keyboard.press("End");
  await page.keyboard.insertText(" " + "word ".repeat(1200));
  await openShare(page);
  await page.getByRole("tab", { name: "Snapshot" }).click();
  await page.getByRole("button", { name: "Create snapshot link" }).click();
  await expect(page.locator(".ad-toast", { hasText: "text a snapshot link can't carry" })).toBeVisible();
  await expect(page.getByLabel("Snapshot link")).toHaveCount(0);
});

test("an expired link is not offered, so it cannot be copied", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-10-28T12:00:00Z") });
  await page.goto("/editor");
  await openShare(page);
  await page.getByRole("tab", { name: "Link" }).click();
  await page.getByRole("switch", { name: "Anyone with the link" }).check();
  await page.getByLabel("Link expires").selectOption("1d");
  await expect(page.getByRole("textbox", { name: "Link", exact: true })).toBeVisible();
  await page.clock.fastForward("48:00:00");
  await page.getByLabel("Require sign-in").uncheck();
  await expect(page.getByRole("alert").filter({ hasText: "This link expired on" })).toBeVisible();
  await expect(page.getByLabel("Link expires")).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByRole("textbox", { name: "Link", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Copy link" })).toHaveCount(0);
});

test("a link that anyone can edit without signing in says that agents can too", async ({ page }) => {
  await page.goto("/editor");
  await openShare(page);
  await page.getByRole("tab", { name: "Link" }).click();
  await page.getByRole("switch", { name: "Anyone with the link" }).check();
  await page.getByLabel("Access", { exact: true }).selectOption("editor");
  await expect(page.getByText("Anyone who signs in with the link can edit. That includes agents.")).toBeVisible();
  await page.getByLabel("Require sign-in").uncheck();
  await expect(page.getByText("Anyone with the link can edit without signing in. That includes agents.")).toBeVisible();
});

test("a blank paragraph does not stop a snapshot, and a page over the limit says it is too long", async ({ page }) => {
  await page.goto("/editor");
  const text = page.getByRole("textbox", { name: "Page text" });
  await text.locator("p").last().click();
  await page.keyboard.press("End");
  await page.keyboard.press("Enter");
  await openShare(page);
  await page.getByRole("tab", { name: "Snapshot" }).click();
  await page.getByRole("button", { name: "Create snapshot link" }).click();
  await expect(page.getByLabel("Snapshot link")).toBeVisible();

  await page.keyboard.press("Escape");
  await text.evaluate((el) => {
    for (let i = 0; i < 6; i++) el.insertAdjacentHTML("beforeend", `<p>${"b".repeat(4_500)}</p>`);
  });
  await openShare(page);
  await page.getByRole("tab", { name: "Snapshot" }).click();
  await page.getByRole("button", { name: /snapshot link/ }).first().click();
  await expect(page.locator(".ad-toast", { hasText: "too long for a snapshot link" })).toBeVisible();
});
