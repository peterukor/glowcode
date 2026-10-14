import { describe, expect, it } from "vitest";
import { collectionWindow, itemFocus } from "./collectionWindow";

describe("collectionWindow", () => {
  it("shows everything, with no ellipses, for 1 to 5 items", () => {
    expect(collectionWindow(1)).toEqual({ start: 0, end: 1, hiddenBefore: false, hiddenAfter: false });
    expect(collectionWindow(5, { lo: 4, hi: 4 })).toEqual({ start: 0, end: 5, hiddenBefore: false, hiddenAfter: false });
    expect(collectionWindow(0)).toEqual({ start: 0, end: 0, hiddenBefore: false, hiddenAfter: false });
  });

  it("with 6 items shows 5, and an ellipsis only on the hidden side", () => {
    expect(collectionWindow(6)).toEqual({ start: 0, end: 5, hiddenBefore: false, hiddenAfter: true });
    expect(collectionWindow(6, { lo: 5, hi: 5 })).toEqual({ start: 1, end: 6, hiddenBefore: true, hiddenAfter: false });
  });

  it("keeps the active item visible and centred in a long list, hiding both sides", () => {
    const w = collectionWindow(20, { lo: 10, hi: 10 });
    expect(w).toEqual({ start: 8, end: 13, hiddenBefore: true, hiddenAfter: true });
    for (let i = 0; i < 20; i++) {
      const win = collectionWindow(20, { lo: i, hi: i });
      expect(i >= win.start && i < win.end).toBe(true);
      expect(win.end - win.start).toBe(5);
    }
  });

  it("moves one cell at a time as a loop advances (no jumps)", () => {
    const starts = Array.from({ length: 9 }, (_, i) => collectionWindow(9, { lo: i, hi: i }).start);
    expect(starts).toEqual([0, 0, 0, 1, 2, 3, 4, 4, 4]);
  });

  it("fits a range focus such as a slice, and shows the start of one wider than the window", () => {
    expect(collectionWindow(10, { lo: 3, hi: 5 })).toMatchObject({ start: 2, end: 7 });
    expect(collectionWindow(10, { lo: 2, hi: 8 })).toMatchObject({ start: 2, end: 7 });
  });

  it("resolves negative indexes like Python", () => {
    expect(itemFocus(9, -1)).toEqual({ lo: 8, hi: 8 });
    expect(itemFocus(9, 2)).toEqual({ lo: 2, hi: 2 });
    expect(itemFocus(0, 0)).toBeUndefined();
  });
});
