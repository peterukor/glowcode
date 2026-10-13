import type { Condition, FlowPoint, IfChain, IfChainTrace } from "@/types/conditional";

/** How a condition (comparison or and/or group) looks right now. */
export type ConditionState = "idle" | "true" | "false" | "skipped";

export type ChainState = {
  /** State of every comparison and and/or node, keyed by id. */
  conditions: Record<string, ConditionState>;
  /** Result of each branch's whole condition, keyed by branch id. */
  decisions: Record<string, ConditionState>;
  /**
   * Which block runs: a branch id, "else", "none" (all False and no else),
   * or undefined while Python hasn't decided yet.
   */
  taken: string | undefined;
  at: FlowPoint | undefined;
};

/**
 * Python's own rules, including short-circuiting: `and` stops at the first False,
 * `or` stops at the first True. Returns undefined while the answer isn't known yet.
 */
export function evaluate(condition: Condition, results: Record<string, boolean>): boolean | undefined {
  if (condition.kind === "compare") return results[condition.id];

  const stopOn = condition.op === "and" ? false : true;
  for (const operand of condition.operands) {
    const value = evaluate(operand, results);
    if (value === undefined) return undefined;
    if (value === stopOn) return stopOn;
  }
  return !stopOn;
}

function toState(value: boolean | undefined): ConditionState {
  if (value === undefined) return "idle";
  return value ? "true" : "false";
}

/** Marks every node in a condition tree. `decided` = the whole condition already has an answer. */
function markConditions(
  condition: Condition,
  results: Record<string, boolean>,
  decided: boolean,
  out: Record<string, ConditionState>,
) {
  const value = evaluate(condition, results);
  out[condition.id] = value === undefined && decided ? "skipped" : toState(value);
  if (condition.kind === "boolop") {
    for (const operand of condition.operands) markConditions(operand, results, decided, out);
  }
}

function markSkipped(condition: Condition, out: Record<string, ConditionState>) {
  out[condition.id] = "skipped";
  if (condition.kind === "boolop") condition.operands.forEach((c) => markSkipped(c, out));
}

export function deriveChainState(chain: IfChain, trace: IfChainTrace | undefined): ChainState {
  const results = trace?.results ?? {};
  const conditions: Record<string, ConditionState> = {};
  const decisions: Record<string, ConditionState> = {};
  let taken: string | undefined;
  let stillChecking = true;

  for (const branch of chain.branches) {
    if (!stillChecking) {
      // An earlier branch already won (or Python hasn't got this far yet).
      decisions[branch.id] = taken ? "skipped" : "idle";
      if (taken) markSkipped(branch.condition, conditions);
      else markConditions(branch.condition, {}, false, conditions);
      continue;
    }

    const value = evaluate(branch.condition, results);
    decisions[branch.id] = toState(value);
    markConditions(branch.condition, results, value !== undefined, conditions);

    if (value === true) {
      taken = branch.id;
      stillChecking = false;
    } else if (value === undefined) {
      stillChecking = false;
    }
  }

  if (stillChecking) taken = chain.elseBody ? "else" : "none";

  return { conditions, decisions, taken, at: trace?.at };
}
