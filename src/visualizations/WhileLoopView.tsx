import type { WhileLoopShape, WhileLoopTrace } from "@/types/trace";
import { DecisionNode, FlowEdge, LoopBack, LoopBranch, OperationNode } from "./FlowParts";

/**
 * A while loop as a flowchart built from the same parts as the for loop:
 *
 *   setup (count = 1)
 *   ◇ count <= 3 ?  —False→  after the loop
 *        │ True
 *   body lines …   ↺ back to the condition
 *
 * The condition is the centre of attention: it glows each time it's checked and shows the
 * real True / False result (including the final False). Body lines glow as they run.
 * Nothing moves between steps; only what glows changes.
 */
export function WhileLoopView({ shape, trace }: { shape: WhileLoopShape; trace?: WhileLoopTrace }) {
  const at = trace?.at;
  const result = trace?.result;
  const checking = at === "check";
  const inBody = at === "body";
  const exited = at === "exit";
  const resultLabel = result === undefined ? undefined : result ? "True" : "False";
  const lastLine = shape.body.length - 1;

  return (
    <div className="loop-while flex flex-col items-stretch gap-2" role="group" aria-label={`while loop: ${shape.condition}`}>
      {shape.setup?.map((line, i) => (
        <OperationNode key={i} code={line} caption={i === 0 ? "before the loop" : undefined} done={!!trace} />
      ))}
      <div className="loop-condition" data-on={checking || undefined}>
        <DecisionNode
          on={checking}
          caption={trace ? `check ${trace.checks}` : "condition"}
          answer={checking && resultLabel ? { text: resultLabel, positive: !!result } : undefined}
        >
          {shape.condition}?
        </DecisionNode>
      </div>
      <LoopBranch
        exit={exited || (checking && result === false)}
        back={<LoopBack on={inBody && (trace?.bodyLine === undefined || trace.bodyLine === lastLine)} label="back to the check" />}
      >
        <FlowEdge label="True: run the body" on={inBody || (checking && result === true)} />
        <div className="loop-body flex flex-col gap-1.5" data-on={inBody || undefined} data-skipped={exited || undefined}>
          {shape.body.map((line, i) => (
            <OperationNode
              key={i}
              code={line}
              caption={i === 0 ? "body" : undefined}
              on={inBody && (trace?.bodyLine === undefined || trace.bodyLine === i)}
            />
          ))}
        </div>
      </LoopBranch>
      <FlowEdge label="False: leave the loop" on={exited || (checking && result === false)} />
      <div className="viz-node loop-exit" data-on={exited || undefined}>
        <p className="viz-caption">after the loop</p>
        <p className="font-mono text-sm">{shape.after ?? "(the program ends)"}</p>
      </div>

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
