/**
 * Which part of a long collection to show. Diagrams show at most `size` items (5 by default)
 * and slide along as the active item moves, instead of shrinking cells until they can't be
 * read. Pure and derived from the data, so authors never pick slices and Previous / Reset
 * always land on the same window.
 *
 * Rules:
 * - With `size` items or fewer, everything is shown and nothing is hidden.
 * - The focus (an item, or a range such as a slice) is always inside the window.
 * - The window is centred on the focus where possible and clamped at the ends, so as a loop
 *   advances one item at a time the window moves one cell at a time (no sudden jumps), and
 *   near the end it settles on the final items.
 * - `hiddenBefore` / `hiddenAfter` say whether to draw "..." on that side, and only then.
 * Real indexes never change: the window is presentation only.
 */
export type CollectionWindow = {
  /** First visible index. */
  start: number;
  /** One past the last visible index. */
  end: number;
  hiddenBefore: boolean;
  hiddenAfter: boolean;
};

export type WindowFocus = { lo: number; hi: number };

export const WINDOW_SIZE = 5;

export function collectionWindow(length: number, focus?: WindowFocus, size = WINDOW_SIZE): CollectionWindow {
  if (length <= size) return { start: 0, end: length, hiddenBefore: false, hiddenAfter: false };
  let start = 0;
  if (focus) {
    const lo = clamp(Math.min(focus.lo, focus.hi), 0, length - 1);
    const hi = clamp(Math.max(focus.lo, focus.hi), 0, length - 1);
    if (hi - lo + 1 >= size) {
      start = lo; // a focus wider than the window: show its beginning
    } else {
      const centre = (lo + hi) / 2;
      start = Math.round(centre - (size - 1) / 2);
    }
  }
  start = clamp(start, 0, length - size);
  return { start, end: start + size, hiddenBefore: start > 0, hiddenAfter: start + size < length };
}

/** A single item as a focus. Negative indexes count from the end, as in Python. */
export function itemFocus(length: number, index: number | undefined): WindowFocus | undefined {
  if (index === undefined || length === 0) return undefined;
  const i = index < 0 ? length + index : index;
  return { lo: i, hi: i };
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
