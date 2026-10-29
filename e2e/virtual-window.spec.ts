import { expect, test } from "@playwright/test";
import { scrollToRow, windowRange, windowRangeAt } from "../src/components/virtual-window.js";

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
  expect(scrollToRow(80, 120, 0, 400, 40)).toBe(0);
  expect(scrollToRow(800, 840, 0, 400, 40)).toBe(480);
  expect(scrollToRow(40, 80, 480, 400, 40)).toBe(40);
  expect(scrollToRow(360, 400, 0, 400, 40, 64)).toBe(104);
});

test("windowRangeAt matches windowRange when there are no gaps, and skips gaps", () => {
  const tops = Array.from({ length: 100 }, (_, i) => i * 40);
  for (const scroll of [0, 35, 400, 3599]) {
    expect(windowRangeAt(tops, scroll, 400, 40, 2)).toEqual(windowRange(scroll, 400, 40, 100, 2));
  }
  expect(windowRangeAt([], 0, 400, 40)).toEqual({ start: 0, end: 0 });
  // A group label above rows 2 and 4 pushes them down by 40 each.
  const gapped = [0, 40, 120, 160, 240, 280];
  expect(windowRangeAt(gapped, 100, 100, 40, 0)).toEqual({ start: 2, end: 4 });
  expect(windowRangeAt(gapped, 0, 100000, 40, 0)).toEqual({ start: 0, end: 6 });
  expect(windowRangeAt(gapped, Number.NaN, Number.NaN, 40, 0)).toEqual({ start: 0, end: 0 });
});
