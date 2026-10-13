import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";

/** Steps through a pre-recorded demo trace. Replace with a real tracer later. */
export function useStepper(total: number) {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  useEffect(() => { setStep(0); setPlaying(false); }, [total]);
  useEffect(() => {
    if (!playing) return;
    if (step >= total - 1) { setPlaying(false); return; }
    const t = setTimeout(() => setStep((s) => s + 1), 1200 / speed);
    return () => clearTimeout(t);
  }, [playing, step, total, speed]);
  return {
    step, playing, speed, setSpeed, total,
    next: () => setStep((s) => Math.min(total - 1, s + 1)),
    prev: () => setStep((s) => Math.max(0, s - 1)),
    reset: () => { setStep(0); setPlaying(false); },
    toggle: () => { if (step >= total - 1) setStep(0); setPlaying((p) => !p); },
  };
}

export function StepControls({ s, compact }: { s: ReturnType<typeof useStepper>; compact?: boolean }) {
  const icon = "grid h-10 w-10 place-items-center rounded-full border-2 bg-card transition-all hover:border-primary hover:text-primary disabled:opacity-40";
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button onClick={s.toggle} className="btn-primary !py-2 !px-5">
        {s.playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />} {s.playing ? "Pause" : "Run demo"}
      </button>
      <button onClick={s.prev} disabled={s.step === 0} className={icon} aria-label="Previous step"><ChevronLeft className="h-4 w-4" /></button>
      <button onClick={s.next} disabled={s.step === s.total - 1} className={icon} aria-label="Next step"><ChevronRight className="h-4 w-4" /></button>
      <button onClick={s.reset} className={icon} aria-label="Reset"><RotateCcw className="h-4 w-4" /></button>
      {!compact && (
        <div className="flex items-center gap-1 rounded-full border-2 bg-card p-1">
          {[0.5, 1, 2].map((v) => (
            <button key={v} onClick={() => s.setSpeed(v)} className={`rounded-full px-3 py-1 text-xs font-bold ${s.speed === v ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>{v}×</button>
          ))}
        </div>
      )}
      <div className="ml-auto flex min-w-40 items-center gap-3">
        <span className="font-mono text-xs font-bold text-muted-foreground">Step {s.step + 1}/{s.total}</span>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-brand transition-all duration-500" style={{ width: `${((s.step + 1) / s.total) * 100}%` }} />
        </div>
      </div>
    </div>
  );
}
