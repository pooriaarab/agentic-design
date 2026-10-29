import { expect, test } from "@playwright/test";
import { renderToString } from "react-dom/server";
import { createElement } from "react";
import { AppSidebar } from "../dist/react.js";

const render = (props: object) => renderToString(createElement(AppSidebar, { label: "Main", children: createElement("p", null, "Links"), ...props }));

test("the server renders open, and collapsed when asked", () => {
  expect(render({})).toContain('data-collapsed="false"');
  expect(render({})).toContain("Collapse sidebar");
  expect(render({ defaultCollapsed: true })).toContain('data-collapsed="true"');
});

test("controlled mode renders the prop and hides a plain child", () => {
  const html = render({ collapsed: true, onCollapsedChange: () => undefined });
  expect(html).toContain('data-collapsed="true"');
  expect(html).toContain("Expand sidebar");
  expect(html).toMatch(/class="agd-appsidebar__content"[^>]*hidden/);
});

test("a blank label is refused", () => {
  expect(() => render({ label: "  " })).toThrow("non-empty label");
});
