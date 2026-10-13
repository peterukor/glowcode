import type { IfChain, IfChainTrace } from "./conditional";
import type { Variables } from "./python";

/**
 * One moment of a program run. Today these are hand-written demo traces;
 * a real Python (or Java) tracer only has to produce the same shape.
 */
export type TraceStep = {
  /** 1-indexed line that is about to run / just ran. */
  line: number;
  vars: Variables;
  /** Everything printed so far. */
  output?: string[];
  /** A short, friendly explanation of what happened. */
  note: string;
  /** Variable to emphasize in the variables panel. */
  highlight?: string;
  loopIndex?: number;
  ifChain?: IfChainTrace;
};

export type VisualizationKind = "variables" | "flow" | "collections" | "loop" | "function";

export type Example = {
  id: string;
  title: string;
  emoji: string;
  language: "python";
  code: string;
  /** Which visualizations make sense for this example; the first one is the default. */
  visualizations: VisualizationKind[];
  steps: TraceStep[];
  /** Structure of the if-chain in `code`, for the flow visualization. */
  ifChain?: IfChain;
};
