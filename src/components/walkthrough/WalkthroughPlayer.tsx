import { ChevronDown, Terminal } from "lucide-react";
import { useState, type ReactNode } from "react";
import { CodeView } from "@/components/CodeView";
import { PlaybackControls } from "@/components/PlaybackControls";
import { usePlayback } from "@/hooks/usePlayback";
import type { VisualizationKind, Walkthrough } from "@/types/trace";
import { ExampleVisualization, visualizationLabels } from "@/visualizations/ExampleVisualization";
import { TypeLegend, VariablesPanel } from "@/visualizations/VariableBox";

/**
 * The step-by-step player used by both the playground and lessons:
 * controls on top, code + console on the left, visualization + explanation on the right.
 *
 * It sizes itself to its container, not the window: side by side when there's room,
 * stacked when it sits in a narrower column (like a lesson with both panels open).
 * Read-only: it replays predefined, verified steps and never runs code.
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
  const playback = usePlayback(walkthrough.steps.length, walkthrough.id);
  const [chosenKind, setChosenKind] = useState<VisualizationKind | undefined>(walkthrough.visualizations[0]);
  const [consoleOpen, setConsoleOpen] = useState(true);

  const step = walkthrough.steps[Math.min(playback.step, walkthrough.steps.length - 1)]!;
  const kind = chosenKind && walkthrough.visualizations.includes(chosenKind) ? chosenKind : walkthrough.visualizations[0];

  return (
    <div
      className="@container"
      onKeyDown={(e) => {
        // ← / → step through, unless the student is typing or choosing an option.
        if (e.target instanceof HTMLElement && e.target.closest("input, textarea, [role='tab']")) return;
        if (e.key === "ArrowRight") playback.next();
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
            <CodeView code={walkthrough.code} activeLine={step.line} className="min-h-40 rounded-none" />
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
              <Terminal className="h-4 w-4 text-teal" aria-hidden /> Console
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
          <div className="relative overflow-hidden rounded-3xl border-2 bg-card p-5 shadow-soft">
            <div className="pointer-events-none absolute inset-0 bg-hero opacity-60" aria-hidden />
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

              {step.evaluation && <EvaluationChain stages={step.evaluation} />}
              {kind ? (
                <div className="min-h-32">
                  <ExampleVisualization example={walkthrough} step={step} kind={kind} />
                </div>
              ) : (
                !step.evaluation && <p className="text-sm text-muted-foreground">Watch the console and the highlighted line.</p>
              )}

              <div key={playback.step} className="animate-pop mt-6 flex items-start gap-3 rounded-2xl border-2 border-primary/30 bg-card/80 p-4">
                <span className="text-2xl" aria-hidden>
                  💡
                </span>
                <p className="font-medium" aria-live="polite">
                  {step.note}
                </p>
              </div>
            </div>
          </div>

          {kind && kind !== "variables" && (
            <div className="rounded-3xl border-2 bg-card p-5 shadow-soft">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-bold">Variables</h3>
                <TypeLegend />
              </div>
              <VariablesPanel vars={step.vars} highlight={step.highlight} />
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
