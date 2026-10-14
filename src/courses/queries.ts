/**
 * Read-only questions about course content. Pure functions over `Course` objects,
 * so they work the same for real content and for test fixtures.
 */
import { getReference } from "@/references/registry";
import type { Walkthrough } from "@/types/trace";
import { referencesIn } from "./richText";
import type { ActivityBlock, Block, Chapter, Course, Lesson, RichText } from "./types";
import { validateWalkthrough } from "@/walkthrough/validate";

export type LessonEntry = { lesson: Lesson; chapter: Chapter };

export const isOpenable = (course: Course) => course.status === "published";

export const isPlanned = (chapter: Chapter) => chapter.status === "planned";

/**
 * Chapters and lessons a student can see (published + coming soon), plus planned chapters
 * from the outline. Drafts are removed entirely, and so is a chapter left with nothing to show.
 */
export function visibleChapters(course: Course): Chapter[] {
  return course.chapters
    .map((ch) => ({ ...ch, lessons: ch.lessons.filter((l) => l.status !== "draft") }))
    .filter((ch) => ch.lessons.length > 0 || isPlanned(ch));
}

/** How much of the outline a student can open: chapters with at least one published lesson, and the rest. */
export function chapterCounts(course: Course) {
  const visible = visibleChapters(course);
  const available = visible.filter((ch) => ch.lessons.some((l) => l.status === "published")).length;
  return { available, upcoming: visible.length - available, total: visible.length };
}

/** Lessons a student can open, in reading order across chapters. */
export function publishedLessons(course: Course): LessonEntry[] {
  if (!isOpenable(course)) return [];
  return course.chapters.flatMap((chapter) =>
    chapter.lessons.filter((l) => l.status === "published").map((lesson) => ({ lesson, chapter })),
  );
}

export function findPublishedLesson(course: Course, lessonId: string): LessonEntry | undefined {
  return publishedLessons(course).find((e) => e.lesson.id === lessonId);
}

/** Previous / next openable lessons, crossing chapter boundaries. */
export function lessonNeighbors(course: Course, lessonId: string) {
  const list = publishedLessons(course);
  const i = list.findIndex((e) => e.lesson.id === lessonId);
  return { prev: i > 0 ? list[i - 1] : undefined, next: i >= 0 ? list[i + 1] : undefined };
}

/** Where a lesson sits within its own chapter, counting only lessons a student can open. */
export function lessonPosition(course: Course, lessonId: string) {
  const entry = findPublishedLesson(course, lessonId);
  if (!entry) return undefined;
  const inChapter = publishedLessons(course).filter((e) => e.chapter.id === entry.chapter.id);
  return { index: inChapter.findIndex((e) => e.lesson.id === lessonId) + 1, count: inChapter.length };
}

function blocksOf(lesson: Lesson): Block[] {
  return lesson.sections.flatMap((s) => s.blocks);
}

/** Activity id recorded when a student opens a walkthrough (for "resume where you left off"). */
export const walkthroughActivityId = (walkthroughId: string) => `walkthrough-${walkthroughId}`;

export function walkthroughsIn(lesson: Lesson): Walkthrough[] {
  return blocksOf(lesson).flatMap((b) => (b.type === "code" && b.walkthrough ? [b.walkthrough] : []));
}

export function activitiesIn(lesson: Lesson): ActivityBlock[] {
  return blocksOf(lesson).filter(
    (b): b is ActivityBlock => b.type === "question" || b.type === "reflect" || b.type === "practice",
  );
}

/** Every id "resume where you left off" can point at in a lesson: its activities and walkthroughs. */
export function resumableIdsIn(lesson: Lesson): Set<string> {
  return new Set([...activitiesIn(lesson).map((a) => a.id), ...walkthroughsIn(lesson).map((w) => walkthroughActivityId(w.id))]);
}

function richTextIn(block: Block): RichText[] {
  switch (block.type) {
    case "text":
      return [block.text];
    case "list":
      return block.items;
    case "callout":
      return [block.text];
    case "code":
      return block.caption ? [block.caption] : [];
    case "figure":
      return [block.caption, ...(block.figure.kind === "sequence" ? block.figure.steps : [])];
    case "question":
      return [
        block.prompt,
        block.explanation,
        ...(block.hint ? [block.hint] : []),
        ...block.choices.flatMap((c) => [c.text, ...(c.feedback ? [c.feedback] : [])]),
      ];
    case "reflect":
      return [block.prompt, block.answer];
    case "practice":
      return [
        block.prompt,
        ...(block.context ? [block.context] : []),
        ...(block.checklist ?? []),
        ...(block.hints ?? []),
        ...(block.solutionNote ? [block.solutionNote] : []),
        ...(block.alternatives ?? []).map((a) => a.note),
      ];
  }
}

/**
 * Catches content mistakes before students see them: duplicate ids, broken reference
 * links, answers that aren't one of the choices, broken walkthroughs. Run by the test suite.
 */
/** Reference ids linked from a lesson's text (inline [label](ref:id) links), in reading order. */
export function linkedReferencesIn(lesson: Lesson): string[] {
  return blocksOf(lesson).flatMap(richTextIn).flatMap(referencesIn);
}

export function validateCourses(courses: Course[]): string[] {
  const problems: string[] = [];
  const dup = (ids: string[], what: string, where = "") => {
    const seen = new Set<string>();
    for (const id of ids) {
      if (seen.has(id)) problems.push(`Duplicate ${what} id "${id}"${where ? ` in ${where}` : ""}`);
      seen.add(id);
    }
  };
  const urlSafe = (id: string, what: string) => {
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id)) problems.push(`${what} id "${id}" must be lowercase-with-dashes`);
  };

  dup(courses.map((c) => c.id), "course");
  const walkthroughIds: string[] = [];

  for (const course of courses) {
    urlSafe(course.id, "Course");
    if (course.status === "published" && publishedLessons(course).length === 0) {
      problems.push(`Course "${course.id}" is published but has no published lessons`);
    }
    dup(course.chapters.map((c) => c.id), "chapter", course.id);
    for (const chapter of course.chapters) {
      urlSafe(chapter.id, "Chapter");
      if (isPlanned(chapter) && chapter.lessons.length > 0) {
        problems.push(`Chapter "${chapter.id}" is planned but has lessons; publish them or remove the planned status`);
      }
      if (!isPlanned(chapter) && chapter.lessons.length === 0) {
        problems.push(`Chapter "${chapter.id}" has no lessons; mark it planned`);
      }
    }
    const lessons = course.chapters.flatMap((c) => c.lessons);
    dup(lessons.map((l) => l.id), "lesson", course.id);

    for (const lesson of lessons) {
      const where = `${course.id}/${lesson.id}`;
      urlSafe(lesson.id, "Lesson");
      dup(lesson.sections.map((s) => s.id), "section", where);
      dup(activitiesIn(lesson).map((a) => a.id), "activity", where);
      walkthroughIds.push(...walkthroughsIn(lesson).map((w) => w.id));

      const refs = [...(lesson.references ?? []), ...linkedReferencesIn(lesson)];
      for (const id of refs) if (!getReference(id)) problems.push(`${where}: unknown reference "${id}"`);

      for (const block of blocksOf(lesson)) {
        if (block.type === "question") {
          if (!block.choices.some((c) => c.id === block.answer)) {
            problems.push(`${where}: question "${block.id}" answer "${block.answer}" isn't one of its choices`);
          }
          dup(block.choices.map((c) => c.id), "choice", `${where} question "${block.id}"`);
        }
        if (block.type === "code" && block.highlightLines) {
          const lineCount = block.code.split("\n").length;
          for (const line of block.highlightLines) {
            if (line < 1 || line > lineCount) problems.push(`${where}: highlightLines mentions line ${line}, which doesn't exist`);
          }
        }
        if (block.type === "code" && block.walkthrough && block.walkthrough.code !== block.code) {
          problems.push(`${where}: walkthrough "${block.walkthrough.id}" code differs from the code shown in the lesson`);
        }
        if (block.type === "code" && block.walkthrough) {
          problems.push(...validateWalkthrough(block.walkthrough).map((p) => `${where}: ${p}`));
        }
      }
    }
  }
  dup(walkthroughIds, "walkthrough");
  return problems;
}
