import type { CSSProperties } from "react";
import type { PyType, PyValue, Variables } from "@/types/python";
import { formatValue, typeStyle } from "./values";

/** What's happening to a name in the current event. */
export type BindingState = "idle" | "reading" | "changed";

const STATE_LABEL: Record<BindingState, string | undefined> = { idle: undefined, reading: "reading", changed: "changed" };

/**
 * A variable as Python sees it: a name that refers to a value. The name sits on the left,
 * the value (colored by its type) on the right, joined by an arrow.
 * - "reading": Python is looking up this name's value (it doesn't change).
 * - "changed": this event made the name refer to a new value; `was` shows the old one.
 * States are spelled out in a small label, not only shown by color.
 */
export function VariableBox({
  name,
  value,
  active,
  state = active ? "changed" : "idle",
  was,
}: {
  name: string;
  value: PyValue;
  /** Shorthand for state="changed" (the landing page uses it). */
  active?: boolean;
  state?: BindingState;
  /** The value this name referred to before the current event. */
  was?: PyValue;
}) {
  const st = typeStyle[value.type];
  const label = STATE_LABEL[state];
  return (
    <div
      className="var-box binding animate-pop inline-flex max-w-full flex-col gap-1 rounded-2xl border-2 bg-card px-2.5 py-2"
      data-state={state}
      data-active={state === "changed" || undefined}
      style={{ "--glow": `var(--t-${value.type})` } as CSSProperties}
    >
      <div className="flex min-w-0 items-center gap-2">
        <span className="binding-name shrink-0 rounded-lg border-2 border-foreground/60 bg-background px-2 py-0.5 font-mono text-xs font-bold text-foreground">
          {name}
        </span>
        <span className="binding-arrow shrink-0 text-primary" aria-hidden>
          ⟶
        </span>
        <span className={`binding-value inline-flex min-w-0 items-baseline gap-1.5 rounded-xl border-2 px-2 py-0.5 ${st.border} ${st.tint}`}>
          <span className={`truncate font-mono text-base font-bold leading-snug ${st.text}`}>{formatValue(value)}</span>
          <span className={`text-[10px] font-bold uppercase tracking-wider ${st.text}`}>{value.type}</span>
        </span>
      </div>
      {(label || was) && (
        <div className="flex flex-wrap items-center gap-2 pl-1 text-[11px] font-semibold text-muted-foreground">
          {label && <span className="binding-state rounded-full bg-muted px-2 py-px uppercase tracking-wide">{label}</span>}
          {was && (
            <span className="binding-was">
              was <span className="font-mono line-through decoration-2">{formatValue(was)}</span>
            </span>
          )}
        </div>
      )}
      <span className="sr-only">
        {`${name} refers to ${formatValue(value)}`}
        {state === "reading" ? ", being read" : ""}
        {was ? `, changed from ${formatValue(was)}` : state === "changed" ? ", just created" : ""}.
      </span>
    </div>
  );
}

const sameValue = (a: PyValue, b: PyValue) => a.type === b.type && formatValue(a) === formatValue(b);

/**
 * Every variable at one moment, in the order the program created them.
 * Pass the previous event's variables to show what changed ("was 13"), and the names the
 * current event reads, so a calculation's inputs are visible without changing anything.
 */
export function VariablesPanel({
  vars,
  highlight,
  previous,
  reading = [],
}: {
  vars: Variables;
  highlight?: string;
  previous?: Variables;
  reading?: string[];
}) {
  const entries = Object.entries(vars);
  if (!entries.length) {
    return <p className="text-sm text-muted-foreground">No variables yet. Step forward to watch them appear.</p>;
  }
  return (
    <div className="flex flex-wrap gap-3" role="list" aria-label="Variables">
      {entries.map(([name, value]) => {
        const before = previous?.[name];
        const changed = previous ? !before || !sameValue(before, value) : highlight === name;
        const state: BindingState = changed ? "changed" : reading.includes(name) ? "reading" : "idle";
        return (
          // Keyed by value so the binding pops again whenever its value changes.
          <div key={`${name}=${formatValue(value)}`} role="listitem" className="max-w-full">
            <VariableBox name={name} value={value} state={state} was={state === "changed" && before ? before : undefined} />
          </div>
        );
      })}
    </div>
  );
}

export function TypeLegend() {
  return (
    <div className="flex flex-wrap gap-1.5">
      {(Object.keys(typeStyle) as PyType[]).map((t) => (
        <span
          key={t}
          className={`rounded-full border px-2 py-px font-mono text-[11px] font-bold ${typeStyle[t].border} ${typeStyle[t].tint} ${typeStyle[t].text}`}
        >
          {t}
        </span>
      ))}
    </div>
  );
}
