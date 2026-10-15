/**
 * The playback controller: which event the student is looking at, and what they've done at
 * prediction checkpoints. Pure functions over (walkthrough, state), with no React, so the
 * same rules drive the player, the tests and any future host.
 *
 * Determinism: everything on screen is derived from `walkthrough.steps[index]` plus the
 * checkpoint records. Going back and forth or resetting can't leave stale glows or values
 * behind, because nothing is accumulated while stepping.
 */
import type { TraceStep, Walkthrough } from "@/types/trace";

/** What the student did at one checkpoint. Kept while the player is open. */
export type CheckpointRecord = {
  /** Wrong choices already tried, in order. */
  ruledOut: string[];
  correct: boolean;
  /** The student moved past the checkpoint (after answering, or by choosing to skip). */
  revealed: boolean;
};

export const emptyRecord: CheckpointRecord = { ruledOut: [], correct: false, revealed: false };

export type PlaybackState = {
  /** Index of the event on screen. */
  index: number;
  /** Checkpoint records, keyed by the index of the step the checkpoint belongs to. */
  records: Record<number, CheckpointRecord>;
};

export type PlaybackAction =
  | { type: "next" }
  | { type: "prev" }
  | { type: "reset" }
  /** Back to the first step, keeping prediction answers (replaying with autoplay). */
  | { type: "rewind" }
  /** Answer the waiting checkpoint. */
  | { type: "check"; choiceId: string }
  /** Move past the waiting checkpoint (after answering, or deliberately skipping). */
  | { type: "reveal" };

export const initialPlayback: PlaybackState = { index: 0, records: {} };

/** The index of the step whose checkpoint is waiting before it can be shown, if any. */
export function waitingCheckpoint(w: Walkthrough, state: PlaybackState): number | undefined {
  const next = state.index + 1;
  return w.steps[next]?.checkpoint && !state.records[next]?.revealed ? next : undefined;
}

export function reducePlayback(w: Walkthrough, state: PlaybackState, action: PlaybackAction): PlaybackState {
  const last = w.steps.length - 1;
  const waiting = waitingCheckpoint(w, state);
  switch (action.type) {
    case "next":
      // A waiting prediction blocks Next; only an explicit reveal moves past it.
      return waiting !== undefined || state.index >= last ? state : { ...state, index: state.index + 1 };
    case "prev":
      return state.index === 0 ? state : { ...state, index: state.index - 1 };
    case "reset":
      return initialPlayback;
    case "rewind":
      return { ...state, index: 0 };
    case "check": {
      if (waiting === undefined) return state;
      const cp = w.steps[waiting]!.checkpoint!;
      const r = state.records[waiting] ?? emptyRecord;
      if (r.correct || r.revealed || !cp.choices.some((c) => c.id === action.choiceId)) return state;
      const next =
        action.choiceId === cp.answer
          ? { ...r, correct: true }
          : { ...r, ruledOut: r.ruledOut.includes(action.choiceId) ? r.ruledOut : [...r.ruledOut, action.choiceId] };
      return { ...state, records: { ...state.records, [waiting]: next } };
    }
    case "reveal": {
      if (waiting === undefined) return state;
      const r = state.records[waiting] ?? emptyRecord;
      return { index: waiting, records: { ...state.records, [waiting]: { ...r, revealed: true } } };
    }
  }
}

/** Everything a player needs to draw one moment, derived from the state. */
export type PlaybackView = {
  index: number;
  total: number;
  step: TraceStep;
  /** The step before, for "was 13" style comparisons. Undefined on the first step. */
  previous?: TraceStep;
  /** The checkpoint waiting before the next step, and its index. */
  waiting?: { index: number; step: TraceStep; record: CheckpointRecord };
  /** The record of this step's own checkpoint, once revealed (shown as a recap). */
  recap?: CheckpointRecord;
  canPrev: boolean;
  canNext: boolean;
  /** "same line, next step" / "running again (3rd time)", when the line didn't simply move on. */
  linePosition?: string;
};

export function viewPlayback(w: Walkthrough, state: PlaybackState): PlaybackView {
  const index = Math.min(Math.max(state.index, 0), w.steps.length - 1);
  const step = w.steps[index]!;
  const waitingIndex = waitingCheckpoint(w, { ...state, index });
  const own = state.records[index];
  return {
    index,
    total: w.steps.length,
    step,
    previous: index > 0 ? w.steps[index - 1] : undefined,
    waiting:
      waitingIndex !== undefined
        ? { index: waitingIndex, step: w.steps[waitingIndex]!, record: state.records[waitingIndex] ?? emptyRecord }
        : undefined,
    recap: step.checkpoint && own?.revealed ? own : undefined,
    canPrev: index > 0,
    canNext: index < w.steps.length - 1 && waitingIndex === undefined,
    linePosition: linePosition(w.steps, index),
  };
}

/**
 * Explains why the highlight didn't simply move down one line: the same line can take
 * several events (work out the right side, then assign) or run again (loops).
 */
export function linePosition(steps: readonly TraceStep[], index: number): string | undefined {
  const line = steps[index]!.line;
  if (index > 0 && steps[index - 1]!.line === line) return "same line, next step";
  const visits = steps.slice(0, index + 1).filter((s, i) => s.line === line && (i === 0 || steps[i - 1]!.line !== line)).length;
  if (visits > 1) return visits === 2 ? "running again" : `running again (${visits}${ordinal(visits)} time)`;
  return undefined;
}

function ordinal(n: number) {
  return n % 10 === 1 && n % 100 !== 11 ? "st" : n % 10 === 2 && n % 100 !== 12 ? "nd" : n % 10 === 3 && n % 100 !== 13 ? "rd" : "th";
}

/**
 * Variables the current event reads without changing: the names on the right of an
 * assignment while Python looks them up or calculates.
 */
export function readingNames(step: TraceStep): string[] {
  const calc = step.calc;
  if (!calc || calc.phase === "assign") return [];
  // With an expression tree, once the whole expression has a result Python has finished
  // reading: the step shows the produced value, not the lookup.
  if (calc.tree && calc.done?.[calc.tree.id] !== undefined) return [];
  return calc.parts.filter((p) => p.value !== undefined && p.code in step.vars).map((p) => p.code);
}
