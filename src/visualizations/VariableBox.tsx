import type { CSSProperties } from "react";
import { isCollection, type PyType, type PyValue, type Variables } from "@/types/python";
import { formatValue, typeStyle } from "./values";

/** What's happening to a name in the current event. */
export type BindingState = "idle" | "reading" | "changed" | "mutated";

const STATE_LABEL: Record<BindingState, string | undefined> = {
  idle: undefined,
  reading: "reading",
  changed: "changed",
  mutated: "changed in place",
};

/**
 * A variable as Python sees it: a name that refers to a value. The name sits on the left,
 * the value (colored by its type) on the right, joined by an arrow.
 * - "reading": Python is looking up this name's value (it doesn't change).
 * - "changed": this event made the name refer to a new value; `was` shows the old one.
 * - "mutated": the name still refers to the same object, but the object itself changed
 *   (`items.append(...)`): no rebinding happened, so there's no "was".
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
        {state === "reading" ? ", being read" : state === "mutated" ? ", the same object, changed in place" : ""}
        {was ? `, changed from ${formatValue(was)}` : state === "changed" ? ", just created" : ""}.
      </span>
    </div>
  );
}

const sameValue = (a: PyValue, b: PyValue) => a.type === b.type && formatValue(a) === formatValue(b);
const objectId = (v: PyValue | undefined) => (v && isCollection(v) ? v.id : undefined);

function bindingState(name: string, value: PyValue, previous: Variables | undefined, highlight: string | undefined, reading: string[]): BindingState {
  const before = previous?.[name];
  if (!previous) return highlight === name ? "changed" : reading.includes(name) ? "reading" : "idle";
  if (!before) return "changed";
  if (sameValue(before, value)) return reading.includes(name) ? "reading" : "idle";
  // Same object, different contents: changed in place, not rebound.
  return objectId(before) !== undefined && objectId(before) === objectId(value) ? "mutated" : "changed";
}

/**
 * Every variable at one moment, in the order the program created them.
 * Pass the previous event's variables to show what changed ("was 13"), and the names the
 * current event reads, so a calculation's inputs are visible without changing anything.
 * Names that refer to the same object (same `id`) are drawn pointing at one shared value.
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
  // Group names by the object they refer to; most groups have one name.
  const groups: [string, PyValue][][] = [];
  const byId = new Map<string, [string, PyValue][]>();
  for (const entry of entries) {
    const id = objectId(entry[1]);
    const group = id ? byId.get(id) : undefined;
    if (group) group.push(entry);
    else {
      const fresh = [entry];
      groups.push(fresh);
      if (id) byId.set(id, fresh);
    }
  }
  return (
    <div className="flex flex-wrap gap-3" role="list" aria-label="Variables">
      {groups.map((group) => {
        const [name, value] = group[0]!;
        if (group.length > 1) return <SharedBinding key={group.map(([n]) => n).join(",")} group={group} previous={previous} highlight={highlight} reading={reading} />;
        const state = bindingState(name, value, previous, highlight, reading);
        const before = previous?.[name];
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

/** Several names referring to one object: each name points at the same value. */
function SharedBinding({
  group,
  previous,
  highlight,
  reading,
}: {
  group: [string, PyValue][];
  previous?: Variables;
  highlight?: string;
  reading: string[];
}) {
  const value = group[0]![1];
  const st = typeStyle[value.type];
  const states = group.map(([n, v]) => bindingState(n, v, previous, highlight, reading));
  const mutated = states.includes("mutated");
  return (
    <div role="listitem" className="var-box binding binding-shared animate-pop flex max-w-full items-center gap-2 rounded-2xl border-2 bg-card px-2.5 py-2" data-state={mutated ? "mutated" : states.includes("changed") ? "changed" : "idle"}>
      <div className="flex flex-col gap-1">
        {group.map(([n], i) => (
          <span key={n} className="flex items-center gap-1.5">
            <span className="binding-name rounded-lg border-2 border-foreground/60 bg-background px-2 py-0.5 font-mono text-xs font-bold">{n}</span>
            {states[i] === "changed" && <span className="binding-state rounded-full bg-muted px-1.5 py-px text-[10px] font-bold uppercase">new name</span>}
          </span>
        ))}
      </div>
      <span className="binding-arrow text-xl text-primary" aria-hidden>
        ⟶
      </span>
      <div className="flex flex-col gap-1">
        <span className={`binding-value inline-flex items-baseline gap-1.5 rounded-xl border-2 px-2 py-0.5 ${st.border} ${st.tint}`}>
          <span className={`font-mono text-base font-bold ${st.text}`}>{formatValue(value)}</span>
          <span className={`text-[10px] font-bold uppercase tracking-wider ${st.text}`}>{value.type}</span>
        </span>
        <span className="text-[11px] font-semibold text-muted-foreground">
          one object, {group.length} names{mutated ? " · changed in place" : ""}
        </span>
      </div>
      <span className="sr-only">
        {group.map(([n]) => n).join(" and ")} refer to the same {value.type} object, {formatValue(value)}
        {mutated ? ", which was just changed in place" : ""}.
      </span>
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
