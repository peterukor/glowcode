import { useEffect, useState } from "react";

export type Playback = ReturnType<typeof usePlayback>;

const BASE_DELAY_MS = 1200;

/**
 * Steps through a trace: previous / next / reset, plus optional autoplay and speed.
 * `traceId` resets playback whenever a different program is loaded.
 * `isBlocked(step)` says the student can't move past `step` yet (a prediction is waiting):
 * Next and autoplay stop there, and only `advance()` (an explicit reveal) moves on.
 */
export function usePlayback(total: number, traceId: string, isBlocked: (step: number) => boolean = () => false) {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const blocked = isBlocked(step);

  useEffect(() => {
    setStep(0);
    setPlaying(false);
  }, [traceId, total]);

  useEffect(() => {
    if (!playing) return;
    if (step >= total - 1 || blocked) {
      setPlaying(false);
      return;
    }
    const timer = setTimeout(() => setStep((s) => Math.min(total - 1, s + 1)), BASE_DELAY_MS / speed);
    return () => clearTimeout(timer);
  }, [playing, step, total, speed, blocked]);

  return {
    step,
    total,
    playing,
    speed,
    blocked,
    setSpeed,
    next: () => {
      if (!blocked) setStep((s) => Math.min(total - 1, s + 1));
    },
    /** Moves on even past a waiting prediction: the student chose to reveal. */
    advance: () => setStep((s) => Math.min(total - 1, s + 1)),
    prev: () => setStep((s) => Math.max(0, s - 1)),
    reset: () => {
      setStep(0);
      setPlaying(false);
    },
    toggle: () => {
      if (playing) return setPlaying(false);
      if (step >= total - 1) setStep(0);
      else if (blocked) return;
      setPlaying(true);
    },
  };
}
