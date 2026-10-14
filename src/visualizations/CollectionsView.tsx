import type { ReactNode } from "react";
import { isCollection, type PyItem, type PyValue } from "@/types/python";
import type { TraceStep } from "@/types/trace";
import { itemFocus, type WindowFocus } from "./collectionWindow";
import { SegmentedSequence, type CellState } from "./SegmentedSequence";
import { pyItem } from "./values";

type Shown = { names: string[]; value: PyValue };

/**
 * Every list, tuple, dict, set and string the program has at this event, each drawn once.
 * Names that refer to the same object (same `id`) are listed together on one object, so
 * `b = a` reads as two names and one list; a copy is a separate object. What the event does
 * (an index, a slice, a change, a membership test) is marked on the right object.
 */
export function CollectionsView({ step, previous, strings }: { step: TraceStep; previous?: TraceStep; strings?: Set<string> }) {
  const shown = groupByObject(step, strings);
  if (!shown.length) return <p className="text-sm text-muted-foreground">No lists, strings or other collections yet.</p>;
  return (
    <div className="flex flex-col gap-6">
      {shown.map(({ names, value }) => (
        <ObjectView key={names.join(",")} names={names} value={value} step={step} previous={previous} />
      ))}
    </div>
  );
}

/**
 * Strings are drawn here only when `strings` names them (the walkthrough indexes or slices
 * them); other strings stay in the Variables view, so a list demo isn't crowded by every
 * text value. Without `strings`, every string is drawn.
 */
function groupByObject(step: TraceStep, strings?: Set<string>): Shown[] {
  const groups: Shown[] = [];
  const byId = new Map<string, Shown>();
  for (const [name, value] of Object.entries(step.vars)) {
    if (!isCollection(value) && (value.type !== "str" || (strings && !strings.has(name)))) continue;
    const id = isCollection(value) ? value.id : undefined;
    const existing = id ? byId.get(id) : undefined;
    if (existing) {
      existing.names.push(name);
      continue;
    }
    const entry = { names: [name], value };
    groups.push(entry);
    if (id) byId.set(id, entry);
  }
  return groups;
}

function Names({ names, value }: { names: string[]; value: PyValue }) {
  return (
    <span className="flex flex-wrap items-center gap-1.5">
      {names.map((n) => (
        <span key={n} className="binding-name rounded-lg border-2 border-foreground/60 bg-background px-2 py-0.5 font-mono text-xs font-bold">
          {n}
        </span>
      ))}
      <span className="text-primary" aria-hidden>
        ⟶
      </span>
      <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
        {names.length > 1 ? `the same ${value.type} (${names.length} names, 1 object)` : value.type}
      </span>
    </span>
  );
}

function ObjectView({ names, value, step, previous }: { names: string[]; value: PyValue; step: TraceStep; previous?: TraceStep }) {
  const mine = (name: string | undefined) => !!name && names.includes(name);
  const mutation = mine(step.mutation?.name) ? step.mutation : undefined;
  const removed = mutation && (mutation.kind === "pop" || mutation.kind === "remove" || mutation.kind === "discard" || mutation.kind === "delete-key");
  const label = <Names names={names} value={value} />;
  let body: ReactNode = null;

  if (value.type === "list" || value.type === "tuple" || value.type === "str") {
    const items: PyItem[] = value.type === "str" ? [...value.value] : value.value;
    const n = items.length;
    const states: Record<number, CellState> = {};
    const notes: Record<number, string> = {};
    let focus: WindowFocus | undefined;
    let showNegative = false;
    let slice: { start: number; stop: number } | undefined;

    if (mine(step.element?.name) && step.element!.index !== undefined) {
      const index = step.element!.index;
      showNegative = index < 0;
      focus = itemFocus(n, index);
      if (focus) states[focus.lo] = "active";
    }
    let sliceCaption: string | undefined;
    if (mine(step.slice?.name)) {
      const { start, stop } = step.slice!;
      slice = { start, stop };
      for (let i = start; i < Math.min(stop, n); i++) states[i] = "selected";
      // Short notes fit under one cell; the caption says what they mean.
      notes[start] = "start";
      if (stop < n) notes[stop] = "stop";
      focus = { lo: start, hi: Math.min(stop, n - 1) };
      sliceCaption = `${names[0]}[${start}:${stop}]: from index ${start} (start: included) up to index ${stop} (stop: left out)${stop >= n ? ", which is past the end" : ""}`;
    }
    if (mutation && mutation.index !== undefined && !removed) {
      states[mutation.index] = mutation.kind === "set" ? "changed" : "added";
      notes[mutation.index] = mutation.kind === "set" && mutation.removed !== undefined ? `was ${pyItem(mutation.removed)}` : "new";
      focus = { lo: mutation.index, hi: mutation.index };
    }
    if (removed && mutation.index !== undefined) focus = itemFocus(n, Math.min(mutation.index, n - 1));

    body = (
      <SegmentedSequence
        label={label}
        items={items}
        strings={value.type === "str"}
        tone={value.type}
        states={states}
        notes={notes}
        focus={focus}
        slice={slice}
        showNegative={showNegative}
        caption={
          sliceCaption ?? (value.type === "tuple" ? "tuple: ordered, and can't be changed" : value.type === "str" ? "str: characters in order; can't be changed" : undefined)
        }
      />
    );
  } else if (value.type === "dict") {
    body = <DictView label={label} entries={value.value} activeKey={mine(step.element?.name) ? step.element!.key : undefined} mutation={mutation} />;
  } else if (value.type === "set") {
    const before = names.map((n) => previous?.vars[n]).find((v) => v?.type === "set");
    const adding = mutation?.kind === "add" ? mutation.value : undefined;
    const already = adding !== undefined && before?.type === "set" && before.value.includes(adding);
    body = (
      <SetView
        label={label}
        name={names[0]}
        items={value.value}
        membership={mine(step.membership?.name) ? step.membership : undefined}
        added={already ? undefined : adding}
        already={already ? adding : undefined}
      />
    );
  }

  // A method that hands back a value (pop) shows it separately, once it is stored.
  const call = step.call;
  const handedBack = call?.phase === "assign" && call.receiver && mine(call.receiver) && call.returns !== undefined && call.returns !== "None" ? call : undefined;
  return (
    <div className="flex min-w-0 flex-col items-start gap-1">
      {body}
      {removed && mutation && (
        <p className="removed-chip mt-1 inline-flex items-center gap-2 rounded-full border-2 border-dashed border-coral/60 bg-coral/8 px-3 py-1 text-xs font-bold">
          <span aria-hidden>↗</span> left the {value.type}:
          <span className="font-mono text-sm">
            {mutation.kind === "delete-key" ? pyItem(mutation.key ?? null) : pyItem(mutation.removed ?? mutation.value ?? null)}
          </span>
        </p>
      )}
      {handedBack && (
        <p className="returned-chip mt-1 inline-flex items-center gap-2 rounded-full border-2 border-dashed border-primary/60 px-3 py-1 text-xs font-bold">
          {handedBack.name}() returned <span className="font-mono text-sm">{handedBack.returns}</span>
          {handedBack.assignTo && <span>→ {handedBack.assignTo}</span>}
        </p>
      )}
    </div>
  );
}

/** A dict as key → value rows. The key being used and its value glow together. */
export function DictView({
  label,
  entries,
  activeKey,
  mutation,
}: {
  label?: ReactNode;
  entries: [PyItem, PyItem][];
  activeKey?: PyItem;
  mutation?: TraceStep["mutation"];
}) {
  return (
    <div className="dict flex flex-col gap-1.5">
      {label && <div className="seq-label">{label}</div>}
      <table className="dict-table">
        <caption className="sr-only">Keys and their values</caption>
        <tbody>
          {entries.map(([k, v]) => {
            const changed = mutation?.kind === "set-key" && mutation.key === k;
            const state = changed ? (mutation!.removed === undefined ? "added" : "changed") : activeKey !== undefined && activeKey === k ? "active" : "idle";
            return (
              <tr key={String(k)} data-state={state}>
                <th scope="row" className="dict-key">
                  {pyItem(k)}
                </th>
                <td className="dict-arrow" aria-hidden>
                  →
                </td>
                <td className="dict-value">
                  {pyItem(v)}
                  {changed && mutation!.removed !== undefined && <span className="seq-note static"> was {pyItem(mutation!.removed)}</span>}
                  {state !== "idle" && <span className="sr-only">, {state === "active" ? "looked up" : state}</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {!entries.length && <p className="seq-empty">empty dict</p>}
    </div>
  );
}

/** A set as a loose group of unique values: no positions, no guaranteed order. */
export function SetView({
  label,
  items,
  membership,
  added,
  already,
  name = "set",
}: {
  label?: ReactNode;
  items: PyItem[];
  membership?: TraceStep["membership"];
  added?: PyItem;
  /** A value added again: it was already there, so nothing changes. */
  already?: PyItem;
  name?: string;
}) {
  return (
    <div className="set flex flex-col gap-1.5">
      {label && <div className="seq-label">{label}</div>}
      <div className="set-box">
        {items.map((x) => (
          <span
            key={String(x)}
            className="set-item"
            data-state={(membership && membership.result && membership.value === x) || already === x ? "active" : added === x ? "added" : "idle"}
          >
            {pyItem(x)}
          </span>
        ))}
        {!items.length && <span className="seq-empty">empty set</span>}
      </div>
      <p className="seq-caption">set: each value once, in no guaranteed order</p>
      {already !== undefined && (
        <p className="seq-caption font-bold text-foreground">{pyItem(already)} is already in the set, so nothing changes.</p>
      )}
      {added !== undefined && <p className="seq-caption font-bold text-foreground">{pyItem(added)} is new, so it joins the set.</p>}
      {membership && (
        <p className="set-check inline-flex items-center gap-2 text-sm font-bold" data-result={String(membership.result)}>
          <span className="font-mono">
            {pyItem(membership.value)} in {name}
          </span>
          <span className="viz-result" data-result={String(membership.result)}>
            {membership.result ? "✓ True" : "✗ False"}
          </span>
        </p>
      )}
    </div>
  );
}
