import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw } from "lucide-react";
import type { Playback } from "@/hooks/usePlayback";

const SPEEDS = [0.5, 1, 2];

export function PlaybackControls({ playback: p, playLabel = "Play" }: { playback: Playback; playLabel?: string }) {
  const iconButton =
    "grid h-10 w-10 place-items-center rounded-full border-2 bg-card transition-all hover:border-primary hover:text-primary disabled:pointer-events-none disabled:opacity-40";
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" onClick={p.toggle} className="btn-primary !px-5 !py-2">
        {p.playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        {p.playing ? "Pause" : playLabel}
      </button>
      <button type="button" onClick={p.prev} disabled={p.step === 0} className={iconButton} aria-label="Previous step">
        <ChevronLeft className="h-4 w-4" />
      </button>
      <button type="button" onClick={p.next} disabled={p.step === p.total - 1} className={iconButton} aria-label="Next step">
        <ChevronRight className="h-4 w-4" />
      </button>
      <button type="button" onClick={p.reset} className={iconButton} aria-label="Restart">
        <RotateCcw className="h-4 w-4" />
      </button>
      <div className="flex items-center gap-1 rounded-full border-2 bg-card p-1" role="group" aria-label="Playback speed">
          {SPEEDS.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => p.setSpeed(v)}
              aria-pressed={p.speed === v}
              className={`rounded-full px-3 py-1 text-xs font-bold ${p.speed === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              {v}×
            </button>
          ))}
      </div>
      <div className="ml-auto flex min-w-40 items-center gap-3">
        <span className="font-mono text-xs font-bold text-muted-foreground">
          Step {p.step + 1}/{p.total}
        </span>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-brand transition-all duration-500"
            style={{ width: `${((p.step + 1) / p.total) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
