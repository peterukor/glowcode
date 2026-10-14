import { useId, type CSSProperties, type ReactNode } from "react";
import { useOverflows } from "@/hooks/useOverflows";
import { isCollection, type PyItem, type PyValue } from "@/types/python";
import type { TraceStep } from "@/types/trace";
import { collectionWindow, itemFocus, type WindowFocus } from "./collectionWindow";
import { arrowHead, CHAR_W } from "./flow/geometry";
import { SequenceStrip, STRIP, stripSize, type StripTone } from "./loops/SequenceStrip";
import type { CellState } from "./SegmentedSequence";
import { formatValue, pyItem } from "./values";

/**
 * Every list, tuple, dict, set (and indexed string) the program has at this event, drawn as
 * one SVG: variable names on the left as tags, each with an arrow to the object it refers
 * to. Names that refer to the same object (same `id`) point at one shared object, so
 * `b = a` literally shows two arrows into one list, while a copy is a second object. What
 * the event does (an index, a slice, a change, a membership test) glows on that object.
 */
export function CollectionsView({ step, previous, strings }: { step: TraceStep; previous?: TraceStep; strings?: Set<string> }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const [scrollRef, overflows] = useOverflows<HTMLDivElement>();
  const groups = groupByObject(step, strings);
  if (!groups.length) return <p className="text-sm text-muted-foreground">No lists, strings or other collections yet.</p>;

  const nameW = Math.max(...groups.flatMap((g) => g.names.map(pillW)));
  const objX = PAD + nameW + ARROW_GAP;
  const blocks = groups.map((g, i) => describeObject(g, step, previous, `${uid}o${i}`));

  let y = PAD;
  const placed = blocks.map((b) => {
    const at = y;
    y += b.h + GAP;
    return { ...b, y: at };
  });
  const height = y - GAP + PAD;
  const width = objX + Math.max(...blocks.map((b) => b.w)) + PAD;

  return (
    <div ref={scrollRef} className="flow objects overflow-x-auto" tabIndex={overflows ? 0 : undefined} role={overflows ? "region" : undefined} aria-label={overflows ? "Objects, scrolls sideways" : undefined}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        className="flow-svg mx-auto block h-auto max-w-full"
        style={{ "--flow-w": `${width}px`, minWidth: `min(${width}px, 17rem)` } as CSSProperties}
        role="img"
        aria-label={placed.map((b) => b.summary).join(" ")}
      >
        {placed.map((b, bi) => {
          const anchorY = b.y + b.anchor;
          const names = groups[bi]!.names;
          const firstY = anchorY - ((names.length - 1) * NAME_STEP) / 2;
          return (
            <g key={names.join(",")} className="object" data-kind={b.kind}>
              {names.map((name, ni) => {
                const cy = firstY + ni * NAME_STEP;
                const w = pillW(name);
                const from = { x: PAD + w, y: cy };
                const to = { x: objX + b.arrowInset - 4, y: anchorY };
                const mid = (from.x + to.x) / 2;
                const look = b.touched ? "lit" : "idle";
                return (
                  <g key={name} className="binding-link" data-look={look}>
                    <path d={`M${from.x} ${from.y}C${mid} ${from.y} ${mid} ${to.y} ${to.x} ${to.y}`} className="binding-line" />
                    <path d={arrowHead([{ x: to.x - 10, y: to.y }, to], 6)} className="binding-arrow" />
                    <rect x={PAD} y={cy - 14} width={w} height={28} rx={14} className="name-pill" />
                    <text x={PAD + w / 2} y={cy + 1} className="name-pill-text">
                      {name}
                    </text>
                  </g>
                );
              })}
              <text x={objX + b.contentX} y={b.y + 9} className="object-tag">
                {b.tag}
              </text>
              <g transform={`translate(${objX} ${b.y + TAG_H})`}>{b.body}</g>
              {b.extras.map((extra, ei) => (
                <g key={`${b.key}-${ei}`} transform={`translate(${objX + b.contentX} ${b.y + TAG_H + b.bodyH + 10 + ei * EXTRA_H})`}>
                  {extra}
                </g>
              ))}
            </g>
          );
        })}
      </svg>
      <p className="sr-only">{placed.map((b) => b.summary).join(" ")}</p>
    </div>
  );
}

const PAD = 10;
const ARROW_GAP = 42;
const NAME_STEP = 36;
const GAP = 26;
const TAG_H = 20;
const EXTRA_H = 34;
const SANS_W = 7.3; // 12px sans, bold
const pillW = (name: string) => name.length * CHAR_W + 26;

type Shown = { names: string[]; value: PyValue };

/** Group names by the object they refer to. Strings are drawn only when `strings` names them. */
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

type Block = {
  key: string;
  kind: string;
  tag: string;
  body: ReactNode;
  bodyW: number;
  bodyH: number;
  /** Where name arrows point, from the block's top. */
  anchor: number;
  /** How far right of the object's x the arrows end (a list's container starts after its "…" space). */
  arrowInset: number;
  /** Where the object's own box starts (after a list's "…" space). */
  contentX: number;
  extras: ReactNode[];
  w: number;
  h: number;
  /** Does this event do something to this object? Its arrows glow. */
  touched: boolean;
  summary: string;
};

/** A pill under an object: what left it, what came back, what a test answered. */
function Chip({ text, value, tone, arrow }: { text: string; value?: string; tone: "removed" | "returned" | "true" | "false" | "note"; arrow?: string }) {
  const w = chipW(text, value);
  return (
    <g className="object-chip" data-tone={tone}>
      <rect x={0} y={0} width={w} height={26} rx={13} className="object-chip-box" />
      <text x={12} y={14} className="object-chip-text">
        {arrow && <tspan className="object-chip-arrow">{arrow} </tspan>}
        {text}
        {value !== undefined && <tspan className="object-chip-value"> {value}</tspan>}
      </text>
    </g>
  );
}
const chipW = (text: string, value?: string, arrow?: string) => (text.length + (arrow ? 2 : 0)) * SANS_W + (value ? (value.length + 1) * CHAR_W : 0) + 26;

function describeObject(group: Shown, step: TraceStep, previous: TraceStep | undefined, id: string): Block {
  const { names, value } = group;
  const mine = (name: string | undefined) => !!name && names.includes(name);
  const mutation = mine(step.mutation?.name) ? step.mutation : undefined;
  const removing = mutation && (mutation.kind === "pop" || mutation.kind === "remove" || mutation.kind === "discard" || mutation.kind === "delete-key");
  const typeName = value.type === "str" ? "string" : value.type;
  const tag = names.length > 1 ? `the same ${typeName}: ${names.length} names, 1 object` : value.type === "tuple" ? "tuple · can't be changed" : value.type === "str" ? "str · can't be changed" : typeName;
  const extras: ReactNode[] = [];
  const extraW: number[] = [];
  const addExtra = (node: ReactNode, w: number) => {
    extras.push(node);
    extraW.push(w);
  };
  // Just created or rebound: its arrow glows too.
  let touched = !!mutation || names.some((n) => previous && (!previous.vars[n] || formatValue(previous.vars[n]!) !== formatValue(value)));
  let arrowInset = 0;
  let body: ReactNode;
  let bodyW: number;
  let bodyH: number;
  let anchor: number;
  const summary: string[] = [`${names.join(" and ")} ${names.length > 1 ? "refer to one" : "refers to a"} ${typeName}.`];

  if (removing) {
    const gone = mutation.kind === "delete-key" ? pyItem(mutation.key ?? null) : pyItem(mutation.removed ?? mutation.value ?? null);
    const text = `left the ${value.type}:`;
    addExtra(<Chip text={text} value={gone} tone="removed" arrow="↗" />, chipW(text, gone, "↗"));
    summary.push(`${gone} left the ${value.type}.`);
  }
  // A method that hands back a value (pop) shows it separately, once it is stored.
  const call = step.call;
  if (call?.phase === "assign" && call.receiver && mine(call.receiver) && call.returns !== undefined && call.returns !== "None") {
    const text = `${call.name}() returned`;
    const value2 = `${call.returns}${call.assignTo ? ` → ${call.assignTo}` : ""}`;
    addExtra(<Chip text={text} value={value2} tone="returned" />, chipW(text, value2));
    summary.push(`${call.name}() returned ${call.returns}.`);
    touched = true;
  }

  if (value.type === "list" || value.type === "tuple" || value.type === "str") {
    const items: PyItem[] = value.type === "str" ? [...value.value] : value.value;
    const n = items.length;
    const states: Record<number, CellState> = {};
    const notes: Record<number, string> = {};
    let focus: WindowFocus | undefined;
    let negative = false;
    if (mine(step.element?.name) && step.element!.index !== undefined) {
      const index = step.element!.index;
      negative = index < 0;
      focus = itemFocus(n, index);
      if (focus) states[focus.lo] = "active";
      touched = true;
      summary.push(`Index ${index} is used.`);
    }
    if (mine(step.slice?.name)) {
      const { start, stop } = step.slice!;
      for (let i = start; i < Math.min(stop, n); i++) states[i] = "selected";
      notes[start] = "start";
      if (stop < n) notes[stop] = "stop";
      focus = { lo: start, hi: Math.min(stop, n - 1) };
      touched = true;
      const text = `[${start}:${stop}]: start kept, stop left out`;
      addExtra(<Chip text={text} tone="note" />, chipW(text));
      summary.push(`The slice ${start} to ${stop} selects indexes ${start} to ${Math.min(stop, n) - 1}.`);
    }
    if (mutation && mutation.index !== undefined && !removing) {
      states[mutation.index] = mutation.kind === "set" ? "changed" : "added";
      notes[mutation.index] = mutation.kind === "set" && mutation.removed !== undefined ? `was ${pyItem(mutation.removed)}` : "new";
      focus = { lo: mutation.index, hi: mutation.index };
    }
    if (removing && mutation.index !== undefined) focus = itemFocus(n, Math.min(mutation.index, n - 1));
    const hasNotes = Object.keys(notes).length > 0;
    const size = stripSize(items, value.type === "str", { negative, notes: hasNotes });
    // The strip keeps room for "…" on its left; the arrow reaches the container unless items are hidden there.
    arrowInset = collectionWindow(n, focus).hiddenBefore ? 0 : STRIP.more;
    body = (
      <g>
        <SequenceStrip
          id={id}
          items={items}
          strings={value.type === "str"}
          states={states}
          focus={focus}
          tone={value.type as StripTone}
          negative={negative}
          notes={hasNotes ? notes : undefined}
        />
      </g>
    );
    bodyW = size.w;
    bodyH = size.h;
    anchor = TAG_H + STRIP.top + STRIP.cellH / 2;
  } else if (value.type === "dict") {
    const activeKey = mine(step.element?.name) ? step.element!.key : undefined;
    if (activeKey !== undefined) {
      touched = true;
      summary.push(`The key ${pyItem(activeKey)} is looked up.`);
    }
    const d = dictBody(value.value, activeKey, mutation);
    body = d.node;
    bodyW = d.w;
    bodyH = d.h;
    anchor = TAG_H + Math.min(d.h / 2, 22);
  } else {
    // set
    const items = value.type === "set" ? value.value : [];
    const membership = mine(step.membership?.name) ? step.membership : undefined;
    const before = names.map((n) => previous?.vars[n]).find((v) => v?.type === "set");
    const adding = mutation?.kind === "add" ? mutation.value : undefined;
    const already = adding !== undefined && before?.type === "set" && before.value.includes(adding);
    const s = setBody(items, membership, already ? undefined : adding, already ? adding : undefined);
    body = s.node;
    bodyW = s.w;
    bodyH = s.h;
    anchor = TAG_H + s.h / 2;
    if (membership) {
      touched = true;
      const text = `${pyItem(membership.value)} in ${names[0]}`;
      const ans = membership.result ? "True" : "False";
      addExtra(<Chip text={text} value={ans} tone={membership.result ? "true" : "false"} />, chipW(text, ans));
      summary.push(`${text} is ${ans}.`);
    }
    if (adding !== undefined) {
      const text = already ? `${pyItem(adding)} was already there: nothing changes` : `${pyItem(adding)} is new, so it joins the set`;
      addExtra(<Chip text={text} tone="note" />, chipW(text));
    }
    const text = "no positions, no guaranteed order";
    if (!membership && adding === undefined) addExtra(<Chip text={text} tone="note" />, chipW(text));
  }

  const h = TAG_H + bodyH + (extras.length ? 10 + extras.length * EXTRA_H - 8 : 0);
  const contentX = value.type === "list" || value.type === "tuple" || value.type === "str" ? STRIP.more : 0;
  const w = Math.max(bodyW, contentX + tag.length * 6.4, ...extraW.map((x) => contentX + x));
  return { key: id, kind: value.type, tag, body, bodyW, bodyH, anchor, arrowInset, contentX, extras, w, h, touched, summary: summary.join(" ") };
}

const ROW_H = 34;

function dictBody(entries: [PyItem, PyItem][], activeKey: PyItem | undefined, mutation: TraceStep["mutation"]) {
  const keyW = Math.max(56, ...entries.map(([k]) => pyItem(k).length * CHAR_W + 24));
  const valW = Math.max(48, ...entries.map(([, v]) => pyItem(v).length * CHAR_W + 24)) + 60;
  const w = keyW + 34 + valW;
  const h = Math.max(1, entries.length) * ROW_H + 12;
  const node = (
    <g className="dict-svg">
      <rect x={0} y={0} width={w} height={h} rx={12} className="dict-svg-box" />
      {!entries.length && (
        <text x={w / 2} y={h / 2} className="strip-index">
          empty dict
        </text>
      )}
      {entries.map(([k, v], i) => {
        const changed = mutation?.kind === "set-key" && mutation.key === k;
        const state = changed ? (mutation!.removed === undefined ? "added" : "changed") : activeKey !== undefined && activeKey === k ? "active" : "idle";
        const y = 6 + i * ROW_H;
        return (
          <g key={String(k)} className="dict-row" data-state={state}>
            <rect x={5} y={y + 2} width={w - 10} height={ROW_H - 4} rx={9} className="dict-row-box" />
            <text x={18} y={y + ROW_H / 2 + 1} className="dict-key">
              {pyItem(k)}
            </text>
            <text x={keyW + 17} y={y + ROW_H / 2 + 1} className="dict-arrow">
              →
            </text>
            <text x={keyW + 40} y={y + ROW_H / 2 + 1} className="dict-value">
              {pyItem(v)}
              {changed && mutation!.removed !== undefined && <tspan className="dict-was"> was {pyItem(mutation!.removed)}</tspan>}
              {changed && mutation!.removed === undefined && <tspan className="dict-was"> new</tspan>}
            </text>
          </g>
        );
      })}
    </g>
  );
  return { node, w, h };
}

function setBody(items: PyItem[], membership: TraceStep["membership"] | undefined, added: PyItem | undefined, already: PyItem | undefined) {
  const perRow = 6;
  const itemW = Math.max(36, ...items.map((x) => pyItem(x).length * CHAR_W + 20));
  const rows = Math.max(1, Math.ceil(items.length / perRow));
  const cols = Math.max(1, Math.min(items.length, perRow));
  const w = cols * (itemW + 8) + 24;
  const h = rows * 44 + 16;
  const node = (
    <g className="set-svg">
      <rect x={0} y={0} width={w} height={h} rx={h / 2 > 30 ? 26 : h / 2} className="set-svg-box" />
      {!items.length && (
        <text x={w / 2} y={h / 2} className="strip-index">
          empty set
        </text>
      )}
      {items.map((x, i) => {
        const cx = 16 + (i % perRow) * (itemW + 8) + itemW / 2;
        const cy = 8 + Math.floor(i / perRow) * 44 + 22;
        const state = (membership && membership.result && membership.value === x) || already === x ? "active" : added === x ? "added" : "idle";
        return (
          <g key={String(x)} className="set-item-svg" data-state={state}>
            <rect x={cx - itemW / 2} y={cy - 16} width={itemW} height={32} rx={16} className="set-item-box" />
            <text x={cx} y={cy + 1} className="strip-value">
              {pyItem(x)}
            </text>
          </g>
        );
      })}
    </g>
  );
  return { node, w, h };
}
