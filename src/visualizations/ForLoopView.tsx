import type { Variables } from "@/types/python";
import type { ForLoopShape, ForLoopTrace } from "@/types/trace";
import { DecisionNode, FlowEdge, LoopBack, LoopBranch, OperationNode } from "./FlowParts";
import { SegmentedSequence, type CellState } from "./SegmentedSequence";
import { formatValue, pyItem } from "./values";

const KIND_CAPTION: Record<ForLoopShape["kind"], string> = {
  list: "a list: the loop takes its items in order",
  tuple: "a tuple: the loop takes its items in order",
  str: "a string: the loop takes one character at a time",
  range: "range makes each number only when the loop asks for the next one",
  dict: "looping over a dict gives its keys",
  set: "a set has no guaranteed order; this is the order this run produced",
  generator: "a generator makes each value only when asked, so later values aren't known yet",
};

/**
 * A `for` loop as a flowchart joined to its iterable:
 *
 *   iterable (segmented)  →  Next item available?  —No→  after the loop
 *                                  │ Yes
 *                         number = <item>
 *                                  │
 *                               body ...  ↺ back to "Next item available?"
 *
 * The current item rises out of its cell and glows when Python takes it ("next"), a copy of
 * its value travels to the loop variable ("assign"), then it settles back into place while the
 * body runs. Earlier items are marked done; the collection itself never loses an item.
 * Everything is derived from the step, so Previous and Reset always show the right state.
 */
export function ForLoopView({ shape, trace, vars }: { shape: ForLoopShape; trace?: ForLoopTrace; vars: Variables }) {
  const n = shape.items.length;
  const at = trace?.at;
  const index = trace?.index ?? -1;
  const current = index >= 0 && index < n ? shape.items[index] : undefined;
  const produced = shape.kind === "range" || shape.kind === "generator";

  const states: Record<number, CellState> = {};
  shape.items.forEach((_, i) => {
    if (!trace) states[i] = produced ? "pending" : "idle";
    else if (at === "exit" || i < index) states[i] = "visited";
    // A generator's value isn't known until it has produced it (at "assign").
    else if (i === index) states[i] = at === "body" ? "active" : at === "next" && shape.kind === "generator" ? "pending" : "raised";
    else states[i] = produced ? "pending" : "idle";
  });

  const variable = vars[shape.target];
  const assigning = at === "assign";
  const comingBack = at === "next" && index > 0;
  // A generator is asked for another value before anyone knows whether it has one.
  // For a generator that's every time: the answer only comes when it yields (or finishes).
  const asking = at === "next" && (index >= n || shape.kind === "generator");
  const answeredYes = (at === "next" && !asking) || (assigning && shape.kind === "generator");

  return (
    <div className="loop-for flex flex-col gap-2" role="group" aria-label={`for loop over ${shape.iterable}`}>
      <SegmentedSequence
        label={
          <span>
            <span className="text-syn-kw">for</span> {shape.target} <span className="text-syn-kw">in</span> {shape.iterable}
          </span>
        }
        items={shape.items}
        strings={shape.kind === "str"}
        tone={shape.kind === "tuple" ? "tuple" : shape.kind === "str" ? "str" : produced || shape.kind === "set" || shape.kind === "dict" ? "neutral" : "list"}
        states={states}
        focus={trace ? { lo: Math.min(index, n - 1), hi: Math.min(index, n - 1) } : undefined}
        showIndexes={shape.kind === "list" || shape.kind === "tuple" || shape.kind === "str"}
        caption={KIND_CAPTION[shape.kind]}
      />

      <DecisionNode
        on={at === "next" || at === "exit"}
        caption={asking ? (shape.kind === "generator" ? "asking the generator…" : "asking for one more…") : undefined}
        answer={answeredYes ? { text: "Yes", positive: true } : at === "exit" ? { text: "No", positive: false } : undefined}
      >
        Next item available?
      </DecisionNode>
      <LoopBranch exit={at === "exit"} back={<LoopBack on={comingBack} label="back for the next item" />}>
        <FlowEdge label="Yes: take it" on={(at === "next" && !asking) || assigning}>
          {/* The picked value on its way to the loop variable (a copy: the item stays in place). */}
          {assigning && current !== undefined && (
            <span key={index} className="for-transfer-chip" aria-hidden>
              {shape.kind === "str" ? `"${String(current)}"` : pyItem(current)} <span className="font-sans text-[11px]">→ {shape.target}</span>
            </span>
          )}
        </FlowEdge>
        <div className="viz-node for-target" data-on={assigning || undefined}>
          <p className="viz-caption">loop variable</p>
          <p className="font-mono font-bold">
            {shape.target} = {assigning && current !== undefined ? (shape.kind === "str" ? `"${String(current)}"` : pyItem(current)) : variable ? formatValue(variable) : "?"}
          </p>
        </div>
        <FlowEdge on={at === "body"} />
        <div className="flex flex-col gap-1.5">
          {shape.body.map((line, i) => (
            <OperationNode key={i} code={line} caption={i === 0 ? "body" : undefined} on={at === "body" && (trace?.bodyLine ?? 0) === i} />
          ))}
        </div>
      </LoopBranch>

      <FlowEdge label="No items left: leave the loop" on={at === "exit"} />
      <div className="viz-node loop-exit" data-on={at === "exit" || undefined}>
        <p className="viz-caption">after the loop</p>
        <p className="font-mono text-sm">{shape.after ?? "(the program ends)"}</p>
      </div>

      <p className="sr-only">
        {!trace
          ? `The loop hasn't started. It will take items from ${shape.iterable} one at a time.`
          : at === "next"
            ? asking
              ? "Python asks for the next value; the answer isn't known until the generator yields one or finishes."
              : `Next item available? Yes: item ${index + 1} of ${n}, ${pyItem(current ?? null)}, is picked.`
            : at === "assign"
              ? `${shape.target} now refers to ${pyItem(current ?? null)}.`
              : at === "body"
                ? `Running the loop body with ${shape.target} = ${pyItem(current ?? null)}.`
                : `No items left after ${n}, so the loop ends.`}
      </p>
    </div>
  );
}
