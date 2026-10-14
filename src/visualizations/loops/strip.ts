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
