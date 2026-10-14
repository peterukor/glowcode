import type { CSSProperties, ReactNode } from "react";
import type { PyItem } from "@/types/python";
import { collectionWindow, WINDOW_SIZE, type WindowFocus } from "../collectionWindow";
import { CHAR_W } from "../flow/geometry";
import type { CellState } from "../SegmentedSequence";
import { pyItem } from "../values";

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

const cellsTop = (rows: StripRows) => (rows.label ? STRIP.labelH : 0) + STRIP.top;

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

/**
 * A list, tuple, string or produced sequence drawn in SVG as one long segmented container
 * with its indexes underneath (and, on request, the negative indexes and short notes such as
 * "was 14" or "start"). At most five cells are visible; the row slides (a transform
 * transition) so the focused cells stay in view, and "…" appears only on a side where items
 * are hidden. A picked item lifts out of its cell and glows; done items fade with a tick.
 */
export function SequenceStrip({
  id,
  items,
  strings = false,
  states,
  focus,
  label,
  tone = "list",
  showIndexes = true,
  negative = false,
  notes,
}: {
  /** Unique within the page, for the clip path. */
  id: string;
  items: PyItem[];
  strings?: boolean;
  states: Record<number, CellState>;
  focus?: WindowFocus;
  label?: ReactNode;
  tone?: StripTone;
  showIndexes?: boolean;
  negative?: boolean;
  notes?: Record<number, string>;
}) {
  const rows: StripRows = { label: !!label, negative, notes: !!notes };
  const texts = stripText(items, strings);
  const { cellW, w, h } = stripSize(items, strings, rows);
  const n = items.length;
  const win = collectionWindow(n, focus);
  const top = cellsTop(rows);
  const visibleW = Math.max(1, win.end - win.start) * cellW;
  const clipId = `strip-${id}`;
  const indexY = top + STRIP.cellH + STRIP.indexH / 2 + 3;
  const negY = indexY + STRIP.negH;
  const noteY = (negative ? negY : indexY) + STRIP.noteH;

  return (
    <g className="strip" data-tone={tone} style={{ "--strip-shift": `${-win.start * cellW}px` } as CSSProperties}>
      {label && (
        <text x={w / 2} y={STRIP.labelH / 2} className="strip-label">
          {label}
        </text>
      )}
      <clipPath id={clipId}>
        {/* Taller than the row, so a lifted cell isn't cut off; exact at the sides. */}
        <rect x={STRIP.more - 2} y={top - 18} width={visibleW + 4} height={h - top + 18} />
      </clipPath>
      <text x={STRIP.more / 2} y={top + STRIP.cellH / 2} className="strip-more" data-show={win.hiddenBefore || undefined} aria-hidden>
        …
      </text>
      <text x={STRIP.more + visibleW + STRIP.more / 2} y={top + STRIP.cellH / 2} className="strip-more" data-show={win.hiddenAfter || undefined} aria-hidden>
        …
      </text>
      <g clipPath={`url(#${clipId})`}>
        <g transform={`translate(${STRIP.more} 0)`}>
          <g className="strip-slide">
            {n === 0 ? (
              <>
                <rect x={1} y={top} width={cellW - 2} height={STRIP.cellH} rx={12} className="strip-box strip-empty" />
                <text x={cellW / 2} y={top + STRIP.cellH / 2 + 1} className="strip-index">
                  empty
                </text>
              </>
            ) : (
              <rect x={1} y={top} width={n * cellW - 2} height={STRIP.cellH} rx={12} className="strip-box" />
            )}
            {texts.map((_, i) =>
              i === 0 ? null : <line key={`d${i}`} x1={i * cellW} x2={i * cellW} y1={top + 8} y2={top + STRIP.cellH - 8} className="strip-divider" />,
            )}
            {texts.map((text, i) => {
              const state = states[i] ?? "idle";
              const visible = i >= win.start && i < win.end;
              const cx = i * cellW + cellW / 2;
              return (
                <g key={i} className="strip-cell" data-state={state} aria-hidden={!visible || undefined}>
                  <g className="strip-cell-lift">
                    <rect x={i * cellW + 4} y={top + 4} width={cellW - 8} height={STRIP.cellH - 8} rx={9} className="strip-cell-box" />
                    <text x={cx} y={top + STRIP.cellH / 2 + 1} className="strip-value">
                      {state === "pending" ? "?" : text}
                    </text>
                  </g>
                  {state === "visited" && (
                    <text x={i * cellW + cellW - 11} y={top + 11} className="strip-tick">
                      ✓
                    </text>
                  )}
                  {showIndexes && (
                    <text x={cx} y={indexY} className="strip-index">
                      {i}
                    </text>
                  )}
                  {negative && (
                    <text x={cx} y={negY} className="strip-index strip-index-neg">
                      {i - n}
                    </text>
                  )}
                  {notes?.[i] && (
                    <text x={cx} y={noteY} className="strip-note">
                      {notes[i]}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </g>
      </g>
    </g>
  );
}
