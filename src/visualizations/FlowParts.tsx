import type { ReactNode } from "react";

/**
 * Shared flowchart pieces for loop diagrams, so `for` and `while` follow one convention:
 * a decision diamond, labelled edges that glow when taken, a loop-back arrow and boxes for
 * operations. Every state has words as well as a glow.
 */

/** A decision: a diamond with the question, and its answer once Python has one. */
export function DecisionNode({
  children,
  on,
  answer,
  caption,
}: {
  children: ReactNode;
  on?: boolean;
  /** The answer, once known: e.g. "True" / "False" or "Yes" / "No". */
  answer?: { text: string; positive: boolean };
  caption?: string;
}) {
  return (
    <div className="viz-decision-wrap">
      <div className="viz-decision" data-on={on || undefined}>
        <div className="viz-decision-text">
          {caption && <p className="viz-caption">{caption}</p>}
          <p className="font-mono text-sm font-bold">{children}</p>
        </div>
      </div>
      {answer && (
        <span className="viz-result viz-decision-answer" data-result={answer.positive ? "true" : "false"}>
          {answer.positive ? "✓" : "✗"} {answer.text}
        </span>
      )}
    </div>
  );
}

/** An edge between flowchart parts, labelled with when it's taken. */
export function FlowEdge({ label, on, direction = "down", children }: { label?: string; on?: boolean; direction?: "down" | "right"; children?: ReactNode }) {
  return (
    <div className="viz-edge" data-on={on || undefined} data-direction={direction}>
      <span aria-hidden>{direction === "down" ? "↓" : "→"}</span>
      {label && ` ${label}`}
      {children}
    </div>
  );
}

/**
 * The "yes / True" branch of a loop: everything that runs when the answer is yes, with the
 * loop-back arrow on its right. Its left edge is the other way out of the decision (the "no"
 * path), drawn as a line that runs past the branch down to the exit, and glows when taken.
 */
export function LoopBranch({ children, back, exit }: { children: ReactNode; back: ReactNode; exit?: boolean }) {
  return (
    <div className="flow-branch" data-exit={exit || undefined}>
      <div className="flex items-stretch gap-3">
        <div className="flex min-w-0 flex-1 flex-col items-stretch gap-2">{children}</div>
        {back}
      </div>
    </div>
  );
}

/** The arrow from the end of a loop body back to its decision. */
export function LoopBack({ on, label }: { on?: boolean; label: string }) {
  return (
    <div className="viz-edge viz-edge-back" data-on={on || undefined} aria-hidden>
      <span>↺</span>
      <span className="[writing-mode:vertical-rl]">{label}</span>
    </div>
  );
}

/** One operation box: a line of code that runs at some point. */
export function OperationNode({ code, on, done, caption }: { code: string; on?: boolean; done?: boolean; caption?: string }) {
  return (
    <div className="viz-node viz-op" data-on={on || undefined} data-done={done || undefined}>
      {caption && <p className="viz-caption">{caption}</p>}
      <p className="font-mono text-sm">{code}</p>
    </div>
  );
}
