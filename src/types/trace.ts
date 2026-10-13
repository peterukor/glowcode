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
  /** An assignment that calculates something, split into "work it out" and "store it". */
  calc?: CalcEvent;
  /** A function or method call: what goes in, and what comes out (returned, printed, changed). */
  call?: CallEvent;
  /**
   * A prediction asked *before* this step is shown. The player stops on the previous step
   * and asks; the student answers (or chooses to skip) and then reveals this step.
   */
  checkpoint?: Checkpoint;
};

/**
 * `total = total + 1` happens in two events on the same line:
 * - "calculate": Python works out the right side. Variables still hold their old values.
 * - "assign": the name now refers to the result.
 */
export type CalcEvent = {
  /** The name on the left of `=`. */
  target: string;
  /** The right side as written, with the value Python used for each name, e.g.
   *  [{ code: "total", value: "13" }, { code: "+" }, { code: "1" }].
   *  Operators (+ - * / // % **) are recognised by their symbol; literals need no value. */
  parts: { code: string; value?: string }[];
  /** The value the right side works out to, as Python would write it. */
  result: string;
  phase: "calculate" | "assign";
};

/**
 * A call drawn as Inputs → function → what comes out. Returned values, printed output and
 * changes to an object are separate slots, because they are different things.
 * Phases: "call" (arguments go in), "run" (the function body runs), "result" (what comes
 * out is shown), "assign" (a returned value is stored in a variable).
 */
export type CallEvent = {
  /** As written: "len", "print", "append", "greet". */
  name: string;
  /** For methods, the object it's called on, e.g. `items` in `items.append("apple")`. */
  receiver?: string;
  /** Argument values, as Python would write them: ['"cat"']. */
  args: string[];
  phase: "call" | "run" | "result" | "assign";
  /** The value handed back. Leave out when a lesson doesn't need it yet (print's None). */
  returns?: string;
  /** What this call printed. The step's `output` must include it too. */
  prints?: string[];
  /** For methods that change their object: the object afterwards, e.g. '["apple"]'. */
  changes?: string;
  /** The variable that receives the returned value, e.g. `length` in `length = len(word)`. */
  assignTo?: string;
};

/** A prediction inside a walkthrough. Text fields use lesson markup (`code`, **bold**). */
export type Checkpoint = {
  prompt: string;
  choices: { id: string; text: string; feedback?: string }[];
  answer: string;
  /** Why the answer is right. Shown with the revealed step, whatever the student chose. */
  explanation: string;
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
  /** The items a `for` loop goes through, for the loop visualization. */
  loopItems?: (string | number)[];
};

/** A playground demo: a walkthrough plus a chip icon. */
export type Example = Walkthrough & { emoji: string };
