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
import { isCollection, type PyItem, type PyValue } from "@/types/python";
import type { ExprNode, MutationEvent, TraceStep, Walkthrough } from "@/types/trace";
import { formatValue, pyItem } from "@/visualizations/values";

const KINDS = new Set(["variables", "flow", "collections", "loop", "function", "stack"]);

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
    case "tuple":
    case "set":
      return Array.isArray(v.value) && v.value.every(validItem) && (v.type !== "set" || new Set(v.value.map(pyItem)).size === v.value.length);
    case "dict":
      return Array.isArray(v.value) && v.value.every((e) => Array.isArray(e) && e.length === 2 && validItem(e[0]) && validItem(e[1])) && new Set(v.value.map((e) => pyItem(e[0]))).size === v.value.length;
    case "None":
      return v.value === null;
    default:
      return false;
  }
}

function validItem(x: unknown): boolean {
  return x === null || typeof x === "string" || typeof x === "boolean" || (typeof x === "number" && Number.isFinite(x));
}


/** The items of a sequence-like value (a string's characters), or undefined. */
function itemsOf(v: PyValue | undefined): PyItem[] | undefined {
  if (!v) return undefined;
  if (v.type === "str") return [...v.value];
  if (v.type === "list" || v.type === "tuple" || v.type === "set") return v.value;
  if (v.type === "dict") return v.value.map(([k]) => k);
  return undefined;
}

/** What a mutation should have done to the object, worked out from its old value. Undefined = can't tell. */
function expectedAfter(m: MutationEvent, before: PyValue): PyValue | string {
  if (before.type === "list") {
    const xs = [...before.value];
    const i = m.index ?? xs.length;
    switch (m.kind) {
      case "append":
        return { ...before, value: [...xs, m.value ?? null] };
      case "insert":
        xs.splice(i, 0, m.value ?? null);
        return { ...before, value: xs };
      case "set":
        if (m.removed !== undefined && xs[i] !== m.removed) return `says index ${i} held ${pyItem(m.removed)}, but it held ${pyItem(xs[i] ?? null)}`;
        xs[i] = m.value ?? null;
        return { ...before, value: xs };
      case "pop": {
        if (m.removed !== undefined && xs[i] !== m.removed) return `says pop removed ${pyItem(m.removed)}, but index ${i} held ${pyItem(xs[i] ?? null)}`;
        xs.splice(i, 1);
        return { ...before, value: xs };
      }
      case "remove": {
        const at = xs.indexOf(m.value ?? m.removed ?? null);
        if (at < 0) return `removes ${pyItem(m.value ?? null)}, which isn't in the list (Python raises ValueError)`;
        xs.splice(at, 1);
        return { ...before, value: xs };
      }
    }
  }
  if (before.type === "set") {
    if (m.kind === "add") return { ...before, value: before.value.includes(m.value ?? null) ? before.value : [...before.value, m.value ?? null] };
    if (m.kind === "discard") return { ...before, value: before.value.filter((x) => x !== m.value) };
  }
  if (before.type === "dict") {
    const entries = before.value.map(([k, v]) => [k, v] as [PyItem, PyItem]);
    const at = entries.findIndex(([k]) => k === m.key);
    if (m.kind === "set-key") {
      if (at >= 0) {
        if (m.removed !== undefined && entries[at]![1] !== m.removed) return `says ${pyItem(m.key ?? null)} held ${pyItem(m.removed)}, but it held ${pyItem(entries[at]![1])}`;
        entries[at] = [m.key ?? null, m.value ?? null];
      } else entries.push([m.key ?? null, m.value ?? null]);
      return { ...before, value: entries };
    }
    if (m.kind === "delete-key") {
      if (at < 0) return `deletes ${pyItem(m.key ?? null)}, which isn't a key (Python raises KeyError)`;
      entries.splice(at, 1);
      return { ...before, value: entries };
    }
  }
  return `"${m.kind}" doesn't apply to a ${before.type}`;
}

function exprNodes(n: ExprNode): ExprNode[] {
  return "op" in n ? [n, ...exprNodes(n.left), ...exprNodes(n.right)] : [n];
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
  if (w.visualizations.includes("loop") && !w.loopItems && !w.whileLoop && !w.forLoop) sayAll("loop view needs a forLoop, a whileLoop or loopItems");
  if (w.visualizations.includes("stack") && !w.steps.some((s: TraceStep) => s.frame || s.callers?.length)) sayAll("stack view needs steps with a frame or callers");
  if (
    w.visualizations.includes("collections") &&
    !w.steps.some((s) => Object.values(s.vars).some((v) => isCollection(v) || v.type === "str"))
  ) {
    sayAll("collections view needs a list, tuple, dict, set or string in some step");
  }
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
      const { index, key } = step.element;
      if (v?.type === "dict") {
        if (key === undefined || !v.value.some(([k]) => k === key)) say(i, `element key ${pyItem(key ?? null)} isn't in "${step.element.name}"`);
      } else {
        const length = v?.type === "list" || v?.type === "tuple" ? v.value.length : v?.type === "str" ? v.value.length : undefined;
        if (length === undefined) say(i, `element refers to "${step.element.name}", which isn't a list, tuple, string or dict in the step's vars`);
        else if (index === undefined || index < -length || index >= length) say(i, `element index ${index} is out of range`);
      }
    }
    if (step.slice) {
      const v = step.vars[step.slice.name];
      const length = itemsOf(v)?.length;
      if (length === undefined || v?.type === "set" || v?.type === "dict") say(i, `slice refers to "${step.slice.name}", which isn't a list, tuple or string`);
      else if (step.slice.start < 0 || step.slice.stop < step.slice.start || step.slice.stop > length) say(i, "slice bounds are outside the sequence");
    }
    if (step.membership) {
      const items = itemsOf(step.vars[step.membership.name]);
      if (!items) say(i, `membership test on "${step.membership.name}", which isn't a collection in the step's vars`);
      else if (items.includes(step.membership.value) !== step.membership.result) {
        say(i, `says ${pyItem(step.membership.value)} in ${step.membership.name} is ${step.membership.result ? "True" : "False"}, but it's ${step.membership.result ? "False" : "True"}`);
      }
    }
    if (step.mutation) {
      const m = step.mutation;
      const after = step.vars[m.name];
      const before = prev?.vars[m.name];
      if (!after || !before) say(i, `mutation of "${m.name}" needs the variable before and after`);
      else {
        if (isCollection(after) && isCollection(before) && after.id !== before.id) say(i, `mutation changes "${m.name}" in place, so its object id must stay the same`);
        const expected = expectedAfter(m, before);
        if (typeof expected === "string") say(i, `mutation ${expected}`);
        else if (formatValue(expected) !== formatValue(after)) say(i, `after ${m.kind}, "${m.name}" should be ${formatValue(expected)}, but the step shows ${formatValue(after)}`);
      }
    }
    // Names that share an object id must show the same object.
    const byId = new Map<string, [string, PyValue]>();
    for (const [name, value] of Object.entries(step.vars)) {
      if (!isCollection(value) || !value.id) continue;
      const other = byId.get(value.id);
      if (other && (other[1].type !== value.type || formatValue(other[1]) !== formatValue(value))) {
        say(i, `"${other[0]}" and "${name}" share object ${value.id} but show different values`);
      }
      byId.set(value.id, [name, value]);
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
    if (calc?.tree) {
      const nodes = exprNodes(calc.tree);
      const ops = new Map(nodes.filter((n) => "op" in n).map((n) => [n.id, n]));
      if (new Set(nodes.map((n) => n.id)).size !== nodes.length) say(i, "expression tree has duplicate node ids");
      if (calc.active && !ops.has(calc.active)) say(i, `active node "${calc.active}" isn't an operator in the tree`);
      const done = calc.done ?? {};
      for (const id of Object.keys(done)) if (!ops.has(id)) say(i, `done node "${id}" isn't an operator in the tree`);
      // Python evaluates an operator only after both its operands.
      for (const id of [...Object.keys(done), ...(calc.active ? [calc.active] : [])]) {
        const node = ops.get(id) as Extract<ExprNode, { op: string }> | undefined;
        for (const child of node ? [node.left, node.right] : []) {
          if ("op" in child && done[child.id] === undefined) say(i, `"${node!.code}" is evaluated before "${child.code}"`);
        }
      }
      const root = done[calc.tree.id];
      if (root !== undefined && !sameRepr(root, calc.result)) say(i, `the tree works out to ${root}, but the result says ${calc.result}`);
      if (calc.phase === "assign" && "op" in calc.tree && root === undefined) say(i, "assign event before the whole expression is evaluated");
    }
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

    if (step.forLoop) {
      const shape = w.forLoop;
      const t = step.forLoop;
      if (!shape) say(i, "has forLoop state but the walkthrough has no forLoop");
      else {
        const n = shape.items.length;
        // "next" may also sit at index n: Python is asking a generator, and doesn't know yet that it's finished.
        const fits = t.at === "exit" ? t.index === n : t.at === "next" ? t.index >= 0 && t.index <= n : t.index >= 0 && t.index < n;
        if (!fits) say(i, `for-loop index ${t.index} doesn't fit "${t.at}" with ${n} items`);
        if (t.at === "body" && (t.bodyLine === undefined || t.bodyLine < 0 || t.bodyLine >= shape.body.length)) say(i, "for-loop body event needs a bodyLine inside the body");
        const p = prev?.forLoop;
        if (p && t.index < p.index) say(i, "for-loop items can't go backwards");
        if ((t.at === "assign" || t.at === "body") && shape.items[t.index] !== undefined) {
          const v = step.vars[shape.target];
          const item = shape.items[t.index]!;
          const shown = v ? (v.type === "str" ? v.value : v.type === "None" ? null : "value" in v && !Array.isArray(v.value) ? v.value : undefined) : undefined;
          if (shown !== item) say(i, `${shape.target} should refer to ${pyItem(item)} once it's assigned, but the step shows ${v ? formatValue(v) : "nothing"}`);
        }
      }
    }
    if (step.whileLoop?.bodyLine !== undefined && w.whileLoop && (step.whileLoop.bodyLine < 0 || step.whileLoop.bodyLine >= w.whileLoop.body.length)) {
      say(i, "while-loop bodyLine is outside the body");
    }
    if (step.call?.params && step.call.params.length !== step.call.args.length) say(i, "call has a different number of params and args");
    for (const k of Object.keys(step.call?.argFrom ?? {})) if (!(Number(k) < (step.call?.args.length ?? 0))) say(i, `argFrom ${k} isn't an argument position`);
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
