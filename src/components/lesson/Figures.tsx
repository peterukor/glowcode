import type { FigureBlock } from "@/courses/types";
import type { PyValue } from "@/types/python";
import { formatValue, typeStyle } from "@/visualizations/values";
import { VariablesPanel } from "@/visualizations/VariableBox";
import { RichTextView } from "./RichTextView";

/** A concept illustration with its caption. Lessons introduce it in the text above. */
export function Figure({ block }: { block: FigureBlock }) {
  const f = block.figure;
  return (
    <figure className="lesson-figure my-7 rounded-3xl border-2 bg-card p-5">
      {f.kind === "variables" && <VariablesPanel vars={f.vars} highlight={f.highlight} />}
      {f.kind === "names" && <NamesFigure bindings={f.bindings} />}
      {f.kind === "sequence" && <SequenceFigure steps={f.steps} />}
      <figcaption className="mt-4 text-sm text-muted-foreground">
        <RichTextView text={block.caption} />
      </figcaption>
    </figure>
  );
}

function ValueBubble({ value, faded }: { value: PyValue; faded?: boolean }) {
  const st = typeStyle[value.type];
  return (
    <span
      className={`inline-flex items-baseline gap-2 rounded-full border-2 px-3 py-1 font-mono font-bold ${st.border} ${st.tint} ${st.text} ${
        faded ? "opacity-45" : ""
      }`}
    >
      <span className={faded ? "line-through decoration-2" : undefined}>{formatValue(value)}</span>
      <span className="font-sans text-[10px] uppercase tracking-wider">{value.type}</span>
    </span>
  );
}

/**
 * Names pointing at values, which is how Python actually works: `age = 14` makes the name
 * `age` refer to the value 14. A `previous` value is drawn faded, with the old arrow
 * dashed, to show reassignment.
 */
function NamesFigure({ bindings }: { bindings: { name: string; value: PyValue; previous?: PyValue }[] }) {
  return (
    <ul className="flex flex-col gap-4" aria-label="Names and the values they refer to">
      {bindings.map((b) => (
        <li key={b.name} className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="rounded-lg border-2 border-foreground/70 bg-background px-2.5 py-0.5 font-mono text-sm font-bold">{b.name}</span>
          <span className="flex flex-col gap-1.5">
            <span className="flex items-center gap-2">
              <span className="text-xl leading-none text-primary" aria-hidden>
                ⟶
              </span>
              <ValueBubble value={b.value} />
            </span>
            {b.previous && (
              <span className="flex items-center gap-2">
                <span className="text-xl leading-none text-muted-foreground/60" aria-hidden>
                  ⇢
                </span>
                <ValueBubble value={b.previous} faded />
                <span className="text-xs text-muted-foreground">no longer used</span>
              </span>
            )}
          </span>
          <span className="sr-only">
            {b.name} refers to {formatValue(b.value)}
            {b.previous ? `; it used to refer to ${formatValue(b.previous)}` : ""}.
          </span>
        </li>
      ))}
    </ul>
  );
}

/** A short ordered process, drawn as numbered steps joined by arrows. */
function SequenceFigure({ steps }: { steps: string[] }) {
  return (
    <ol className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
      {steps.map((step, i) => (
        <li key={i} className="flex flex-col items-center gap-2 sm:flex-1 sm:flex-row">
          <span className="flex w-full items-start gap-2 rounded-2xl border-2 bg-background px-3 py-2 text-sm">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground" aria-hidden>
              {i + 1}
            </span>
            <span>
              <RichTextView text={step} />
            </span>
          </span>
          {i < steps.length - 1 && (
            <span className="text-lg text-primary sm:rotate-0" aria-hidden>
              <span className="sm:hidden">↓</span>
              <span className="hidden sm:inline">→</span>
            </span>
          )}
        </li>
      ))}
    </ol>
  );
}
