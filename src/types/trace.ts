import type { IfChain, IfChainTrace } from "./conditional";
import type { PyItem, Variables } from "./python";

/**
 * One execution event: the unit a walkthrough steps through. This file is the contract
 * between whatever produces events (hand-written, verified walkthroughs today; a language
 * tracer in a future editor) and the renderers that draw them.
 *
 * A step is an event, not a source line: one line can produce several events (read a
 * value, calculate, store) and a loop revisits lines. Every field describes the state
 * *after* the event, so any step can be drawn on its own; that's what makes Previous and
 * Reset exact.
 *
 * Core fields stay small. A diagram that needs more gets its own focused extension
 * (`calc`, `call`, `ifChain`, `whileLoop`, ...). Renderers derive what glows from these
 * explicit states; nothing is guessed from the note text or the code.
 */
export type TraceStep = {
  /** 1-indexed source line being executed. The same line can appear in many steps (loops). */
  line: number;
  /** Variables after this step. "Before" is simply the previous step's `vars`. */
  vars: Variables;
  /** Everything printed so far. */
  output?: string[];
  /**
   * A short, friendly explanation of what happened. Every hand-written walkthrough has one
   * (the validator checks); a future tracer's events may not.
   */
  note?: string;
  /** The variable this event created or changed. */
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
  /** For-loops: which lap is running (0-based). Equal to the number of items once the loop has ended. */
  loopIndex?: number;
  /** If-chains: which comparisons Python has evaluated so far, and where it is. */
  ifChain?: IfChainTrace;
  /** While-loops: how many times the condition has been checked, the latest result, and where Python is. */
  whileLoop?: WhileLoopTrace;
  /** For-loops drawn as a flowchart: where Python is and which item is current. */
  forLoop?: ForLoopTrace;
  /** One item being used: `word[0]`, `scores["ada"]`. Negative indexes count from the end. */
  element?: { name: string; index?: number; key?: PyItem };
  /** A slice being taken: `word[1:4]` selects indexes 1, 2, 3 (the stop is excluded). */
  slice?: { name: string; start: number; stop: number };
  /** A membership test: `3 in numbers`. */
  membership?: { name: string; value: PyItem; result: boolean };
  /** A collection changed in place (the object keeps its identity). */
  mutation?: MutationEvent;
  /** The function this event runs in. Leave out for the main program. */
  frame?: string;
  /** The frames waiting for this one, oldest first (the main program first). */
  callers?: CallerFrame[];
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
 * `total = total + 1` is several events on the same line:
 * - "read" (optional): Python looks up the current values of the names on the right.
 * - "calculate": Python works out the right side. Variables still refer to their old values.
 * - "assign": the name on the left now refers to the result.
 * Short walkthroughs can skip "read"; the calculation already shows the values used.
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
  phase: "read" | "calculate" | "assign";
  /**
   * For expressions with more than one operator: the expression as a tree, so evaluation order
   * (precedence, parentheses) is visible. `parts` still holds the flat form.
   */
  tree?: ExprNode;
  /** The operator node being evaluated in this event. */
  active?: string;
  /** Results of operator nodes evaluated so far, by node id: { mul: "6" }. */
  done?: Record<string, string>;
};

/**
 * One node of an expression tree. Operands are names or literals (`value` is what a name
 * referred to); operators have two children. `code` is the node's own source, with brackets
 * where needed, so it can be checked in Python: "3 * 2", "(4 + 3) * 2".
 */
export type ExprNode =
  | { id: string; code: string; value?: string }
  | { id: string; code: string; op: string; left: ExprNode; right: ExprNode };

/** A change to a list, dict or set in place. */
export type MutationEvent = {
  /** The variable whose object changes. */
  name: string;
  kind: "append" | "insert" | "set" | "pop" | "remove" | "add" | "discard" | "set-key" | "delete-key";
  /** The list position involved (after the change for append/insert, before it for pop/remove). */
  index?: number;
  /** The dict key involved. */
  key?: PyItem;
  /** The value added or stored. */
  value?: PyItem;
  /** The value that left the collection, or the value that was replaced. */
  removed?: PyItem;
};

/** A function that is waiting for the current one to return. */
export type CallerFrame = {
  /** "<module>" for the main program, else the function's name. */
  name: string;
  /** Its own variables (parameters and locals). */
  vars: Variables;
  /** The call it's waiting on, as written: "double(value)". */
  calling: string;
};

/**
 * The shape of a `for` loop, drawn as a flowchart: the iterable, "Next item available?",
 * the loop variable, the body, the loop-back and the exit.
 */
export type ForLoopShape = {
  /** The loop variable as written: "number". */
  target: string;
  /** The iterable as written after `in`: "[10, 20, 30]", "word", "range(1, 6)". */
  iterable: string;
  /**
   * How to draw the iterable. Lists, tuples and strings are indexed sequences; range values
   * are produced one at a time; generators don't reveal values before producing them; a dict
   * gives its keys; a set has no guaranteed order.
   */
  kind: "list" | "tuple" | "str" | "range" | "dict" | "set" | "generator";
  /** The items the loop gets, in the order this run gets them. */
  items: PyItem[];
  /** The body's lines, as written (without indentation). */
  body: string[];
  /** The first line after the loop, if there is one. */
  after?: string;
};

export type ForLoopTrace = {
  /**
   * - next: Python asks for the next item (it pops out of the iterable, or there is none)
   * - assign: the item is assigned to the loop variable
   * - body: a body line runs (`bodyLine`)
   * - exit: no item is left, so the loop ends
   */
  at: "next" | "assign" | "body" | "exit";
  /** The current item (0-based). At "exit" it equals the number of items. */
  index: number;
  /** The body line running (0-based), at "body". */
  bodyLine?: number;
};

/** The shape of a `while` loop, drawn as: condition → (True) body → back to the condition; (False) → after. */
export type WhileLoopShape = {
  /** Lines before the loop that set it up, e.g. ["count = 1"]. */
  setup?: string[];
  /** As written after `while`, e.g. "count <= 3". */
  condition: string;
  /** The loop body's lines, as written (without indentation). */
  body: string[];
  /** The first line after the loop, if there is one. */
  after?: string;
};

/** Where execution is in a while loop. */
export type WhileLoopTrace = {
  /** How many times the condition has been checked so far (1 = the first check). */
  checks: number;
  at: "check" | "body" | "exit";
  /** The result of the latest check. Only set once Python has evaluated it. */
  result?: boolean;
  /** The body line running (0-based), at "body". */
  bodyLine?: number;
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
  /** The value the receiver refers to, shown with it: `'["pen"]'`. */
  receiverValue?: string;
  /** For user-defined functions: parameter names, matched to `args` by position. */
  params?: string[];
  /** Arguments that are the returned value of an inner call: { 0: "len()" }. */
  argFrom?: Record<number, string>;
  /** For an inner call: the outer call its returned value goes into, e.g. "print()". */
  feeds?: string;
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

export type VisualizationKind = "variables" | "flow" | "collections" | "loop" | "function" | "stack";

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
  /** Structure of the `while` loop in `code`, for the loop visualization. */
  whileLoop?: WhileLoopShape;
  /** Structure of the `for` loop in `code`, for the loop flowchart. */
  forLoop?: ForLoopShape;
};

/** A playground demo: a walkthrough plus a chip icon. */
export type Example = Walkthrough & { emoji: string };
