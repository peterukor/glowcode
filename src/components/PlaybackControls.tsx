import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw } from "lucide-react";
import { useId } from "react";
import type { Playback } from "@/hooks/usePlayback";

const SPEEDS = [0.5, 1, 2];

/**
 * Manual stepping comes first (Previous, Next, Reset). Autoplay is there for anyone who
 * wants it, but nothing depends on it.
 */
export function PlaybackControls({ playback: p, playLabel = "Play" }: { playback: Playback; playLabel?: string }) {
  const hintId = useId();
  const stepButton =
    "inline-flex items-center gap-1 rounded-full border-2 bg-card px-3 py-2 text-sm font-bold transition-all hover:border-primary hover:text-primary disabled:pointer-events-none disabled:opacity-40";
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" onClick={p.prev} disabled={p.step === 0} className={stepButton} aria-label="Previous step">
        <ChevronLeft className="h-4 w-4" aria-hidden /> Previous
      </button>
      <button
        type="button"
        onClick={p.next}
        disabled={p.step === p.total - 1 || p.blocked}
        className="btn-primary !px-4 !py-2 disabled:opacity-50"
        aria-label="Next step"
        aria-describedby={p.blocked ? hintId : undefined}
      >
        Next <ChevronRight className="h-4 w-4" aria-hidden />
      </button>
      <button type="button" onClick={p.reset} className={stepButton} aria-label="Reset">
        <RotateCcw className="h-4 w-4" aria-hidden /> Reset
      </button>

      <div className="flex min-w-40 flex-1 items-center gap-3 px-1">
        <span className="font-mono text-xs font-bold text-muted-foreground">
          Step {p.step + 1}/{p.total}
        </span>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-brand transition-all duration-500" style={{ width: `${((p.step + 1) / p.total) * 100}%` }} />
        </div>
      </div>
      {p.blocked && (
        <p id={hintId} className="w-full text-xs font-semibold text-sky-ink">
          Make a prediction below (or skip it) to see the next step.
        </p>
      )}

      <div className="flex items-center gap-1 rounded-full border-2 bg-card p-1" role="group" aria-label="Autoplay">
        <button
          type="button"
          onClick={p.toggle}
          disabled={!p.playing && p.blocked}
          className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold text-muted-foreground hover:text-foreground disabled:opacity-40"
        >
          {p.playing ? <Pause className="h-3.5 w-3.5" aria-hidden /> : <Play className="h-3.5 w-3.5" aria-hidden />}
          {p.playing ? "Pause" : playLabel}
        </button>
        {SPEEDS.map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => p.setSpeed(v)}
            aria-pressed={p.speed === v}
            aria-label={`Speed ${v}×`}
            className={`rounded-full px-2.5 py-1 text-xs font-bold ${p.speed === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            {v}×
          </button>
        ))}
      </div>
    </div>
  );
}
