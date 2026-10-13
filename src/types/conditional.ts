/**
 * The shape of an if / elif / else chain, independent of any one run of the program.
 * The flow-tree visualization is drawn from this; a trace (below) says what happened.
 */

/** One comparison or truthy check, e.g. `age >= 13` or `has_ticket`. */
export type Comparison = { kind: "compare"; id: string; code: string };

/** `a and b`, `a or b or c`. Operands can themselves be `and` / `or` groups. */
export type BoolOp = { kind: "boolop"; id: string; op: "and" | "or"; operands: Condition[] };

export type Condition = Comparison | BoolOp;

export type IfBranch = {
  id: string;
  keyword: "if" | "elif";
  condition: Condition;
  /** The indented lines that run when this branch is taken. */
  body: string[];
};

export type IfChain = {
  branches: IfBranch[];
  elseBody?: string[];
  /** The first line after the whole chain, where every path meets again. */
  after?: string;
};

/** Where execution currently is inside the chain. */
export type FlowPoint =
  | { kind: "test"; branch: string }
  | { kind: "body"; branch: string }
  | { kind: "else" }
  | { kind: "after" };

/**
 * What a tracer reports about the chain at one step.
 * `results` only contains comparisons Python actually evaluated, so short-circuiting
 * (`False and ...`, `True or ...`) shows up naturally as missing entries.
 */
export type IfChainTrace = {
  results: Record<string, boolean>;
  at?: FlowPoint;
};
