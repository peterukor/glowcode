import { useId, useMemo } from "react";
import type { Variables } from "@/types/python";
import type { ForLoopShape, ForLoopTrace } from "@/types/trace";
import { collectionWindow } from "./collectionWindow";
import { CHAR_W } from "./flow/geometry";
import { LoopDiagram, type LoopLooks, type TravellingChip } from "./loops/LoopDiagram";
import { layoutLoop, type LoopEdgeId } from "./loops/loopLayout";
import { SequenceStrip } from "./loops/SequenceStrip";
import { fitIterable, LABEL_CHAR_W, stripCellCentre, stripSize, type StripTone } from "./loops/strip";
import type { CellState } from "./SegmentedSequence";
import { formatValue, pyItem } from "./values";

const KIND_CAPTION: Record<ForLoopShape["kind"], string> = {
  list: "A list: the loop takes its items in order.",
  tuple: "A tuple: the loop takes its items in order.",
  str: "A string: the loop takes one character at a time.",
  range: "range() makes each number only when the loop asks for the next one.",
  dict: "Looping over a dict gives its keys.",
  set: "A set has no guaranteed order; this is the order this run produced.",
  generator: "A generator makes each value only when asked, so later values aren't known yet.",
};

const TONE: Record<ForLoopShape["kind"], StripTone> = {
  list: "list",
  tuple: "tuple",
  str: "str",
  range: "neutral",
  dict: "neutral",
  set: "neutral",
  generator: "neutral",
};

/**
 * A `for` loop as a flowchart joined to its iterable:
 *
 *   iterable (segmented)
 *          │
 *   ◇ Next item available? ──No──▶ after the loop
 *          │ Yes
 *   [ number = 10 ]   ◀── the picked value travels here
 *          │
 *   body …  ↺ back to the question
 *
 * When Python asks for the next item, it lifts out of its cell and travels down to the
 * question; once assigned, it travels on into the loop variable. While the body runs it
 * settles back in its cell, and finished items fade with a tick. The collection never loses
 * an item. Everything is derived from the step, so Previous and Reset always match.
 */
export function ForLoopView({ shape, trace, vars }: { shape: ForLoopShape; trace?: ForLoopTrace; vars: Variables }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const n = shape.items.length;
  const at = trace?.at;
  const index = trace?.index ?? -1;
  const current = index >= 0 && index < n ? shape.items[index] : undefined;
  const produced = shape.kind === "range" || shape.kind === "generator";
  const strings = shape.kind === "str";
  const assigning = at === "assign";
  // A generator is asked for another value before anyone knows whether it has one.
  const asking = at === "next" && (index >= n || shape.kind === "generator");
  const answeredYes = (at === "next" && !asking) || (assigning && shape.kind === "generator");
  const show = (x: (typeof shape.items)[number]) => (strings ? `"${String(x)}"` : pyItem(x));
  const variable = vars[shape.target];

  const strip = stripSize(shape.items, strings, { label: true });
  const longest = Math.max(...shape.items.map((x) => show(x).length), 1);
  const layout = useMemo(
    () =>
      layoutLoop({
        header: { w: strip.w, h: strip.h },
        question: "Next item available?",
        yes: "Yes",
        no: "No",
        target: `${shape.target} = ${"x".repeat(longest + 1)}`,
        body: shape.body,
        after: shape.after ?? "(the program ends)",
        backLabel: "next item",
      }),
    [shape, strip.w, strip.h, longest],
  );

  // Item states in the iterable.
  const states: Record<number, CellState> = {};
  shape.items.forEach((_, i) => {
    if (!trace) states[i] = produced ? "pending" : "idle";
    else if (at === "exit" || i < index) states[i] = "visited";
    else if (i === index) states[i] = at === "body" ? "active" : at === "next" && shape.kind === "generator" ? "pending" : "raised";
    else states[i] = produced ? "pending" : "idle";
  });
  const focus = trace ? Math.min(index, n - 1) : undefined;

  // What glows.
  const looks: LoopLooks = { nodes: {}, edges: {} };
  if (index > 0 || at === "exit") {
    looks.nodes.target = "done";
    shape.body.forEach((_, i) => {
      looks.nodes[`body-${i}`] = "done";
    });
  }
  if (at === "next") {
    looks.nodes.decision = asking ? "lit" : "true";
    looks.current = "decision";
    looks.edges.feed = "lit";
    if (index > 0) looks.edges.back = "lit";
  } else if (assigning) {
    looks.nodes.decision = "true";
    looks.edges.yes = "lit";
    looks.nodes.target = "lit";
    looks.current = "target";
  } else if (at === "body") {
    const line = trace?.bodyLine ?? 0;
    looks.nodes.decision = "true";
    looks.edges.yes = "done";
    looks.nodes.target = "done";
    looks.nodes.frame = "lit";
    const into: LoopEdgeId = line === 0 ? "into-body" : `body-${line}`;
    looks.edges[into] = "lit";
    shape.body.forEach((_, i) => {
      if (i < line) looks.nodes[`body-${i}`] = "done";
    });
    looks.nodes[`body-${line}`] = "lit";
    looks.current = `body-${line}`;
  } else if (at === "exit") {
    looks.nodes.decision = "false";
    looks.edges.exit = "lit";
    looks.edges.yes = "dim";
    looks.nodes.after = "lit";
    looks.current = "after";
  }

  // The picked value travelling: from its cell to the question, then into the loop variable.
  const header = layout.header!;
  const win = collectionWindow(n, focus === undefined ? undefined : { lo: focus, hi: focus });
  const aboveQuestion = { x: layout.decision.x + layout.decision.w / 2, y: layout.decision.y - 26 };
  let chip: TravellingChip | undefined;
  if (at === "next" && !asking && current !== undefined) {
    const c = stripCellCentre(index, win.start, strip.cellW, { label: true });
    chip = { key: `next-${index}`, text: show(current), from: { x: header.x + c.x, y: header.y + c.y }, to: aboveQuestion };
  } else if (assigning && current !== undefined && layout.target) {
    const text = show(current);
    const slotX = layout.target.x + 16 + (shape.target.length + 3) * CHAR_W + (text.length * CHAR_W + 22) / 2 - 2;
    const from = shape.kind === "generator" ? { x: aboveQuestion.x, y: layout.decision.y + layout.decision.h / 2 } : aboveQuestion;
    chip = { key: `assign-${index}`, text, from, to: { x: slotX, y: layout.target.y + 37 } };
  }

  const targetValue = assigning ? "" : variable ? formatValue(variable) : "?";
  // The label is centred over the strip; shorten a long iterable so it isn't cut off at the
  // diagram's edges (e.g. a 20-item list literal).
  const labelRoom = Math.floor((2 * Math.min(header.x + header.w / 2, layout.width - header.x - header.w / 2) - 16) / LABEL_CHAR_W);
  const iterableText = fitIterable(shape.iterable, labelRoom - `for ${shape.target} in `.length);
  const label = (
    <>
      <tspan className="strip-kw">for</tspan> {shape.target} <tspan className="strip-kw">in</tspan> {iterableText}
    </>
  );

  return (
    <div className="loop-for" role="group" aria-label={`for loop over ${shape.iterable}`} data-at={at ?? "start"}>
      <LoopDiagram
        layout={layout}
        looks={looks}
        header={
          <SequenceStrip
            id={uid}
            items={shape.items}
            strings={strings}
            states={states}
            focus={focus === undefined ? undefined : { lo: focus, hi: focus }}
            label={label}
            tone={TONE[shape.kind]}
            showIndexes={shape.kind === "list" || shape.kind === "tuple" || strings}
          />
        }
        question="Next item available?"
        questionCaption={asking ? (shape.kind === "generator" ? "asking the generator…" : "asking for one more…") : undefined}
        answer={answeredYes ? { text: "Yes", positive: true } : at === "exit" ? { text: "No", positive: false } : undefined}
        target={{ caption: "loop variable", content: `${shape.target} = ${targetValue}` }}
        body={shape.body}
        after={shape.after ?? "(the program ends)"}
        chip={chip}
        label={`Flowchart of the for loop over ${shape.iterable}`}
      />
      <p className="viz-caption-line">{KIND_CAPTION[shape.kind]}</p>

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
