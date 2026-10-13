import { ChevronLeft, ChevronRight, RotateCcw, Terminal, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { CodeView } from "@/components/CodeView";
import type { VisualizationKind, Walkthrough } from "@/types/trace";
import { ExampleVisualization, visualizationLabels } from "@/visualizations/ExampleVisualization";

/**
 * The shared, read-only walkthrough view: code on the left, visualization on the right,
 * and Previous / Next / Reset. No editing, no Run button: students step through predefined,
 * verified execution steps.
 *
 * Phase 1 wires this to the existing visualizations; the full engine (value bubbles,
 * operator nodes, function diagrams) plugs into the same `Walkthrough` data later.
 */
export function WalkthroughView({ walkthrough, onClose }: { walkthrough: Walkthrough; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState(0);
  const [kind, setKind] = useState<VisualizationKind | undefined>(walkthrough.visualizations[0]);
  const total = walkthrough.steps.length;
  const step = walkthrough.steps[Math.min(index, total - 1)]!;
  const prev = () => setIndex((i) => Math.max(0, i - 1));
  const next = () => setIndex((i) => Math.min(total - 1, i + 1));

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
    // Give focus back to the button that opened this walkthrough.
    return () => document.getElementById(`open-${walkthrough.id}`)?.focus({ preventScroll: true });
  }, [walkthrough.id]);

  return (
    <dialog
      ref={ref}
      className="walkthrough"
      aria-labelledby="walkthrough-title"
      onClose={onClose}
      onKeyDown={(e) => {
        if (e.target instanceof HTMLElement && e.target.closest("button[role='tab']")) return;
        if (e.key === "ArrowRight") next();
        if (e.key === "ArrowLeft") prev();
      }}
    >
      <div className="flex h-full flex-col">
        <header className="flex items-center gap-3 border-b px-4 py-3 sm:px-6">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-wide text-primary">Code walkthrough</p>
            <h2 id="walkthrough-title" className="truncate text-lg font-extrabold">
              {walkthrough.title}
            </h2>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close walkthrough and return to the lesson">
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
          <section aria-label="Code" className="min-w-0">
            <CodeView code={walkthrough.code} activeLine={step.line} className="py-3" />
            <p className="mt-2 text-xs text-muted-foreground">
              The highlighted line is running. A line can run more than once, or take more than one step.
            </p>
          </section>

          <section aria-label="Visualization" className="flex min-w-0 flex-col gap-4">
            {walkthrough.visualizations.length > 1 && (
              <div role="tablist" aria-label="Visualization type" className="flex flex-wrap gap-2">
                {walkthrough.visualizations.map((k) => (
                  <button
                    key={k}
                    role="tab"
                    type="button"
                    aria-selected={kind === k}
                    onClick={() => setKind(k)}
                    className={`rounded-full px-3 py-1 text-xs font-bold ${kind === k ? "bg-foreground text-background" : "bg-muted text-muted-foreground"}`}
                  >
                    {visualizationLabels[k]}
                  </button>
                ))}
              </div>
            )}

            {(kind || step.evaluation) && (
              <div className="rounded-3xl border-2 bg-card p-5">
                {step.evaluation && <EvaluationChain stages={step.evaluation} />}
                {kind && <ExampleVisualization example={walkthrough} step={step} kind={kind} />}
              </div>
            )}

            <p key={index} className="animate-pop rounded-2xl border-2 border-primary/30 bg-card p-4 font-medium" aria-live="polite">
              {step.note}
            </p>

            <div className="rounded-2xl bg-code-bg p-4 font-mono text-sm text-code-fg">
              <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-code-line">
                <Terminal className="h-3.5 w-3.5" aria-hidden /> Console
              </div>
              {step.output?.length ? (
                step.output.map((line, i) => <div key={i}>› {line}</div>)
              ) : (
                <span className="text-code-line">Nothing printed yet</span>
              )}
            </div>
          </section>
        </div>

        <footer className="flex flex-wrap items-center gap-2 border-t px-4 py-3 sm:px-6">
          <button type="button" className="btn-ghost !px-4 !py-2" onClick={prev} disabled={index === 0}>
            <ChevronLeft className="h-4 w-4" aria-hidden /> Previous
          </button>
          <button type="button" className="btn-primary !px-5 !py-2" onClick={next} disabled={index === total - 1}>
            Next <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
          <button type="button" className="btn-ghost !px-4 !py-2" onClick={() => setIndex(0)} disabled={index === 0}>
            <RotateCcw className="h-4 w-4" aria-hidden /> Reset
          </button>
          <span className="ml-auto font-mono text-xs font-bold text-muted-foreground">
            Step {index + 1} of {total}
          </span>
          <span className="hidden text-xs text-muted-foreground sm:inline">· ← → keys work too</span>
        </footer>
      </div>
    </dialog>
  );
}

/** How Python works out an expression, one stage at a time: age + 1 → 13 + 1 → 14. */
function EvaluationChain({ stages }: { stages: string[] }) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 font-mono text-sm" aria-label="How Python works out the expression">
      {stages.map((stage, i) => (
        <span key={i} className="flex items-center gap-2">
          {i > 0 && (
            <span className="text-primary" aria-hidden>
              →
            </span>
          )}
          <span
            className={`animate-pop rounded-xl border-2 px-2.5 py-1 font-bold ${i === stages.length - 1 ? "border-primary bg-primary/10" : "border-border"}`}
            style={{ animationDelay: `${i * 120}ms` }}
          >
            {stage}
          </span>
        </span>
      ))}
    </div>
  );
}
