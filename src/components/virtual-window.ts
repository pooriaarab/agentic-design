/** The rows of a fixed-height list to draw: start is inclusive, end is exclusive. */
export function windowRange(scrollTop: number, viewport: number, rowHeight: number, count: number, overscan = 6): { start: number; end: number } {
  if (!(rowHeight > 0) || count <= 0) return { start: 0, end: 0 };
  const top = Number.isFinite(scrollTop) ? Math.max(0, scrollTop) : 0;
  const height = Number.isFinite(viewport) ? Math.max(0, viewport) : 0;
  const first = Math.floor(top / rowHeight);
  const last = Math.ceil((top + height) / rowHeight);
  return { start: Math.min(count, Math.max(0, first - overscan)), end: Math.min(count, Math.max(0, last + overscan)) };
}

/**
 * Like `windowRange`, for rows that have gaps above them, for example a group label. `tops` holds the
 * top of each row in pixels, rising. Each row is `rowHeight` tall.
 */
export function windowRangeAt(tops: ArrayLike<number>, scrollTop: number, viewport: number, rowHeight: number, overscan = 6): { start: number; end: number } {
  const count = tops.length;
  if (!(rowHeight > 0) || count === 0) return { start: 0, end: 0 };
  const top = Number.isFinite(scrollTop) ? Math.max(0, scrollTop) : 0;
  const bottom = top + (Number.isFinite(viewport) ? Math.max(0, viewport) : 0);
  // The first row that ends below the top edge, and the first row that starts at or below the bottom edge.
  const search = (limit: number, edge: (i: number) => number) => {
    let lo = 0;
    let hi = count;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (edge(mid) > limit) hi = mid;
      else lo = mid + 1;
    }
    return lo;
  };
  const first = search(top, (i) => (tops[i] as number) + rowHeight);
  const last = search(bottom - 1, (i) => tops[i] as number);
  return { start: Math.min(count, Math.max(0, first - overscan)), end: Math.min(count, Math.max(0, last + overscan)) };
}

/**
 * The scrollTop that brings a block fully into view, or the current one when it already is. The block
 * runs from `top` to `bottom` in the body, which starts under the sticky header.
 */
export function scrollToRow(top: number, bottom: number, scrollTop: number, viewport: number, headerHeight: number, footerHeight = 0): number {
  // The sticky header covers the first headerHeight pixels, so the body shows from scrollTop to scrollTop + visible.
  const visible = viewport - headerHeight - footerHeight;
  if (top < scrollTop) return top;
  if (bottom > scrollTop + visible) return bottom - visible;
  return scrollTop;
}
