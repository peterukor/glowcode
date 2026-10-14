import type { CSSProperties, ReactNode } from "react";
import type { PyItem } from "@/types/python";
import { collectionWindow, type WindowFocus } from "./collectionWindow";
import { pyItem } from "./values";

/**
 * What a cell is doing in the current event.
 * - active: the item being used (indexed, compared...)
 * - raised: popped out of its cell and glowing (a for-loop picking its next item)
 * - visited: already handled by a loop (dimmed, ✓)
 * - added / changed: this event put it there / replaced it
 * - selected: inside a slice
 * - pending: not produced yet (a generator's future values are shown as ?)
 */
export type CellState = "idle" | "active" | "raised" | "visited" | "added" | "changed" | "selected" | "pending";

const STATE_LABEL: Partial<Record<CellState, string>> = {
  active: "in use",
  raised: "picked",
  visited: "done",
  added: "new",
  changed: "changed",
  selected: "in the slice",
  pending: "not produced yet",
};

/**
 * One long container divided into cells: the shared look for lists, tuples, strings and the
 * values a range or generator produces. Long sequences show a sliding window of five cells
 * (see `collectionWindow`) with "..." only on a side where items are hidden; real indexes
 * are kept. The whole row is laid out once and slides, so moving the window is a smooth
 * shift rather than a redraw.
 */
export function SegmentedSequence({
  label,
  items,
  strings = false,
  states = {},
  notes = {},
  focus,
  showIndexes = true,
  showNegative = false,
  caption,
  slice,
  tone = "list",
}: {
  /** Shown above the container: the variable name(s) or the iterable as written. */
  label?: ReactNode;
  items: PyItem[];
  /** Characters of a string: shown without quotes. */
  strings?: boolean;
  states?: Record<number, CellState>;
  /** Small notes under cells: { 2: "was 30" }. */
  notes?: Record<number, string>;
  /** What must be visible; also decides where the window sits. */
  focus?: WindowFocus;
  showIndexes?: boolean;
  /** Also number cells from the end (-1, -2, ...), for strings and negative indexing. */
  showNegative?: boolean;
  /** A short line under the container: "tuple · can't be changed". */
  caption?: ReactNode;
  /** Brackets marking a slice's start (included) and stop (excluded). */
  slice?: { start: number; stop: number };
  /** Container color: the value's type, or neutral for produced values (range, generator). */
  tone?: "list" | "tuple" | "str" | "neutral";
}) {
  const n = items.length;
  const win = collectionWindow(n, focus);
  const texts = items.map((x) => (strings ? String(x) : pyItem(x)));
  // Every cell gets the same width, so the row can slide by whole cells.
  const cellCh = Math.min(12, Math.max(2, ...texts.map((t) => t.length), showNegative ? String(-n).length : 0));
  const style = { "--cell": `calc(${cellCh}ch + 1.4rem)`, "--start": win.start, "--count": Math.max(1, win.end - win.start) } as CSSProperties;

  return (
    <div className="seq" style={style} data-tone={tone}>
      {label && <div className="seq-label">{label}</div>}
      <div className="seq-row">
        <span className="seq-more" aria-hidden={!win.hiddenBefore} data-show={win.hiddenBefore || undefined}>
          …<span className="sr-only">{win.start} earlier items not shown</span>
        </span>
        <div className="seq-viewport" data-negative={showNegative || undefined}>
          {n === 0 ? (
            <div className="seq-empty">empty</div>
          ) : (
            <div className="seq-clip">
            <ol className="seq-track" aria-label={`${n} item${n === 1 ? "" : "s"}`}>
              {texts.map((text, i) => {
                const state = states[i] ?? "idle";
                const visible = i >= win.start && i < win.end;
                const inSlice = slice && i >= slice.start && i < slice.stop;
                return (
                  <li
                    key={i}
                    className="seq-cell"
                    data-state={state}
                    data-slice-start={slice?.start === i || undefined}
                    data-slice-stop={slice && slice.stop === i + 1 ? true : undefined}
                    aria-hidden={!visible || undefined}
                  >
                    {showIndexes && <span className="seq-index">{i}</span>}
                    <span className="seq-value">{state === "pending" ? "?" : text}</span>
                    {showNegative && <span className="seq-index seq-index-neg">{i - n}</span>}
                    {notes[i] && <span className="seq-note">{notes[i]}</span>}
                    <span className="sr-only">
                      {showIndexes ? `index ${i}: ` : ""}
                      {state === "pending" ? "not produced yet" : text}
                      {STATE_LABEL[state] ? `, ${STATE_LABEL[state]}` : inSlice ? ", in the slice" : ""}
                      {notes[i] ? `, ${notes[i]}` : ""}
                    </span>
                  </li>
                );
              })}
            </ol>
            </div>
          )}
        </div>
        <span className="seq-more" aria-hidden={!win.hiddenAfter} data-show={win.hiddenAfter || undefined}>
          …<span className="sr-only">{n - win.end} later items not shown</span>
        </span>
      </div>
      {caption && <p className="seq-caption">{caption}</p>}
    </div>
  );
}
