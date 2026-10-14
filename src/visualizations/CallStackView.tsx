import type { TraceStep } from "@/types/trace";
import { formatValue } from "./values";

const frameTitle = (name: string) => (name === "<module>" ? "main program" : `${name}()`);

/**
 * The call stack as cards: the running function on top, the functions waiting for it
 * underneath (the main program at the bottom). Each card shows only its own variables
 * (parameters and locals belong to their call), and a waiting card says which call it is
 * waiting on. A frame that just appeared is marked "new"; one that just finished shows the
 * value it handed back. It's a picture of who is waiting for whom, not of memory.
 */
export function CallStackView({ step, previous }: { step: TraceStep; previous?: TraceStep }) {
  const frames = [...(step.callers ?? []).map((c) => ({ ...c, active: false })), { name: step.frame ?? "<module>", vars: step.vars, calling: undefined, active: true }];
  const depth = frames.length;
  const previousDepth = previous ? (previous.callers?.length ?? 0) + 1 : depth;
  const finished = previous && previousDepth > depth ? (previous.frame ?? "<module>") : undefined;
  const returning = step.call?.phase === "result" && step.call.returns !== undefined && step.frame ? step.call.returns : undefined;

  return (
    <div className="stack flex flex-col gap-2" role="list" aria-label="Call stack, newest call first">
      {finished && (
        <p className="stack-finished text-xs font-semibold text-muted-foreground" role="listitem">
          {frameTitle(finished)} finished{step.call?.returns !== undefined ? ` and returned ${step.call.returns}` : ""}; its variables are gone.
        </p>
      )}
      {[...frames].reverse().map((frame, i) => {
        const isNew = frame.active && previousDepth < depth;
        return (
          <div key={`${depth - i}-${frame.name}`} role="listitem" className="viz-node stack-frame" data-on={frame.active || undefined}>
            <p className="flex flex-wrap items-center gap-2">
              <span className="font-mono font-bold">{frameTitle(frame.name)}</span>
              <span className="viz-caption">{frame.active ? (isNew ? "new call, running" : "running") : `waiting for ${frame.calling}`}</span>
            </p>
            <ul className="mt-1 flex flex-wrap gap-1.5">
              {Object.entries(frame.vars).map(([name, value]) => (
                <li key={name} className="stack-var rounded-lg border bg-background px-2 py-0.5 font-mono text-xs">
                  {name} = {formatValue(value)}
                </li>
              ))}
              {!Object.keys(frame.vars).length && <li className="text-xs text-muted-foreground">no variables yet</li>}
            </ul>
            {frame.active && returning && (
              <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-full border-2 border-dashed border-primary/60 px-2 py-0.5 text-xs font-bold">
                returns <span className="font-mono">{returning}</span> to {frameTitle(frames[frames.length - 2]?.name ?? "<module>")}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
