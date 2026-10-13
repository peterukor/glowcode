import { describe, expect, it } from "vitest";
import type { Course, Lesson } from "@/courses/types";
import {
  emptyProgress,
  parseProgress,
  PROGRESS_VERSION,
  recordActivity,
  setLessonComplete,
  summarizeCourse,
  visitLesson,
  type ProgressState,
} from "./progress";
import { createSyncedState, createVersionedStore, memoryStorage } from "./storage";

const lesson = (id: string, status: Lesson["status"] = "published"): Lesson => ({
  id,
  title: id,
  description: "",
  status,
  objectives: [],
  sections: [],
});

const course = (lessons: Lesson[], id = "py"): Course => ({
  id,
  title: id,
  description: "",
  icon: "🐍",
  theme: "grape",
  status: "published",
  chapters: [{ id: "ch", title: "Ch", description: "", lessons }],
});

const now = new Date("2026-10-13T12:00:00Z");
const later = new Date("2026-10-14T12:00:00Z");

const store = (storage = memoryStorage()) =>
  createVersionedStore({ key: "p", version: PROGRESS_VERSION, empty: emptyProgress, parse: parseProgress, storage });

describe("progress rules", () => {
  it("opening a lesson is not completing it", () => {
    const s = visitLesson(emptyProgress(), "py", "a", now);
    const summary = summarizeCourse(course([lesson("a"), lesson("b")]), s.courses["py"]);
    expect(summary.completed).toBe(0);
    expect(summary.started).toBe(true);
    expect(summary.resumeLessonId).toBe("a");
  });

  it("keeps lessons completed when revisited, and keeps the first completion time", () => {
    let s = setLessonComplete(emptyProgress(), "py", "a", true, now);
    s = visitLesson(s, "py", "b", later);
    s = visitLesson(s, "py", "a", later);
    s = setLessonComplete(s, "py", "a", true, later);
    expect(s.courses["py"]!.completed["a"]).toBe(now.toISOString());
    expect(s.courses["py"]!.lastLessonId).toBe("a");
  });

  it("tracks each course independently", () => {
    let s = setLessonComplete(emptyProgress(), "py", "a", true, now);
    s = visitLesson(s, "git", "intro", now);
    expect(summarizeCourse(course([lesson("a")], "py"), s.courses["py"]).percent).toBe(100);
    expect(summarizeCourse(course([lesson("intro")], "git"), s.courses["git"]).percent).toBe(0);
  });

  it("counts published lessons only, and new lessons don't erase old progress", () => {
    let s = setLessonComplete(emptyProgress(), "py", "a", true, now);
    s = setLessonComplete(s, "py", "b", true, now);
    expect(summarizeCourse(course([lesson("a"), lesson("b"), lesson("draft", "draft")]), s.courses["py"]).percent).toBe(100);

    // A week later, a new lesson is published.
    const grown = course([lesson("a"), lesson("b"), lesson("c")]);
    const summary = summarizeCourse(grown, s.courses["py"]);
    expect(summary.completed).toBe(2);
    expect(summary.total).toBe(3);
    expect(summary.percent).toBe(67);
  });

  it("falls back to the first lesson if the last visited one is no longer published", () => {
    const s = visitLesson(emptyProgress(), "py", "removed", now);
    const summary = summarizeCourse(course([lesson("a"), lesson("removed", "draft")]), s.courses["py"]);
    expect(summary.resumeLessonId).toBe("a");
    expect(summary.lastLesson).toBeUndefined();
  });

  it("remembers the last activity", () => {
    const s = recordActivity(emptyProgress(), "py", "a", "predict-1", now);
    expect(s.courses["py"]!.lastActivity).toEqual({ lessonId: "a", activityId: "predict-1" });
  });
});

describe("versioned storage", () => {
  it("survives a reload (a page refresh)", () => {
    const storage = memoryStorage();
    const first = createSyncedState(store(storage));
    first.update((s) => setLessonComplete(s, "py", "a", true, now));
    const afterRefresh = createSyncedState(store(storage));
    expect(afterRefresh.get().courses["py"]!.completed["a"]).toBe(now.toISOString());
  });

  it("recovers from corrupted data and keeps a backup", () => {
    const storage = memoryStorage({ p: "{not json" });
    expect(store(storage).read()).toEqual(emptyProgress());
    expect(storage.dump()["p:backup"]).toBe("{not json");
  });

  it("does not misread data written by a newer version", () => {
    const raw = JSON.stringify({ version: 99, data: { anything: true } });
    const storage = memoryStorage({ p: raw });
    expect(store(storage).read()).toEqual(emptyProgress());
    expect(storage.dump()["p:backup"]).toBe(raw);
  });

  it("keeps good entries and drops malformed ones", () => {
    const saved: unknown = {
      courses: {
        py: { completed: { a: now.toISOString(), b: 42 }, lastLessonId: "a", lastActivity: { lessonId: 1 } },
        broken: "nope",
      },
    };
    const storage = memoryStorage({ p: JSON.stringify({ version: 1, data: saved }) });
    const s: ProgressState = store(storage).read();
    expect(Object.keys(s.courses)).toEqual(["py"]);
    expect(s.courses["py"]!.completed).toEqual({ a: now.toISOString() });
    expect(s.courses["py"]!.lastActivity).toBeUndefined();
  });
});
