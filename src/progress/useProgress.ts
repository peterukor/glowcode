/**
 * The app's single progress store, plus React hooks to read and change it.
 * Swapping localStorage for an account-backed service means replacing `progressStore`.
 */
import { useSyncExternalStore } from "react";
import {
  emptyProgress,
  parseProgress,
  PROGRESS_VERSION,
  recordActivity,
  setLessonComplete,
  visitLesson,
  type CourseProgress,
} from "./progress";
import { createSyncedState, createVersionedStore, type SyncedState } from "./storage";

export const progressState = createSyncedState(
  createVersionedStore({ key: "glowcode:progress", version: PROGRESS_VERSION, empty: emptyProgress, parse: parseProgress }),
);

export type PanelPrefs = { contentsOpen: boolean; assistantOpen: boolean };

export const prefsState = createSyncedState(
  createVersionedStore<PanelPrefs>({
    key: "glowcode:prefs",
    version: 1,
    empty: () => ({ contentsOpen: true, assistantOpen: true }),
    parse: (data) =>
      typeof data === "object" && data !== null
        ? {
            contentsOpen: (data as Partial<PanelPrefs>).contentsOpen !== false,
            assistantOpen: (data as Partial<PanelPrefs>).assistantOpen !== false,
          }
        : undefined,
  }),
);

// Keep tabs in sync: progress made in one tab shows up in the others.
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === "glowcode:progress") progressState.reload();
    if (e.key === "glowcode:prefs") prefsState.reload();
  });
}

function useSynced<T>(state: SyncedState<T>): T {
  return useSyncExternalStore(state.subscribe, state.get, state.get);
}

export function useCourseProgress(courseId: string): CourseProgress | undefined {
  return useSynced(progressState).courses[courseId];
}

export function useAllProgress() {
  return useSynced(progressState);
}

export const progressActions = {
  visitLesson: (courseId: string, lessonId: string) =>
    progressState.update((s) => visitLesson(s, courseId, lessonId, new Date())),
  recordActivity: (courseId: string, lessonId: string, activityId: string) =>
    progressState.update((s) => recordActivity(s, courseId, lessonId, activityId, new Date())),
  setComplete: (courseId: string, lessonId: string, complete: boolean) =>
    progressState.update((s) => setLessonComplete(s, courseId, lessonId, complete, new Date())),
};

export function usePanelPrefs(): [PanelPrefs, (change: Partial<PanelPrefs>) => void] {
  const prefs = useSynced(prefsState);
  return [prefs, (change) => prefsState.update((p) => ({ ...p, ...change }))];
}
