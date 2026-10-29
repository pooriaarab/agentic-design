/** The rows of a fixed-height list to draw: start is inclusive, end is exclusive. */
export function windowRange(scrollTop: number, viewport: number, rowHeight: number, count: number, overscan = 6): { start: number; end: number } {
  if (!(rowHeight > 0) || count <= 0) return { start: 0, end: 0 };
  const top = Number.isFinite(scrollTop) ? Math.max(0, scrollTop) : 0;
  const height = Number.isFinite(viewport) ? Math.max(0, viewport) : 0;
  const first = Math.floor(top / rowHeight);
  const last = Math.ceil((top + height) / rowHeight);
  return { start: Math.min(count, Math.max(0, first - overscan)), end: Math.min(count, Math.max(0, last + overscan)) };
}

/** The scrollTop that brings a row fully into view, or the current one when it already is. */
export function scrollToRow(index: number, scrollTop: number, viewport: number, rowHeight: number, headerHeight: number, footerHeight = 0): number {
  const top = index * rowHeight;
  const bottom = top + rowHeight;
  // The sticky header covers the first headerHeight pixels, so the body shows from scrollTop to scrollTop + visible.
  const visible = viewport - headerHeight - footerHeight;
  if (top < scrollTop) return top;
  if (bottom > scrollTop + visible) return bottom - visible;
  return scrollTop;
}
