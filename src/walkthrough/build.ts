/**
 * Helpers for writing walkthroughs by hand without repeating what can be derived.
 *
 * Every TraceStep holds the complete state after the event (all variables, everything printed
 * so far). That's what renderers and a future tracer use, but it's tedious and error-prone to
 * type. `buildSteps` lets each event say only what changed:
 *
 *   buildSteps([
 *     { line: 1, set: { count: py.int(3) }, note: "count refers to 3." },
 *     { line: 2, calc: { ..., phase: "calculate" }, note: "…" },
 *     { line: 2, set: { count: py.int(5) }, calc: { ..., phase: "assign" }, note: "…" },
 *     { line: 3, print: ["5"], note: "…" },
 *   ])
 *
 * The result is ordinary TraceStep data, validated and checked against Python like any other.
 */
import type { PyValue, Variables } from "@/types/python";
import type { TraceStep } from "@/types/trace";

/** Python values, as the trace format stores them. */
export const py = {
  int: (value: number): PyValue => ({ type: "int", value }),
  float: (value: number): PyValue => ({ type: "float", value }),
  str: (value: string): PyValue => ({ type: "str", value }),
  bool: (value: boolean): PyValue => ({ type: "bool", value }),
  list: (value: (string | number)[]): PyValue => ({ type: "list", value }),
  none: (): PyValue => ({ type: "None", value: null }),
};

export type StepInput = Omit<TraceStep, "vars" | "output"> & {
  /** Variables this event creates or changes. The rest carry over from the previous event. */
  set?: Variables;
  /** Variables that stop existing (e.g. a function's locals once it returns). */
  unset?: string[];
  /** Lines this event prints. Defaults to the call's `prints` when a call shows its result. */
  print?: string[];
};

export function buildSteps(inputs: StepInput[]): TraceStep[] {
  let vars: Variables = {};
  let output: string[] = [];
  return inputs.map(({ set, unset, print, ...event }) => {
    vars = { ...vars, ...set };
    if (unset?.length) vars = Object.fromEntries(Object.entries(vars).filter(([name]) => !unset.includes(name)));
    const printed = print ?? (event.call?.phase === "result" ? event.call.prints : undefined) ?? [];
    output = [...output, ...printed];
    const changed = Object.keys(set ?? {});
    return {
      ...event,
      vars,
      ...(output.length ? { output } : {}),
      // The one variable an event changes is the one to emphasise, unless the author says otherwise.
      ...(event.highlight === undefined && changed.length === 1 ? { highlight: changed[0] } : {}),
    };
  });
}
