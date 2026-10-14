/**
 * Student progress: pure data and pure functions. Nothing here touches storage or React,
 * which keeps it easy to test and to move to a server later.
 *
 * Everything is keyed by stable course and lesson ids, so adding, reordering or
 * unpublishing lessons never erases what a student has done.
 */
import { findPublishedLesson, publishedLessons, resumableIdsIn, type LessonEntry } from "@/courses/queries";
import type { Course } from "@/courses/types";

export type CourseProgress = {
  lastLessonId?: string;
  /** The last practice / question a student worked on, so they can pick up mid-lesson. */
  lastActivity?: { lessonId: string; activityId: string };
  /** ISO timestamp. */
  lastVisitedAt?: string;
  /** lessonId -> ISO timestamp of completion. */
  completed: Record<string, string>;
};

export type ProgressState = { courses: Record<string, CourseProgress> };

export const PROGRESS_VERSION = 1;

export const emptyProgress = (): ProgressState => ({ courses: {} });

const emptyCourse = (): CourseProgress => ({ completed: {} });

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const isString = (v: unknown): v is string => typeof v === "string";

/**
 * Reads saved progress defensively: keeps every entry that makes sense and drops the
 * rest, instead of throwing away a student's whole history over one bad field.
 */
export function parseProgress(data: unknown, _fromVersion: number): ProgressState | undefined {
  if (!isRecord(data) || !isRecord(data["courses"])) return undefined;
  const courses: Record<string, CourseProgress> = {};
  for (const [courseId, raw] of Object.entries(data["courses"])) {
    if (!isRecord(raw)) continue;
    const completed: Record<string, string> = {};
    if (isRecord(raw["completed"])) {
      for (const [lessonId, at] of Object.entries(raw["completed"])) if (isString(at)) completed[lessonId] = at;
    }
    const cp: CourseProgress = { completed };
    if (isString(raw["lastLessonId"])) cp.lastLessonId = raw["lastLessonId"];
    if (isString(raw["lastVisitedAt"])) cp.lastVisitedAt = raw["lastVisitedAt"];
    const la = raw["lastActivity"];
    if (isRecord(la) && isString(la["lessonId"]) && isString(la["activityId"])) {
      cp.lastActivity = { lessonId: la["lessonId"], activityId: la["activityId"] };
    }
    courses[courseId] = cp;
  }
  return { courses };
}

function withCourse(state: ProgressState, courseId: string, change: (cp: CourseProgress) => CourseProgress): ProgressState {
  const current = state.courses[courseId] ?? emptyCourse();
  return { ...state, courses: { ...state.courses, [courseId]: change(current) } };
}

export function visitLesson(state: ProgressState, courseId: string, lessonId: string, now: Date): ProgressState {
  return withCourse(state, courseId, (cp) => ({ ...cp, lastLessonId: lessonId, lastVisitedAt: now.toISOString() }));
}

export function recordActivity(state: ProgressState, courseId: string, lessonId: string, activityId: string, now: Date) {
  return withCourse(state, courseId, (cp) => ({
    ...cp,
    lastLessonId: lessonId,
    lastActivity: { lessonId, activityId },
    lastVisitedAt: now.toISOString(),
  }));
}

export function setLessonComplete(state: ProgressState, courseId: string, lessonId: string, complete: boolean, now: Date) {
  return withCourse(state, courseId, (cp) => {
    const completed = { ...cp.completed };
    if (complete) completed[lessonId] ??= now.toISOString();
    else delete completed[lessonId];
    return { ...cp, completed };
  });
}

export function isLessonComplete(cp: CourseProgress | undefined, lessonId: string): boolean {
  return Boolean(cp?.completed[lessonId]);
}

export type CourseSummary = {
  total: number;
  completed: number;
  /** 0–100, counting published lessons only. */
  percent: number;
  /** Most recently visited lesson, if it's still published. */
  lastLesson?: LessonEntry;
  started: boolean;
  /** Where "Start" / "Continue" should go. */
  resumeLessonId?: string;
};

export function summarizeCourse(course: Course, cp: CourseProgress | undefined): CourseSummary {
  const lessons = publishedLessons(course);
  const completed = lessons.filter((e) => isLessonComplete(cp, e.lesson.id)).length;
  const lastLesson = cp?.lastLessonId ? findPublishedLesson(course, cp.lastLessonId) : undefined;
  return {
    total: lessons.length,
    completed,
    percent: lessons.length ? Math.round((completed / lessons.length) * 100) : 0,
    lastLesson,
    started: Boolean(lastLesson) || completed > 0,
    resumeLessonId: lastLesson?.lesson.id ?? lessons[0]?.lesson.id,
  };
}

/**
 * Where "Continue" should land: the last lesson, scrolled to the last activity if the
 * student was working on one in that lesson. Undefined for courses with no lessons.
 */
export function resumeTarget(course: Course, cp: CourseProgress | undefined) {
  const { resumeLessonId } = summarizeCourse(course, cp);
  if (!resumeLessonId) return undefined;
  const saved = cp?.lastActivity?.lessonId === resumeLessonId ? cp.lastActivity.activityId : undefined;
  // Content moves between lessons (Phase 6 moved several activities). A saved activity that
  // isn't in the lesson any more is ignored, so the student lands at the top instead of nowhere.
  const lesson = findPublishedLesson(course, resumeLessonId)?.lesson;
  const activity = saved && lesson && resumableIdsIn(lesson).has(saved) ? saved : undefined;
  return { lessonId: resumeLessonId, hash: activity ? `activity-${activity}` : undefined };
}
