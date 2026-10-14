import type { CallEvent } from "@/types/trace";

const ORDER: Record<CallEvent["phase"], number> = { call: 0, run: 1, result: 2, assign: 3 };

/**
 * A call drawn top to bottom: inputs → function → what comes out → (where it's stored).
 * The diagram keeps the same shape for every phase of one call; parts light up as the
 * call progresses, and results stay as "?" until Python has produced them.
 *
 * What comes out is split into separate slots on purpose:
 *   Returns  – the value handed back to the code that called it
 *   Prints   – text shown on the screen
 *   Changes  – an object the call modified (like a list after append)
 */
export function FunctionView({ call }: { call: CallEvent }) {
  const at = ORDER[call.phase];
  const done = at >= ORDER.result;
  const label = `${call.receiver ? `${call.receiver}.` : ""}${call.name}()`;

  return (
    <div className="fn flex flex-col items-center gap-1.5" role="group" aria-label={`Function call: ${label}`}>
      <div className="fn-node" data-on={at === 0 || undefined}>
        <p className="fn-caption">{inputCaption(call)}</p>
        <p className="flex flex-wrap justify-center gap-x-3 gap-y-1 font-mono font-bold">
          {call.receiver && (
            <span>
              {call.receiver}
              {call.receiverValue && <span className="font-normal text-muted-foreground"> = {call.receiverValue}</span>}
            </span>
          )}
          {call.args.map((a, i) => (
            <span key={i} className="inline-flex flex-col items-center">
              {/* Parameters are separate names, so each pairing gets its own box. */}
              <span className={call.params ? "rounded-lg border-2 border-border bg-background px-2" : undefined}>
                {call.params?.[i] && <span className="font-normal text-muted-foreground">{call.params[i]} = </span>}
                {a}
              </span>
              {call.argFrom?.[i] && <span className="fn-caption normal-case tracking-normal">returned by {call.argFrom[i]}</span>}
            </span>
          ))}
          {!call.receiver && !call.args.length && <span className="text-muted-foreground">nothing</span>}
        </p>
      </div>

      <Arrow on={at <= 1} />

      <div className="fn-node fn-function" data-on={at <= 1 || undefined}>
        <p className="font-mono text-lg font-extrabold">
          <span aria-hidden>⚙ </span>
          {label}
        </p>
        {call.phase === "run" && <p className="fn-caption">running…</p>}
      </div>

      <Arrow on={at === 2} />

      <div className="flex flex-wrap justify-center gap-2">
        {call.returns !== undefined && (
          <Slot kind="returns" title="Returns" hint="handed back" value={call.returns} shown={done} on={at === 2 || (at === 3 && !!call.assignTo)} />
        )}
        {call.prints && <Slot kind="prints" title="Prints" hint="on screen" value={call.prints.join("\n")} shown={done} on={at === 2} />}
        {call.changes !== undefined && (
          <Slot kind="changes" title="Changes" hint={call.receiver ?? "its object"} value={call.changes} shown={done} on={at === 2} />
        )}
      </div>

      {call.feeds && (
        <>
          <Arrow on={at === 2} />
          <div className="fn-node fn-feeds" data-on={at === 2 || undefined}>
            <p className="fn-caption">{done ? "the returned value goes into" : "its result will go into"}</p>
            <p className="font-mono font-bold">{call.feeds}</p>
          </div>
        </>
      )}

      {call.assignTo && (
        <>
          <Arrow on={at === 3} />
          <div className="fn-node" data-on={at === 3 || undefined}>
            <p className="fn-caption">{at === 3 ? "now refers to the returned value" : "will store the returned value"}</p>
            <p className="font-mono font-bold">
              {call.assignTo}
              {at === 3 && call.returns !== undefined && <span className="font-normal text-muted-foreground"> → {call.returns}</span>}
            </p>
          </div>
        </>
      )}

      <p className="sr-only">{describe(call, label, done)}</p>
    </div>
  );
}

function inputCaption(call: CallEvent) {
  if (call.receiver) return call.args.length ? "Called on, with" : "Called on";
  if (call.params?.length) return call.args.length === 1 ? "Argument → parameter" : "Arguments → parameters";
  return call.args.length === 1 ? "Input" : "Inputs";
}

function Arrow({ on }: { on: boolean }) {
  return (
    <span className="fn-arrow" data-on={on || undefined} aria-hidden>
      ↓
    </span>
  );
}

function Slot({ kind, title, hint, value, shown, on }: { kind: string; title: string; hint: string; value: string; shown: boolean; on: boolean }) {
  return (
    <div className={`fn-slot fn-slot-${kind}`} data-on={on || undefined}>
      <p className="fn-caption">
        {title} <span className="font-normal normal-case tracking-normal">({hint})</span>
      </p>
      <p className="whitespace-pre font-mono font-bold">{shown ? value : "?"}</p>
    </div>
  );
}

function describe(call: CallEvent, label: string, done: boolean) {
  const inputs = [call.receiver, ...call.args].filter(Boolean).join(", ") || "nothing";
  if (!done) return `${label} is called with ${inputs}.`;
  const parts = [
    call.returns !== undefined && `returns ${call.returns}`,
    call.prints && `prints ${call.prints.join(", ")}`,
    call.changes !== undefined && `changes ${call.receiver ?? "its object"} to ${call.changes}`,
  ].filter(Boolean);
  const stored = call.phase === "assign" && call.assignTo ? ` ${call.assignTo} now refers to ${call.returns}.` : "";
  const feeds = call.feeds ? ` The returned value becomes the argument of ${call.feeds}.` : "";
  return `${label} with ${inputs} ${parts.join(" and ")}.${stored}${feeds}`;
}
