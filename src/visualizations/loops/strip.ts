import type { PyItem } from "@/types/python";
import { WINDOW_SIZE } from "../collectionWindow";
import { CHAR_W } from "../flow/geometry";
import { pyItem } from "../values";

/** Sizes shared by the strip and the layouts that place it. */
export const STRIP = {
  labelH: 26,
  top: 12,
  cellH: 44,
  indexH: 20,
  negH: 16,
  noteH: 18,
  more: 24,
} as const;

export type StripTone = "list" | "tuple" | "str" | "neutral";

/** Which optional rows a strip has; they change its height, so layouts ask first. */
export type StripRows = { label?: boolean; negative?: boolean; notes?: boolean };

/** Width of each cell: every cell the same, wide enough for the longest value. */
export function stripCellW(texts: string[]) {
  return Math.max(46, Math.min(12, Math.max(...texts.map((t) => t.length), 1)) * CHAR_W + 26);
}

export function stripText(items: PyItem[], strings: boolean) {
  return items.map((x) => (strings ? String(x) : pyItem(x)));
}

export const cellsTop = (rows: StripRows) => (rows.label ? STRIP.labelH : 0) + STRIP.top;

/** Size of a strip, for laying it out before drawing it. */
export function stripSize(items: PyItem[], strings: boolean, rows: StripRows = {}) {
  const cellW = stripCellW(stripText(items, strings));
  const visible = Math.max(1, Math.min(items.length, WINDOW_SIZE));
  return {
    cellW,
    w: visible * cellW + STRIP.more * 2,
    h: cellsTop(rows) + STRIP.cellH + STRIP.indexH + (rows.negative ? STRIP.negH : 0) + (rows.notes ? STRIP.noteH : 0),
  };
}

/** Where a cell's centre is, relative to the strip's top-left, given the current window start. */
export function stripCellCentre(index: number, start: number, cellW: number, rows: StripRows = {}) {
  return { x: STRIP.more + (index - start) * cellW + cellW / 2, y: cellsTop(rows) + STRIP.cellH / 2 };
}

/** Width of one character in a strip label (600 14px mono, a little wider than CHAR_W). */
export const LABEL_CHAR_W = 8.6;

/**
 * Shortens the iterable in a `for … in …` label so the whole label fits in `maxChars`.
 * A list or tuple literal keeps its first items and its last one, with "…" between
 * (`[1, 2, 3, …, 20]`); anything else is cut with a trailing "…". The full code is
 * always in the code panel next to the diagram.
 */
export function fitIterable(iterable: string, maxChars: number): string {
  if (iterable.length <= maxChars) return iterable;
  const literal = /^([[(])(.*)([\])])$/.exec(iterable);
  const parts = literal ? literal[2]!.split(", ") : [];
  // Only split simple literals (numbers, short words), where ", " can't occur inside an item.
  if (literal && parts.length > 2 && parts.every((x) => !/[[\](){}"']/.test(x))) {
    const open = literal[1]!;
    const close = literal[3]!;
    const last = parts.at(-1)!;
    for (let keep = parts.length - 2; keep >= 1; keep--) {
      const text = `${open}${parts.slice(0, keep).join(", ")}, …, ${last}${close}`;
      if (text.length <= maxChars) return text;
    }
    const shortest = `${open}${parts[0]}, …${close}`;
    if (shortest.length <= maxChars) return shortest;
  }
  return `${iterable.slice(0, Math.max(1, maxChars - 1))}…`;
}
