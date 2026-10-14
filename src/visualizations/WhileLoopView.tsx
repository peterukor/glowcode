import type { WhileLoopShape, WhileLoopTrace } from "@/types/trace";

/**
 * A while loop drawn as a fixed structure: the condition, the body it runs while True,
 * the arrow back to the condition, and the way out when it's False. Nothing moves between
 * steps; the current part glows, and the condition's result appears only once Python has
 * checked it. Before the loop starts (no trace yet) everything is shown idle.
 */
export function WhileLoopView({ shape, trace }: { shape: WhileLoopShape; trace?: WhileLoopTrace }) {
  const at = trace?.at;
  const result = trace?.result;
  const checking = at === "check";
  const inBody = at === "body";
  const exited = at === "exit";
  const resultLabel = result === undefined ? undefined : result ? "True" : "False";

  return (
    <div className="loop-while flex flex-col items-stretch gap-2" role="group" aria-label={`while loop: ${shape.condition}`}>
      <div className="flex items-stretch gap-3">
        <div className="flex flex-1 flex-col items-stretch gap-2">
          {/* The condition */}
          <div className="viz-node loop-condition" data-on={checking || undefined}>
            <p className="viz-caption">{trace ? `check ${trace.checks}` : "condition"}</p>
            <p className="flex flex-wrap items-center justify-between gap-2 font-mono font-bold">
              <span>
                <span className="text-syn-kw">while</span> {shape.condition}
              </span>
              {resultLabel && (
                <span className="viz-result" data-result={resultLabel.toLowerCase()}>
                  {result ? "✓" : "✗"} {resultLabel}
                </span>
              )}
            </p>
          </div>

          {/* True → body */}
          <p className="viz-edge" data-on={(inBody || (checking && result === true)) || undefined}>
            <span aria-hidden>↓</span> True: run the body
          </p>
          <div className="viz-node loop-body" data-on={inBody || undefined} data-skipped={exited || undefined}>
            <p className="viz-caption">body</p>
            {shape.body.map((line, i) => (
              <p key={i} className="font-mono text-sm">
                {line}
              </p>
            ))}
          </div>
        </div>

        {/* The way back up */}
        <div className="viz-edge viz-edge-back" data-on={inBody || undefined} aria-hidden>
          <span>↺</span>
          <span className="[writing-mode:vertical-rl]">back to the check</span>
        </div>
      </div>

      {/* False → out */}
      <p className="viz-edge" data-on={(exited || (checking && result === false)) || undefined}>
        <span aria-hidden>↓</span> False: leave the loop
      </p>
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
              ? `Running the loop body after check ${trace.checks}.`
              : `${shape.condition} was False on check ${trace.checks}, so the loop has ended.`}
      </p>
    </div>
  );
}
