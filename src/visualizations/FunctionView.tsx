/** 0 = not called yet, 1 = argument goes in, 2 = body runs, 3 = value comes back. */
export type FunctionStage = 0 | 1 | 2 | 3;

/** A function call as input → body → return value. */
export function FunctionView({ name, input, output, stage }: { name: string; input: string; output: string; stage: FunctionStage }) {
  const box = (on: boolean) =>
    `rounded-2xl border-2 p-3 text-center transition-all ${on ? "scale-105 border-primary bg-primary/10" : "border-border bg-card"}`;
  return (
    <div className="grid grid-cols-[1fr_auto_1.3fr_auto_1fr] items-center gap-2">
      <div className={box(stage === 1)}>
        <div className="text-xs font-bold uppercase text-muted-foreground">input</div>
        <div className="font-mono text-t-str">{stage >= 1 ? input : "—"}</div>
      </div>
      <span className="text-2xl text-primary">→</span>
      <div className={box(stage === 2)}>
        <div className="font-display text-lg font-bold">⚙️ {name}()</div>
        <div className="text-xs text-muted-foreground">runs the body</div>
      </div>
      <span className="text-2xl text-primary">→</span>
      <div className={box(stage === 3)}>
        <div className="text-xs font-bold uppercase text-muted-foreground">return</div>
        <div className="font-mono text-t-str">{stage >= 3 ? output : "—"}</div>
      </div>
    </div>
  );
}
