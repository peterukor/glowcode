import { ChevronDown, Terminal } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { CodeView } from "@/components/CodeView";
import { PlaybackControls } from "@/components/PlaybackControls";
import { usePlayback } from "@/hooks/usePlayback";
import type { VisualizationKind, Walkthrough } from "@/types/trace";
import { CalculationView } from "@/visualizations/CalculationView";
import { ExampleVisualization } from "@/visualizations/ExampleVisualization";
import { visualizationLabels } from "@/visualizations/labels";
import { TypeLegend, VariablesPanel } from "@/visualizations/VariableBox";
import { readingNames } from "@/walkthrough/controller";
import { CheckpointQuestion, CheckpointRecap } from "./WalkthroughCheckpoint";

/**
 * The one read-only step-by-step player, used by lessons, the playground, the manual and the
 * developer showcase: controls on top, code and printed output on the left, the diagram and
 * explanation on the right.
 *
 * It only renders. Which event is on screen, and what the student did at predictions, comes
 * from the playback controller (`src/walkthrough/controller.ts` via `usePlayback`); what
 * each diagram shows comes from the event's data. It sizes itself to its container: side by
 * side when there's room, stacked in a narrow column. It never edits or runs code.
 */
export function WalkthroughPlayer({
  walkthrough,
  playLabel = "Play",
  fileName = "main.py",
  header,
}: {
  walkthrough: Walkthrough;
  playLabel?: string;
  fileName?: string;
  /** Optional content above the controls (the playground's example picker). */
  header?: ReactNode;
}) {
  const playback = usePlayback(walkthrough);
  const { view, dispatch } = playback;
  const { step, previous, waiting } = view;
  const [chosenKind, setChosenKind] = useState<VisualizationKind | undefined>(walkthrough.visualizations[0]);
  const [consoleOpen, setConsoleOpen] = useState(true);
  const questionRef = useRef<HTMLHeadingElement>(null);
  const noteRef = useRef<HTMLDivElement>(null);
  const [focusNote, setFocusNote] = useState(false);

  useEffect(() => {
    if (!focusNote) return;
    noteRef.current?.focus();
    setFocusNote(false);
  }, [focusNote]);

  const reveal = () => {
    dispatch({ type: "reveal" });
    setFocusNote(true);
  };
  const kind = chosenKind && walkthrough.visualizations.includes(chosenKind) ? chosenKind : walkthrough.visualizations[0];
  const reading = readingNames(step);

  return (
    <div
      className="@container"
      onKeyDown={(e) => {
        // ← / → step through, unless the student is typing or choosing an option.
        if (e.target instanceof HTMLElement && e.target.closest("input, textarea, [role='tab']")) return;
        if (e.key === "ArrowRight") {
          if (waiting) questionRef.current?.focus();
          else playback.next();
        }
        if (e.key === "ArrowLeft") playback.prev();
      }}
    >
      {header}

      <div className="mb-5 rounded-3xl border-2 bg-card p-3 shadow-soft">
        <PlaybackControls playback={playback} playLabel={playLabel} />
      </div>

      {/* Wide: code and console on the left, visualization on the right.
          Narrow: code, then what it does, then the console. */}
      <div className="player-grid grid gap-5">
        <div className="min-w-0 [grid-area:code]">
          <div className="overflow-hidden rounded-3xl border-2 bg-code-bg shadow-soft">
            <div className="flex items-center gap-2 border-b border-code-line/30 px-4 py-3">
              <span className="h-3 w-3 rounded-full bg-coral" aria-hidden />
              <span className="h-3 w-3 rounded-full bg-sun" aria-hidden />
              <span className="h-3 w-3 rounded-full bg-teal" aria-hidden />
              <span className="ml-3 font-mono text-xs text-code-line">{fileName}</span>
            </div>
            <CodeView code={walkthrough.code} activeLine={step.line} label="Code being walked through" className="min-h-40 rounded-none" />
            <p className="border-t border-code-line/30 px-4 py-2 font-mono text-xs text-code-line" aria-live="polite">
              Running line {step.line}
              {view.linePosition && <span className="text-sun"> · {view.linePosition}</span>}
            </p>
          </div>
        </div>

        <div className="min-w-0 self-start [grid-area:console]">
          <div className="rounded-3xl border-2 bg-card shadow-soft">
            <button
              type="button"
              onClick={() => setConsoleOpen((o) => !o)}
              aria-expanded={consoleOpen}
              className="flex w-full items-center gap-2 px-5 py-3 font-bold"
            >
              <Terminal className="h-4 w-4 text-teal" aria-hidden /> Printed output
              <ChevronDown className={`ml-auto h-4 w-4 transition-transform ${consoleOpen ? "" : "-rotate-90"}`} aria-hidden />
            </button>
            {consoleOpen && (
              <div className="mx-4 mb-4 min-h-20 rounded-2xl bg-code-bg p-4 font-mono text-sm text-code-fg">
                {step.output?.length ? (
                  step.output.map((line, i) => (
                    <div key={i} className="animate-pop">
                      <span className="text-teal">›</span> {line}
                    </div>
                  ))
                ) : (
                  <span className="text-code-line">No output yet…</span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-5 [grid-area:viz]">
          <div className="relative overflow-hidden rounded-3xl border-2 bg-card p-4 shadow-soft sm:p-5">
            <div className="relative">
              <div className="mb-5 flex flex-wrap items-center gap-2">
                <h3 className="mr-auto text-xl font-bold">Visualization</h3>
                {walkthrough.visualizations.length > 1 &&
                  walkthrough.visualizations.map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setChosenKind(k)}
                      aria-pressed={kind === k}
                      className={`rounded-full px-3 py-1 text-xs font-bold transition-all ${
                        kind === k ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {visualizationLabels[k]}
                    </button>
                  ))}
              </div>

              {/* The diagram's own canvas: dark in both themes, so lines and glows read clearly. */}
              <div className="viz-stage dark">
                {step.calc ? (
                  <CalculationView calc={step.calc} vars={step.vars} />
                ) : (
                  step.evaluation && <EvaluationChain stages={step.evaluation} />
                )}
                {step.returned !== undefined && !step.call && <ReturnedValue value={step.returned} />}
                {kind ? (
                  <div className="min-h-32">
                    <ExampleVisualization example={walkthrough} step={step} previous={previous} kind={kind} />
                  </div>
                ) : (
                  !step.evaluation && !step.calc && <p className="text-sm text-muted-foreground">Watch the printed output and the highlighted line.</p>
                )}
              </div>

              <div
                key={view.index}
                ref={noteRef}
                tabIndex={-1}
                className="animate-pop mt-6 flex items-start gap-3 rounded-2xl border-2 border-primary/30 bg-card/80 p-4 outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <span className="text-2xl" aria-hidden>
                  💡
                </span>
                <p className="font-medium" aria-live="polite">
                  {step.note ?? `Line ${step.line} runs.`}
                </p>
              </div>

              {view.recap && step.checkpoint && <CheckpointRecap checkpoint={step.checkpoint} record={view.recap} />}
              {waiting && (
                <CheckpointQuestion
                  key={waiting.index}
                  ref={questionRef}
                  checkpoint={waiting.step.checkpoint!}
                  record={waiting.record}
                  onCheck={(choiceId) => dispatch({ type: "check", choiceId })}
                  onReveal={reveal}
                />
              )}
            </div>
          </div>

          {kind && kind !== "variables" && (
            <div className="rounded-3xl border-2 bg-card p-5 shadow-soft">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-bold">Variables</h3>
                <TypeLegend />
              </div>
              <VariablesPanel vars={step.vars} highlight={step.highlight} previous={previous?.vars} reading={reading} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** How Python works out an expression, one stage at a time: age + 1 → 13 + 1 → 14. */
function EvaluationChain({ stages }: { stages: string[] }) {
  return (
    <div className="mb-5 flex flex-wrap items-center gap-2 font-mono text-sm" aria-label="How Python works out the expression">
      {stages.map((stage, i) => (
        <span key={i} className="flex items-center gap-2">
          {i > 0 && (
            <span className="text-primary" aria-hidden>
              →
            </span>
          )}
          <span
            className={`animate-pop rounded-xl border-2 bg-card px-2.5 py-1 font-bold ${i === stages.length - 1 ? "border-primary bg-primary/10" : "border-border"}`}
            style={{ animationDelay: `${i * 120}ms` }}
          >
            {stage}
          </span>
        </span>
      ))}
    </div>
  );
}

/** A value handed back by a function. Styled and labeled unlike printed output on purpose. */
function ReturnedValue({ value }: { value: string }) {
  return (
    <div className="animate-pop mb-5 inline-flex items-center gap-2 rounded-2xl border-2 border-dashed border-primary/60 bg-primary/8 px-3 py-1.5" role="group" aria-label="Returned value">
      <span className="text-xs font-bold uppercase tracking-wide text-grape-ink">Returned</span>
      <span aria-hidden className="text-primary">
        ↩
      </span>
      <span className="font-mono font-bold">{value}</span>
      <span className="sr-only">(handed back to the code that called it; not printed)</span>
    </div>
  );
}
