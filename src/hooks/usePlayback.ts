import { useEffect, useState } from "react";
import type { Walkthrough } from "@/types/trace";
import { initialPlayback, reducePlayback, viewPlayback, type PlaybackAction, type PlaybackState } from "@/walkthrough/controller";

const BASE_DELAY_MS = 1200;

export type Playback = ReturnType<typeof usePlayback>;

/**
 * React glue for the playback controller (`src/walkthrough/controller.ts`), plus optional
 * autoplay. Manual stepping is the default; autoplay stops at the end and at predictions.
 * Loading a different walkthrough starts over.
 */
export function usePlayback(walkthrough: Walkthrough) {
  const [state, setState] = useState<PlaybackState>(initialPlayback);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [loaded, setLoaded] = useState(walkthrough.id);
  if (loaded !== walkthrough.id) {
    setLoaded(walkthrough.id);
    setState(initialPlayback);
    setPlaying(false);
  }

  const view = viewPlayback(walkthrough, state);
  const dispatch = (action: PlaybackAction) => setState((s) => reducePlayback(walkthrough, s, action));

  useEffect(() => {
    if (!playing) return;
    if (!view.canNext) {
      setPlaying(false);
      return;
    }
    const timer = setTimeout(() => setState((s) => reducePlayback(walkthrough, s, { type: "next" })), BASE_DELAY_MS / speed);
    return () => clearTimeout(timer);
  }, [playing, view.canNext, view.index, speed, walkthrough]);

  return {
    view,
    dispatch,
    // The shape PlaybackControls uses.
    step: view.index,
    total: view.total,
    blocked: view.waiting !== undefined,
    playing,
    speed,
    setSpeed,
    next: () => dispatch({ type: "next" }),
    prev: () => dispatch({ type: "prev" }),
    reset: () => {
      setPlaying(false);
      dispatch({ type: "reset" });
    },
    toggle: () => {
      if (playing) return setPlaying(false);
      if (view.index >= view.total - 1) dispatch({ type: "rewind" });
      else if (view.waiting) return;
      setPlaying(true);
    },
  };
}
