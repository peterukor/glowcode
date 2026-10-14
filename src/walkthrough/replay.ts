/**
 * Compares a hand-written walkthrough with what Python actually did, event by event.
 *
 * `scripts/check-python.ts` runs the program under a line tracer and passes the recorded
 * events here. Each recorded event is the state *before* a line runs; the state after it is
 * the next event's. Consecutive walkthrough steps on the same line ("a visit") are matched to
 * the next recorded event for that line, in order, so loop laps and skipped branches have to
 * line up exactly. Then:
 * - the last step of a visit must show the state after the line (variables and output);
 * - earlier steps of a visit (reading, calculating, a call before it returns) may show each
 *   variable as it is before or after the line, but nothing else;
 * - calculations, their operand values, and every comparison or while-condition the
 *   walkthrough says Python evaluated are sent back to Python to evaluate (`evals`).
 *
 * Pure logic, no Python: easy to test, and the same comparison a future tracer can use.
 */
import type { Condition } from "@/types/conditional";
import { isCollection } from "@/types/python";
import type { ExprNode, TraceStep, Walkthrough } from "@/types/trace";
import { encodeValue, pyItem } from "@/visualizations/values";

/**
 * An event recorded by the tracer. `vars` are the running frame's simple variables (tagged
 * JSON, see `encodeValue`), `ids` Python's id() of each collection (to compare which names
 * share an object), `stack` every frame from the main program to the running one, `out` the
 * printed text so far. A "return" event is recorded when a function returns, at the line of
 * the caller that is waiting for it.
 */
export type RecordedEvent = {
  line: number | null;
  vars: Record<string, unknown>;
  out: string;
  ids?: Record<string, number>;
  stack?: { name: string; vars: Record<string, unknown> }[];
  kind?: "line" | "return";
};

/** Ask Python: does `expr`, evaluated with the variables of event `at`, equal `expect`? */
export type EvalRequest = { at: number; expr: string; expect: string; what: string };


/** JSON with sorted keys, so dictionaries compare by content. */
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value as object)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${canonical((value as Record<string, unknown>)[k])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

const encodeVars = (vars: TraceStep["vars"]) => canonical(Object.fromEntries(Object.entries(vars).map(([k, v]) => [k, encodeValue(v)])));
const varsOf = (step: TraceStep) => encodeVars(step.vars);
const depthOf = (e: RecordedEvent) => e.stack?.length ?? 1;

/** The frames a step claims, main program first, as "name: vars" strings. */
const stackOf = (step: TraceStep) => [...(step.callers ?? []).map((c) => `${c.name}: ${encodeVars(c.vars)}`), `${step.frame ?? "<module>"}: ${varsOf(step)}`];
const recordedStack = (e: RecordedEvent) => (e.stack ?? []).map((f) => `${f.name}: ${canonical(f.vars)}`);

/** Pairs of names that refer to one object, as a comparable string. */
function sharing(names: string[], same: (a: string, b: string) => boolean): string {
  const pairs: string[] = [];
  names.forEach((a, i) => names.slice(i + 1).forEach((b) => same(a, b) && pairs.push(`${a}=${b}`)));
  return pairs.join(",");
}

function opNodes(n: ExprNode): ExprNode[] {
  return "op" in n ? [n, ...opNodes(n.left), ...opNodes(n.right)] : [];
}
const outOf = (step: TraceStep) => JSON.stringify(step.output ?? []);
const eventOut = (e: RecordedEvent) => JSON.stringify(e.out ? e.out.replace(/\n$/, "").split("\n") : []);

function compares(c: Condition): { id: string; code: string }[] {
  return c.kind === "compare" ? [c] : c.operands.flatMap(compares);
}

/** True when the walkthrough's code can be replayed line by line (no input, classes or imports). */
export function replayable(w: Walkthrough): boolean {
  return !/^\s*(class|async|import|from)\b/m.test(w.code) && !/\binput\s*\(/.test(w.code);
}

export function matchRecording(w: Walkthrough, events: RecordedEvent[]): { problems: string[]; evals: EvalRequest[] } {
  const problems: string[] = [];
  const evals: EvalRequest[] = [];
  const say = (i: number, msg: string) => problems.push(`walkthrough "${w.id}" step ${i + 1} (line ${w.steps[i]!.line}): ${msg}`);
  const conditionCode = new Map(w.ifChain?.branches.flatMap((b) => compares(b.condition)).map((c) => [c.id, c.code]) ?? []);

  // Group consecutive steps on the same line into visits.
  const visits: number[][] = [];
  w.steps.forEach((s, i) => {
    const last = visits.at(-1);
    if (last && w.steps[last[0]!]!.line === s.line) last.push(i);
    else visits.push([i]);
  });

  let next = 0;
  for (const visit of visits) {
    const line = w.steps[visit[0]!]!.line;
    const j = events.findIndex((e, k) => k >= next && e.line === line);
    if (j < 0) {
      say(visit[0]!, `Python doesn't run line ${line} at this point`);
      break;
    }
    const before = events[j]!;
    // The state after this line, in the same frame. If the next event is in another frame
    // (a call starts, or this function returns), this frame's variables haven't changed yet.
    const following = events[j + 1] ?? before;
    const after = depthOf(following) === depthOf(before) ? following : { ...before, out: following.out };
    const states = { before: { vars: canonical(before.vars), out: eventOut(before) }, after: { vars: canonical(after.vars), out: eventOut(after) } };

    visit.forEach((i, n) => {
      const step = w.steps[i]!;
      const vars = varsOf(step);
      const out = outOf(step);
      const isLast = n === visit.length - 1;
      if (isLast) {
        if (vars !== states.after.vars) say(i, `after this line Python has ${states.after.vars}, the walkthrough shows ${vars}`);
        if (out !== states.after.out) say(i, `after this line Python has printed ${states.after.out}, the walkthrough shows ${out}`);
        // Which names share one object must match Python's id()s.
        const names = Object.keys(step.vars).filter((k) => isCollection(step.vars[k]!));
        const authored = sharing(names, (a, b) => {
          const va = step.vars[a]!;
          const vb = step.vars[b]!;
          return isCollection(va) && isCollection(vb) && !!va.id && va.id === vb.id;
        });
        const real = sharing(names, (a, b) => after.ids?.[a] !== undefined && after.ids[a] === after.ids[b]);
        if (authored !== real) say(i, `names sharing one object: Python has [${real}], the walkthrough shows [${authored}]`);
        if ((step.frame || step.callers) && after.stack) {
          const mine = stackOf(step).map((f) => f.split(":")[0]).join(" > ");
          const theirs = (after.stack ?? []).map((f) => f.name).join(" > ");
          if (mine !== theirs) say(i, `call stack: Python has ${theirs}, the walkthrough shows ${mine}`);
          else if (stackOf(step).join("|") !== recordedStack(after).join("|") && stackOf(step).join("|") !== recordedStack(before).join("|")) {
            say(i, `frames' variables differ from Python: ${recordedStack(after).join(" | ")}`);
          }
        }
      } else {
        // Part-way through a line, each name shows its value from before or after the line
        // (pop() has removed the item, but `last` isn't assigned yet).
        const mixed = [...new Set([...Object.keys(step.vars), ...Object.keys(before.vars), ...Object.keys(after.vars)])].filter((name) => {
          const shown = step.vars[name] ? canonical(encodeValue(step.vars[name]!)) : undefined;
          const at = (e: RecordedEvent) => (name in e.vars ? canonical(e.vars[name]) : undefined);
          return shown !== at(before) && shown !== at(after);
        });
        if (mixed.length) say(i, `shows ${vars}, but Python has ${states.before.vars} before this line and ${states.after.vars} after it`);
        if (out !== states.before.out && out !== states.after.out) say(i, `shows printed output ${out}, which Python never has on this line`);
      }

      const calc = step.calc;
      if (calc?.tree) {
        for (const node of opNodes(calc.tree)) {
          const value = calc.done?.[node.id];
          if (value !== undefined) evals.push({ at: j, expr: node.code, expect: value, what: `step ${i + 1}: ${node.code}` });
        }
      }
      if (step.membership) {
        const m = step.membership;
        evals.push({ at: j, expr: `${pyItem(m.value)} in ${m.name}`, expect: m.result ? "True" : "False", what: `step ${i + 1}: ${pyItem(m.value)} in ${m.name}` });
      }
      if (calc && calc.phase !== "assign") {
        evals.push({ at: j, expr: calc.parts.map((p) => p.code).join(" "), expect: calc.result, what: `step ${i + 1}: ${calc.target}'s calculation` });
        for (const p of calc.parts) {
          if (p.value !== undefined && p.value !== p.code) evals.push({ at: j, expr: p.code, expect: p.value, what: `step ${i + 1}: the value of ${p.code}` });
        }
      }
      const prevResults = w.steps[i - 1]?.ifChain?.results ?? {};
      for (const [id, value] of Object.entries(step.ifChain?.results ?? {})) {
        const code = conditionCode.get(id);
        if (code && !(id in prevResults)) evals.push({ at: j, expr: code, expect: value ? "True" : "False", what: `step ${i + 1}: ${code}` });
      }
      const loop = step.whileLoop;
      const prevLoop = w.steps[i - 1]?.whileLoop;
      if (w.whileLoop && loop?.at === "check" && loop.result !== undefined && !(prevLoop?.at === "check" && prevLoop.checks === loop.checks)) {
        evals.push({ at: j, expr: w.whileLoop.condition, expect: loop.result ? "True" : "False", what: `step ${i + 1}: check ${loop.checks} of ${w.whileLoop.condition}` });
      }
    });
    next = j + 1;
  }
  return { problems, evals };
}
