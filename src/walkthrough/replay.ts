/**
 * Compares a hand-written walkthrough with what Python actually did, event by event.
 *
 * `scripts/check-python.ts` runs the program under a line tracer and passes the recorded
 * events here. Each recorded event is the state *before* a line runs; the state after it is
 * the next event's. Consecutive walkthrough steps on the same line ("a visit") are matched to
 * the next recorded event for that line, in order, so loop laps and skipped branches have to
 * line up exactly. Then:
 * - the last step of a visit must show the state after the line (variables and output);
 * - earlier steps of a visit (reading, calculating, a call before it returns) may show the
 *   state before or after the line, but nothing else;
 * - calculations, their operand values, and every comparison or while-condition the
 *   walkthrough says Python evaluated are sent back to Python to evaluate (`evals`).
 *
 * Pure logic, no Python: easy to test, and the same comparison a future tracer can use.
 */
import type { Condition } from "@/types/conditional";
import type { PyValue } from "@/types/python";
import type { TraceStep, Walkthrough } from "@/types/trace";

/** A line event recorded by the tracer: globals (simple values only) and printed text so far. */
export type RecordedEvent = { line: number | null; vars: Record<string, unknown>; out: string };

/** Ask Python: does `expr`, evaluated with the variables of event `at`, equal `expect`? */
export type EvalRequest = { at: number; expr: string; expect: string; what: string };

const toJson = (v: PyValue) => (v.type === "None" ? null : v.value);

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

const varsOf = (step: TraceStep) => canonical(Object.fromEntries(Object.entries(step.vars).map(([k, v]) => [k, toJson(v)])));
const outOf = (step: TraceStep) => JSON.stringify(step.output ?? []);
const eventOut = (e: RecordedEvent) => JSON.stringify(e.out ? e.out.replace(/\n$/, "").split("\n") : []);

function compares(c: Condition): { id: string; code: string }[] {
  return c.kind === "compare" ? [c] : c.operands.flatMap(compares);
}

/** True when the walkthrough's code can be replayed line by line at module level. */
export function replayable(w: Walkthrough): boolean {
  return !/^\s*(def|class|async|import|from)\b/m.test(w.code) && !/\binput\s*\(/.test(w.code);
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
    const after = events[j + 1] ?? before;
    const states = { before: { vars: canonical(before.vars), out: eventOut(before) }, after: { vars: canonical(after.vars), out: eventOut(after) } };

    visit.forEach((i, n) => {
      const step = w.steps[i]!;
      const vars = varsOf(step);
      const out = outOf(step);
      const isLast = n === visit.length - 1;
      if (isLast) {
        if (vars !== states.after.vars) say(i, `after this line Python has ${states.after.vars}, the walkthrough shows ${vars}`);
        if (out !== states.after.out) say(i, `after this line Python has printed ${states.after.out}, the walkthrough shows ${out}`);
      } else {
        if (vars !== states.before.vars && vars !== states.after.vars) say(i, `shows ${vars}, but Python has ${states.before.vars} before this line and ${states.after.vars} after it`);
        if (out !== states.before.out && out !== states.after.out) say(i, `shows printed output ${out}, which Python never has on this line`);
      }

      const calc = step.calc;
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
