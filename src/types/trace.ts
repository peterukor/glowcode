import type { IfChain, IfChainTrace } from "./conditional";
import type { Variables } from "./python";

/**
 * One moment of a program run: the "execution event" a walkthrough steps through.
 * Today these are hand-written and verified; a real Python (or Java) tracer only has
 * to produce the same shape.
 *
 * Extending it: core fields stay small. Each visualization that needs more detail gets
 * its own optional payload (like `ifChain` below), so adding loops or function-call
 * diagrams later means adding one optional field, not reshaping every step.
 */
export type TraceStep = {
  /** 1-indexed source line being executed. The same line can appear in many steps (loops). */
  line: number;
  /** Variables after this step. "Before" is simply the previous step's `vars`. */
  vars: Variables;
  /** Everything printed so far. */
  output?: string[];
  /** A short, friendly explanation of what happened. */
  note: string;
  /** Variable to emphasize. */
  highlight?: string;
  /**
   * How an expression was worked out, one stage at a time,
   * e.g. ["age + 1", "13 + 1", "14"]. Lets one line become several small steps.
   */
  evaluation?: string[];
  /**
   * A value handed back by a function or method at this step, e.g. "'Hi, Sam'" or "None".
   * Shown separately from printed output: returning is not printing.
   */
  returned?: string;
  loopIndex?: number;
  ifChain?: IfChainTrace;
};

export type VisualizationKind = "variables" | "flow" | "collections" | "loop" | "function";

export type Language = "python" | "java";

/**
 * A predefined, verified, read-only walkthrough of one code snippet.
 * Lessons attach these to code examples; the playground uses them as demos.
 */
export type Walkthrough = {
  /** Stable and unique across the app; also used to remember the last walkthrough a student opened. */
  id: string;
  title: string;
  language: Language;
  code: string;
  /** Which views make sense for this code; the first one is shown by default. */
  visualizations: VisualizationKind[];
  steps: TraceStep[];
  /** Structure of the if-chain in `code`, for the flow visualization. */
  ifChain?: IfChain;
};

/** A playground demo: a walkthrough plus a chip icon. */
export type Example = Walkthrough & { emoji: string };
