/**
 * Read-only questions about course content. Pure functions over `Course` objects,
 * so they work the same for real content and for test fixtures.
 */
import { getReference } from "@/references/registry";
import type { Walkthrough } from "@/types/trace";
import { referencesIn } from "./richText";
import type { ActivityBlock, Block, Chapter, Course, Lesson, RichText } from "./types";

export type LessonEntry = { lesson: Lesson; chapter: Chapter };

export const isOpenable = (course: Course) => course.status === "published";

/** Chapters and lessons a student can see (published + coming soon). Drafts are removed entirely. */
export function visibleChapters(course: Course): Chapter[] {
  return course.chapters
    .map((ch) => ({ ...ch, lessons: ch.lessons.filter((l) => l.status !== "draft") }))
    .filter((ch) => ch.lessons.length > 0);
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
 * links, answers that aren't one of the choices. Run by the test suite.
 */
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
    const lessons = course.chapters.flatMap((c) => c.lessons);
    dup(lessons.map((l) => l.id), "lesson", course.id);

    for (const lesson of lessons) {
      const where = `${course.id}/${lesson.id}`;
      urlSafe(lesson.id, "Lesson");
      dup(lesson.sections.map((s) => s.id), "section", where);
      dup(activitiesIn(lesson).map((a) => a.id), "activity", where);
      walkthroughIds.push(...walkthroughsIn(lesson).map((w) => w.id));

      const refs = [...(lesson.references ?? []), ...blocksOf(lesson).flatMap(richTextIn).flatMap(referencesIn)];
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
          const lineCount = block.walkthrough.code.split("\n").length;
          for (const step of block.walkthrough.steps) {
            if (step.line < 1 || step.line > lineCount) {
              problems.push(`${where}: walkthrough "${block.walkthrough.id}" points at line ${step.line}, which doesn't exist`);
            }
          }
        }
      }
    }
  }
  dup(walkthroughIds, "walkthrough");
  return problems;
}
