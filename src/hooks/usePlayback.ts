import { useEffect, useState } from "react";

export type Playback = ReturnType<typeof usePlayback>;

const BASE_DELAY_MS = 1200;

/**
 * Plays through the steps of a trace: play / pause, step back and forth, speed.
 * `traceId` resets playback whenever a different program is loaded.
 */
export function usePlayback(total: number, traceId: string) {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  useEffect(() => {
    setStep(0);
    setPlaying(false);
  }, [traceId, total]);

  useEffect(() => {
    if (!playing) return;
    if (step >= total - 1) {
      setPlaying(false);
      return;
    }
    const timer = setTimeout(() => setStep((s) => s + 1), BASE_DELAY_MS / speed);
    return () => clearTimeout(timer);
  }, [playing, step, total, speed]);

  return {
    step,
    total,
    playing,
    speed,
    setSpeed,
    next: () => setStep((s) => Math.min(total - 1, s + 1)),
    prev: () => setStep((s) => Math.max(0, s - 1)),
    reset: () => {
      setStep(0);
      setPlaying(false);
    },
    toggle: () => {
      if (step >= total - 1) setStep(0);
      setPlaying((p) => !p);
    },
  };
}
