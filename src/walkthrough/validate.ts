/**
 * Catches walkthrough data that would show students something misleading. Pure checks on
 * the data; `scripts/check-python.ts` separately replays every walkthrough in real Python.
 *
 * Checked here:
 * - structure: at least one step, lines that exist, supported views that have their data
 * - output only ever grows (nothing printed disappears)
 * - predictions: not on the first step, the answer is one of the choices, no duplicate ids
 * - variables: well-formed values, highlighted / element names that exist
 * - calculations: names don't change before the "assign" event, and then hold the result
 * - calls: printed text is at the end of the output, a stored return value matches
 * - conditionals: only real condition / branch ids, Python's evaluation order, and no
 *   expression Python would skip (short-circuit) shown as evaluated
 * - loops: lap indexes in range, while-loop checks that only move forward
 */
import { getReference } from "@/references/registry";
import { referencesIn } from "@/courses/richText";
import type { Condition, IfChain } from "@/types/conditional";
import type { PyValue } from "@/types/python";
import type { Walkthrough } from "@/types/trace";
import { formatValue } from "@/visualizations/values";

const KINDS = new Set(["variables", "flow", "collections", "loop", "function"]);

/** `"Hi"` and `'Hi'` are the same value; authors use either. */
const sameRepr = (a: string, b: string) => a.replace(/'/g, '"') === b.replace(/'/g, '"');

function validValue(v: PyValue): boolean {
  switch (v.type) {
    case "int":
      return Number.isInteger(v.value);
    case "float":
      return typeof v.value === "number" && Number.isFinite(v.value);
    case "str":
      return typeof v.value === "string";
    case "bool":
      return typeof v.value === "boolean";
    case "list":
      return Array.isArray(v.value) && v.value.every((x) => typeof x === "string" || typeof x === "number");
    case "None":
      return v.value === null;
    default:
      return false;
  }
}

function conditionsOf(c: Condition): Condition[] {
  return c.kind === "compare" ? [c] : [c, ...c.operands.flatMap(conditionsOf)];
}

/**
 * Problems with which comparisons a step says Python evaluated: unknown ids, operands
 * evaluated out of order or after `and` / `or` already decided, and branches checked
 * after an earlier branch was taken.
 */
function checkEvaluationOrder(chain: IfChain, results: Record<string, boolean>): string[] {
  const problems: string[] = [];
  const evaluated = (c: Condition): boolean | undefined => {
    if (c.kind === "compare") return results[c.id];
    const stopOn = c.op === "or"; // `or` stops at the first True, `and` at the first False
    for (const [i, op] of c.operands.entries()) {
      const value = evaluated(op);
      if (value === undefined) {
        // Nothing after an unevaluated operand can have been evaluated.
        for (const later of c.operands.slice(i + 1).flatMap(conditionsOf)) {
          if (later.kind === "compare" && later.id in results) problems.push(`"${later.id}" is shown as evaluated before the operands before it`);
        }
        return undefined;
      }
      if (value === stopOn) {
        for (const skipped of c.operands.slice(i + 1).flatMap(conditionsOf)) {
          if (skipped.kind === "compare" && skipped.id in results) {
            problems.push(`"${skipped.id}" is shown as evaluated, but Python skips it (\`${c.op}\` was already decided)`);
          }
        }
        return stopOn;
      }
    }
    return !stopOn;
  };

  let reached = true;
  for (const branch of chain.branches) {
    const ids = conditionsOf(branch.condition).filter((c) => c.kind === "compare").map((c) => c.id);
    if (!reached) {
      for (const id of ids) if (id in results) problems.push(`"${id}" is shown as evaluated, but an earlier branch already decided the chain`);
      continue;
    }
    const value = evaluated(branch.condition);
    if (value !== false) reached = false; // taken, or not decided yet
  }
  return problems;
}

export function validateWalkthrough(w: Walkthrough): string[] {
  const problems: string[] = [];
  const say = (i: number, msg: string) => problems.push(`walkthrough "${w.id}" step ${i + 1}: ${msg}`);
  const sayAll = (msg: string) => problems.push(`walkthrough "${w.id}": ${msg}`);
  const lineCount = w.code.split("\n").length;

  if (!w.steps.length) sayAll("has no steps");
  for (const kind of w.visualizations) {
    if (!KINDS.has(kind)) sayAll(`unknown visualization kind "${kind}"`);
  }
  if (w.visualizations.includes("flow") && !w.ifChain) sayAll("flow view needs an ifChain");
  if (w.visualizations.includes("loop") && !w.loopItems && !w.whileLoop) sayAll("loop view needs loopItems or a whileLoop");
  if (w.visualizations.includes("function") && !w.steps.some((s) => s.call)) sayAll("function view needs at least one step with a call");

  const conditionIds = new Map<string, Condition>(w.ifChain ? w.ifChain.branches.flatMap((b) => conditionsOf(b.condition)).map((c) => [c.id, c]) : []);
  const branchIds = new Set(w.ifChain?.branches.map((b) => b.id) ?? []);

  w.steps.forEach((step, i) => {
    const prev = w.steps[i - 1];
    if (step.line < 1 || step.line > lineCount) say(i, `points at line ${step.line}, which doesn't exist`);
    if (!step.note?.trim()) say(i, "needs a note explaining what happened");

    for (const [name, value] of Object.entries(step.vars)) {
      if (!validValue(value)) say(i, `variable "${name}" has a malformed ${value.type} value`);
    }
    if (step.highlight && !(step.highlight in step.vars)) say(i, `highlights "${step.highlight}", which isn't in the step's vars`);
    if (step.element) {
      const v = step.vars[step.element.name];
      const length = v?.type === "list" ? v.value.length : v?.type === "str" ? v.value.length : undefined;
      if (length === undefined) say(i, `element refers to "${step.element.name}", which isn't a list or string in the step's vars`);
      else if (step.element.index < 0 || step.element.index >= length) say(i, `element index ${step.element.index} is out of range`);
    }

    const before = prev?.output ?? [];
    const now = step.output ?? [];
    if (before.some((line, j) => now[j] !== line)) say(i, "printed output from an earlier step is missing (output must include everything printed so far)");

    const cp = step.checkpoint;
    if (cp) {
      if (i === 0) say(i, "the first step can't have a prediction: there's no earlier step to pause on");
      if (!cp.choices.some((c) => c.id === cp.answer)) say(i, `prediction answer "${cp.answer}" isn't one of its choices`);
      const ids = cp.choices.map((c) => c.id);
      if (new Set(ids).size !== ids.length) say(i, "prediction has duplicate choice ids");
      if (cp.choices.length < 2) say(i, "a prediction needs at least two choices");
      const texts = [cp.prompt, cp.explanation, ...cp.choices.flatMap((c) => [c.text, c.feedback ?? ""])];
      for (const id of texts.flatMap(referencesIn)) if (!getReference(id)) say(i, `unknown reference "${id}"`);
    }

    const calc = step.calc;
    if (calc) {
      const target = step.vars[calc.target];
      if (calc.phase === "assign") {
        if (!target) say(i, `calc assigns to "${calc.target}", but that variable isn't in the step's vars`);
        else if (!sameRepr(formatValue(target), calc.result)) say(i, `calc result is ${calc.result}, but "${calc.target}" refers to ${formatValue(target)}`);
      } else {
        // Before the assign event, the name must still refer to its old value.
        const old = prev?.vars[calc.target];
        if (target && (!old || formatValue(old) !== formatValue(target))) say(i, `"${calc.target}" changes before the calc's assign event`);
      }
    }

    const call = step.call;
    if (call?.prints && (call.phase === "result" || call.phase === "assign")) {
      const tail = now.slice(-call.prints.length);
      if (tail.join("\n") !== call.prints.join("\n")) say(i, "call prints something that isn't at the end of the step's output");
    }
    if (call?.assignTo && call.phase === "assign") {
      const stored = step.vars[call.assignTo];
      if (!stored) say(i, `call stores into "${call.assignTo}", but that variable isn't in the step's vars`);
      else if (call.returns !== undefined && !sameRepr(formatValue(stored), call.returns)) {
        say(i, `call returns ${call.returns}, but "${call.assignTo}" refers to ${formatValue(stored)}`);
      }
    }

    if (step.ifChain) {
      if (!w.ifChain) say(i, "has ifChain state but the walkthrough has no ifChain");
      else {
        for (const id of Object.keys(step.ifChain.results)) if (!conditionIds.has(id)) say(i, `ifChain result for unknown condition "${id}"`);
        const at = step.ifChain.at;
        if (at && (at.kind === "test" || at.kind === "body") && !branchIds.has(at.branch)) say(i, `ifChain points at unknown branch "${at.branch}"`);
        for (const p of checkEvaluationOrder(w.ifChain, step.ifChain.results)) say(i, p);
      }
    }

    if (step.loopIndex !== undefined) {
      if (!w.loopItems) say(i, "has a loopIndex but the walkthrough has no loopItems");
      else if (step.loopIndex < 0 || step.loopIndex > w.loopItems.length) say(i, `loopIndex ${step.loopIndex} is out of range`);
    }
    if (step.whileLoop) {
      if (!w.whileLoop) say(i, "has whileLoop state but the walkthrough has no whileLoop");
      const p = prev?.whileLoop;
      if (p && step.whileLoop.checks < p.checks) say(i, "while-loop checks can't go backwards");
      if (step.whileLoop.at === "body" && step.whileLoop.result === false) say(i, "the loop body can't run after a False check");
      if (step.whileLoop.at === "exit" && step.whileLoop.result !== false) say(i, "the loop can only end after a False check");
    }
  });

  return problems;
}

/**
 * Checks a set of walkthroughs together: each one on its own, plus ids that are unique.
 * The same walkthrough object may be reused (a lesson and the manual share one); two
 * different walkthroughs with one id is an error.
 */
export function validateWalkthroughs(list: readonly Walkthrough[]): string[] {
  const seen = new Map<string, Walkthrough>();
  const problems: string[] = [];
  for (const w of list) {
    const other = seen.get(w.id);
    if (other && other !== w) problems.push(`Two different walkthroughs use the id "${w.id}"`);
    if (other) continue;
    seen.set(w.id, w);
    problems.push(...validateWalkthrough(w));
  }
  return problems;
}
