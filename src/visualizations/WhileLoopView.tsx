import { useMemo } from "react";
import type { WhileLoopShape, WhileLoopTrace } from "@/types/trace";
import { LoopDiagram, type LoopLooks } from "./loops/LoopDiagram";
import { layoutLoop, type LoopEdgeId } from "./loops/loopLayout";

/**
 * A while loop as a flowchart built from the same parts as the for loop and the if chain:
 *
 *   [ count = 1 ]
 *        │
 *   ◇ count <= 3? ──False──▶ after the loop
 *        │ True
 *   body lines …   ↺ back to the check
 *
 * The condition is the centre of attention: it glows each time it's checked and shows the
 * real True / False result (including the final False). Body lines glow as they run; lines
 * that ran on an earlier lap stay solid, the way Python left them.
 */
export function WhileLoopView({ shape, trace }: { shape: WhileLoopShape; trace?: WhileLoopTrace }) {
  const at = trace?.at;
  const result = trace?.result;
  const checking = at === "check";
  const inBody = at === "body";
  const exited = at === "exit";
  const resultLabel = result === undefined ? undefined : result ? "True" : "False";
  const after = shape.after ?? "(the program ends)";

  const layout = useMemo(
    () =>
      layoutLoop({
        setup: shape.setup,
        question: `${shape.condition}?`,
        yes: "True",
        no: "False",
        body: shape.body,
        after,
        backLabel: "check again",
      }),
    [shape, after],
  );

  const looks: LoopLooks = { nodes: {}, edges: {} };
  if (trace) {
    (shape.setup ?? []).forEach((_, i) => {
      looks.nodes[`setup-${i}`] = "done";
      if (i > 0) looks.edges[`setup-${i}`] = "done";
    });
    if (trace.checks > 1) {
      shape.body.forEach((_, i) => {
        looks.nodes[`body-${i}`] = "done";
      });
    }
  }
  if (checking) {
    looks.nodes.decision = result === undefined ? "lit" : result ? "true" : "false";
    looks.current = "decision";
    if (trace!.checks === 1) looks.edges.feed = "lit";
    else looks.edges.back = "lit";
  } else if (inBody) {
    const line = trace?.bodyLine ?? 0;
    looks.nodes.decision = "true";
    looks.nodes.frame = "lit";
    const into: LoopEdgeId = line === 0 ? "yes" : `body-${line}`;
    looks.edges[into] = "lit";
    if (line > 0) looks.edges.yes = "done";
    shape.body.forEach((_, i) => {
      if (i < line) looks.nodes[`body-${i}`] = "done";
    });
    looks.nodes[`body-${line}`] = "lit";
    looks.current = `body-${line}`;
  } else if (exited) {
    looks.nodes.decision = "false";
    looks.edges.exit = "lit";
    looks.edges.yes = "dim";
    looks.nodes.after = "lit";
    looks.current = "after";
  }

  return (
    <div className="loop-while" role="group" aria-label={`while loop: ${shape.condition}`} data-at={at ?? "start"}>
      <LoopDiagram
        layout={layout}
        looks={looks}
        setup={shape.setup}
        question={`${shape.condition}?`}
        questionCaption={trace ? `check ${trace.checks}` : undefined}
        answer={(checking || exited) && resultLabel ? { text: resultLabel, positive: !!result } : undefined}
        body={shape.body}
        after={after}
        label={`Flowchart of the while loop: repeat while ${shape.condition}`}
      />

      <p className="sr-only">
        {!trace
          ? `The loop hasn't started. It repeats while ${shape.condition}.`
          : checking
            ? `Check ${trace.checks}: ${shape.condition} is ${resultLabel ?? "being checked"}.`
            : inBody
              ? `Running the loop body after check ${trace.checks}${trace.bodyLine !== undefined ? `: ${shape.body[trace.bodyLine]}` : ""}.`
              : `${shape.condition} was False on check ${trace.checks}, so the loop has ended.`}
      </p>
    </div>
  );
}
