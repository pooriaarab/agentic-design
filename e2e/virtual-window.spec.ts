import { expect, test } from "@playwright/test";
import { scrollToRow, windowRange } from "../src/components/virtual-window.js";

// Ways the window can fail: bad numbers, the ends of the list, an empty list.
test("windowRange stays inside the list", () => {
  expect(windowRange(0, 400, 40, 0)).toEqual({ start: 0, end: 0 });
  expect(windowRange(0, 400, 40, 3)).toEqual({ start: 0, end: 3 });
  expect(windowRange(400000, 400, 40, 10000, 0)).toEqual({ start: 10000, end: 10000 });
  expect(windowRange(-50, 400, 40, 100, 0)).toEqual({ start: 0, end: 10 });
  expect(windowRange(Number.NaN, Number.NaN, 40, 100)).toEqual({ start: 0, end: 6 });
  expect(windowRange(0, 400, 0, 100)).toEqual({ start: 0, end: 0 });
  expect(windowRange(1000, 400, 40, 10000, 2)).toEqual({ start: 23, end: 37 });
});

test("scrollToRow moves only when the row is hidden", () => {
  // 400px viewport, 40px header: 360px of body is visible.
  expect(scrollToRow(2, 0, 400, 40, 40)).toBe(0);
  expect(scrollToRow(20, 0, 400, 40, 40)).toBe(480);
  expect(scrollToRow(1, 480, 400, 40, 40)).toBe(40);
  expect(scrollToRow(9, 0, 400, 40, 40, 64)).toBe(104);
});
