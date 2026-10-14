import { describe, expect, it } from "vitest";
import { courses, getCourse } from "@/courses/registry";
import {
  activitiesIn,
  chapterCounts,
  isPlanned,
  lessonNeighbors,
  lessonPosition,
  linkedReferencesIn,
  publishedLessons,
  resumableIdsIn,
  validateCourses,
  visibleChapters,
  walkthroughsIn,
} from "@/courses/queries";
import type { Lesson, QuestionBlock } from "@/courses/types";
import { emptyProgress, recordActivity, resumeTarget, setLessonComplete, summarizeCourse, visitLesson } from "@/progress/progress";
import { getReference } from "@/references/registry";
import type { Walkthrough } from "@/types/trace";
import { initialPlayback, reducePlayback, viewPlayback, type PlaybackAction, type PlaybackState } from "@/walkthrough/controller";
import { validateWalkthrough } from "@/walkthrough/validate";
import { gettingStarted } from "./chapters/getting-started/chapter";

const course = getCourse("python-fundamentals")!;
const lessons = gettingStarted.lessons;
const lessonById = (id: string) => lessons.find((l) => l.id === id)!;
const questions = (lesson: Lesson) => activitiesIn(lesson).filter((a): a is QuestionBlock => a.type === "question");
const walkthrough = (id: string) => lessons.flatMap(walkthroughsIn).find((w) => w.id === id)!;
const run = (w: Walkthrough, actions: PlaybackAction[]): PlaybackState => actions.reduce((s, a) => reducePlayback(w, s, a), initialPlayback);
const NEXT: PlaybackAction = { type: "next" };
const REVEAL: PlaybackAction = { type: "reveal" };

describe("Python Fundamentals outline", () => {
  it("lists the ten Phase 6 chapters in order", () => {
    expect(course.chapters.map((c) => c.title)).toEqual([
      "Getting Started with Programming",
      "Variables, Values & Data Types",
      "Operators & Expressions",
      "Making Decisions with Conditionals",
      "Repetition with Loops",
      "Strings",
      "Lists & Collections",
      "Functions",
      "Errors & Debugging",
      "Putting It Together",
    ]);
  });

  it("keeps chapters 3–10 planned, with no placeholder lessons", () => {
    const planned = course.chapters.slice(2);
    expect(planned.every(isPlanned)).toBe(true);
    expect(planned.every((c) => c.lessons.length === 0)).toBe(true);
    expect(isPlanned(course.chapters[0]!)).toBe(false);
    expect(course.chapters[1]!.status).toBe("in-progress");
  });

  it("shows planned chapters in the contents and counts what's available", () => {
    expect(visibleChapters(course)).toHaveLength(10);
    expect(chapterCounts(course)).toEqual({ available: 2, upcoming: 8, total: 10 });
  });

  it("keeps the existing ids for chapters already in use", () => {
    expect(course.chapters[0]!.id).toBe("getting-started");
    expect(course.chapters[1]!.id).toBe("variables");
  });

  it("rejects a planned chapter with lessons, and an empty chapter that isn't planned", () => {
    const broken = { ...course, chapters: [{ ...gettingStarted, status: "planned" as const }, { ...gettingStarted, id: "empty", lessons: [] }] };
    const problems = validateCourses([broken]);
    expect(problems.some((p) => p.includes('"getting-started" is planned but has lessons'))).toBe(true);
    expect(problems.some((p) => p.includes('"empty" has no lessons'))).toBe(true);
  });
});

describe("Chapter 1 structure", () => {
  it("has six published lessons in teaching order", () => {
    expect(lessons.map((l) => l.id)).toEqual([
      "what-is-programming",
      "how-computers-follow-instructions",
      "first-python-program",
      "print-and-output",
      "reading-code-step-by-step",
      "chapter-1-review",
    ]);
    expect(lessons.every((l) => l.status === "published")).toBe(true);
  });

  it("numbers lessons within their chapter", () => {
    expect(lessonPosition(course, "first-python-program")).toEqual({ index: 3, count: 6 });
    expect(lessonPosition(course, "why-variables-exist")).toEqual({ index: 1, count: 1 });
    expect(lessonPosition(course, "no-such-lesson")).toBeUndefined();
  });

  it("opens the course with Chapter 1, followed by the existing variables lesson", () => {
    expect(publishedLessons(course).map((e) => e.lesson.id)).toEqual([...lessons.map((l) => l.id), "why-variables-exist"]);
  });

  it("uses lesson, activity and walkthrough ids that are unique across the whole app", () => {
    expect(validateCourses(courses)).toEqual([]);
    const all = courses.flatMap((c) => c.chapters.flatMap((ch) => ch.lessons));
    expect(new Set(all.map((l) => l.id)).size).toBe(all.length);
    const activityIds = lessons.flatMap((l) => activitiesIn(l).map((a) => a.id));
    expect(new Set(activityIds).size).toBe(activityIds.length);
  });

  it("gives every lesson objectives and ends it with a short recap", () => {
    for (const lesson of lessons) {
      expect(lesson.objectives.length).toBeGreaterThanOrEqual(3);
      const last = lesson.sections.at(-1)!;
      expect(last.id).toBe("key-ideas");
      expect(last.blocks).toHaveLength(1);
      expect(last.blocks[0]!.type).toBe("list");
    }
  });

  it("asks for a prediction in every lesson, and practice in every lesson that writes Python", () => {
    for (const lesson of lessons) {
      expect(questions(lesson).some((q) => q.variant === "predict"), lesson.id).toBe(true);
    }
    for (const lesson of lessons.slice(2)) {
      expect(activitiesIn(lesson).some((a) => a.type === "practice"), lesson.id).toBe(true);
    }
  });

  it("uses a walkthrough where Python is running code, and none in the introduction or the review", () => {
    expect(lessons.map((l) => walkthroughsIn(l).map((w) => w.id))).toEqual([
      [],
      ["py-three-messages"],
      ["py-hello-program"],
      ["py-print-values"],
      ["py-trace-ready"],
      [],
    ]);
  });

  it("doesn't print a walkthrough's output under the code when the walkthrough asks for a prediction", () => {
    for (const lesson of lessons) {
      for (const block of lesson.sections.flatMap((sec) => sec.blocks)) {
        if (block.type === "code" && block.walkthrough?.steps.some((st) => st.checkpoint)) expect(block.output, `${lesson.id}/${block.walkthrough.id}`).toBeUndefined();
      }
    }
  });

  it("explains every wrong answer instead of just marking it wrong", () => {
    for (const lesson of lessons) {
      for (const q of questions(lesson)) {
        for (const c of q.choices) if (c.id !== q.answer) expect(c.feedback, `${lesson.id}/${q.id}/${c.id}`).toBeTruthy();
        expect(q.explanation.length).toBeGreaterThan(40);
      }
      for (const w of walkthroughsIn(lesson)) {
        for (const step of w.steps) {
          const cp = step.checkpoint;
          if (cp) for (const c of cp.choices) if (c.id !== cp.answer) expect(c.feedback, `${w.id}/${c.id}`).toBeTruthy();
        }
      }
    }
  });
});

describe("Chapter 1 answers", () => {
  const answerOf = (lessonId: string, questionId: string) => questions(lessonById(lessonId)).find((q) => q.id === questionId)!.answer;

  it("marks the right choice for each question", () => {
    expect(answerOf("what-is-programming", "predict-robot-water")).toBe("spill");
    expect(answerOf("how-computers-follow-instructions", "predict-socks")).toBe("shoes");
    expect(answerOf("how-computers-follow-instructions", "predict-code-vs-output")).toBe("text");
    expect(answerOf("first-python-program", "predict-single-quotes")).toBe("text");
    expect(answerOf("first-python-program", "debug-capital-print")).toBe("case");
    expect(answerOf("print-and-output", "predict-quoted-sum")).toBe("text");
    expect(answerOf("print-and-output", "predict-print-keeps")).toBe("shows");
    expect(answerOf("print-and-output", "debug-missing-quotes")).toBe("quotes");
    expect(answerOf("print-and-output", "debug-missing-parenthesis")).toBe("paren");
    expect(answerOf("reading-code-step-by-step", "predict-second-line")).toBe("five");
    expect(answerOf("reading-code-step-by-step", "predict-next-statement")).toBe("three");
    expect(answerOf("chapter-1-review", "review-last-line")).toBe("ten");
    expect(answerOf("chapter-1-review", "review-next-line")).toBe("line3");
    expect(answerOf("chapter-1-review", "review-code-vs-output")).toBe("code");
    expect(answerOf("chapter-1-review", "review-debug-misspelled")).toBe("spelling");
    expect(answerOf("chapter-1-review", "review-debug-syntax")).toBe("quote");
    expect(answerOf("chapter-1-review", "review-order-countdown")).toBe("cbda");
  });

  it("shows the real Python error for every debug question", () => {
    const debug = lessons.flatMap(questions).filter((q) => q.variant === "debug");
    expect(debug.map((q) => q.id)).toEqual([
      "debug-capital-print",
      "debug-missing-quotes",
      "debug-missing-parenthesis",
      "review-debug-misspelled",
      "review-debug-syntax",
    ]);
    for (const q of debug) {
      expect(q.code).toBeTruthy();
      expect(q.errorOutput).toMatch(/File "main\.py", line \d/);
      expect(q.errorOutput).toMatch(/(NameError|SyntaxError): /);
    }
  });
});

describe("Chapter 1 review", () => {
  const review = lessonById("chapter-1-review");

  it("is open, last in the chapter, and leads on to Chapter 2", () => {
    expect(publishedLessons(course).some((e) => e.lesson.id === review.id)).toBe(true);
    expect(lessonNeighbors(course, review.id).prev?.lesson.id).toBe("reading-code-step-by-step");
    expect(lessonNeighbors(course, review.id).next?.lesson.id).toBe("why-variables-exist");
  });

  it("checks understanding in several different ways", () => {
    const qs = questions(review);
    expect(qs.filter((q) => q.variant === "predict").length).toBeGreaterThanOrEqual(3);
    expect(qs.filter((q) => q.variant === "debug")).toHaveLength(2);
    expect(activitiesIn(review).filter((a) => a.type === "reflect")).toHaveLength(1);
    expect(activitiesIn(review).filter((a) => a.type === "practice")).toHaveLength(2);
    expect(review.sections.map((s) => s.id)).toEqual(["how-to-use", "predict-and-trace", "explain", "find-the-error", "put-in-order", "practice", "key-ideas"]);
  });
});

describe("Chapter 1 manual links", () => {
  const linked = new Set(lessons.flatMap(linkedReferencesIn));

  it("links the key beginner terms from the lesson text", () => {
    for (const id of ["concept.program", "concept.statement", "concept.python", "python.builtins.print", "python.types.str", "python.types.int", "concept.expression"]) {
      expect(linked.has(id), id).toBe(true);
    }
  });

  it("only links entries that exist", () => {
    for (const lesson of lessons) {
      for (const id of [...linkedReferencesIn(lesson), ...(lesson.references ?? [])]) expect(getReference(id), `${lesson.id} → ${id}`).toBeTruthy();
    }
  });

  it("adds focused entries for the new beginner concepts", () => {
    expect(getReference("concept.statement")?.title).toBe("Statement");
    expect(getReference("concept.expression")?.title).toBe("Expression");
    expect(getReference("concept.python")?.title).toBe("Python");
    expect(getReference("python.errors.SyntaxError")?.category).toBe("error");
  });

  it("doesn't link the same term over and over in one lesson", () => {
    for (const lesson of lessons) {
      const counts = new Map<string, number>();
      for (const id of linkedReferencesIn(lesson)) counts.set(id, (counts.get(id) ?? 0) + 1);
      for (const [id, n] of counts) expect(n, `${lesson.id} links ${id} ${n} times`).toBeLessThanOrEqual(2);
    }
  });
});

describe("Chapter 1 walkthroughs", () => {
  it("are all valid", () => {
    for (const w of lessons.flatMap(walkthroughsIn)) expect(validateWalkthrough(w), w.id).toEqual([]);
  });

  it("py-three-messages: output appears one line per statement, and asks before line 2", () => {
    const w = walkthrough("py-three-messages");
    expect(w.steps.map((s) => s.line)).toEqual([1, 2, 3]);
    expect(w.steps.map((s) => s.output)).toEqual([["Hello"], ["Hello", "Welcome"], ["Hello", "Welcome", "Let's learn Python"]]);
    const s = run(w, [NEXT]);
    expect(s.index).toBe(0); // waiting for a prediction: line 2's output isn't shown yet
    expect(viewPlayback(w, s).step.output).toEqual(["Hello"]);
    expect(viewPlayback(w, run(w, [REVEAL])).step.output).toEqual(["Hello", "Welcome"]);
  });

  it("py-hello-program: nothing is printed until print() has run", () => {
    const w = walkthrough("py-hello-program");
    expect(w.code).toBe('print("Hello, world!")');
    expect(w.steps[0]!.output).toEqual([]);
    expect(w.steps[0]!.call?.phase).toBe("call");
    expect(w.steps[1]!.output).toEqual(["Hello, world!"]);
    expect(viewPlayback(w, initialPlayback).waiting?.index).toBe(1);
  });

  it("py-print-values: keeps print's output and its return value apart", () => {
    const w = walkthrough("py-print-values");
    expect(w.steps.at(-1)!.output).toEqual(["Hello", "42", "42"]);
    for (const step of w.steps) expect(step.call?.returns).toBe("None");
    expect(w.steps.map((s) => s.call?.args[0])).toEqual(['"Hello"', '"Hello"', "42", '"42"']);
  });

  it("py-trace-ready: evaluates 10 + 5 before print() gets it, and prints 15 only after", () => {
    const w = walkthrough("py-trace-ready");
    const evaluating = w.steps.findIndex((s) => s.evaluation);
    expect(w.steps[evaluating]!.evaluation).toEqual(["10 + 5", "15"]);
    expect(w.steps[evaluating]!.call?.args).toEqual(["15"]);
    expect(w.steps[evaluating]!.output).toEqual(["Ready"]); // worked out, not printed yet
    expect(w.steps[evaluating + 1]!.output).toEqual(["Ready", "15"]);
    expect(w.steps.at(-1)!.output).toEqual(["Ready", "15", "Done"]);
  });

  it("supports Previous, Next and Reset without revealing a future step", () => {
    const w = walkthrough("py-trace-ready");
    let s = run(w, [NEXT]);
    expect(s.index).toBe(0); // blocked by the prediction before the evaluation
    s = run(w, [{ type: "check", choiceId: "expression" }]);
    expect(s.index).toBe(0); // a wrong answer reveals nothing
    s = run(w, [{ type: "check", choiceId: "result" }, REVEAL, NEXT, NEXT]);
    expect(s.index).toBe(3);
    expect(viewPlayback(w, s).step.output).toEqual(["Ready", "15", "Done"]);
    s = reducePlayback(w, s, { type: "prev" });
    expect(viewPlayback(w, s).step.output).toEqual(["Ready", "15"]);
    s = reducePlayback(w, s, { type: "reset" });
    expect(s.index).toBe(0);
    expect(viewPlayback(w, s).waiting?.index).toBe(1); // Reset asks again
  });
});

describe("progress across the Phase 6 changes", () => {
  const now = new Date("2026-10-13T12:00:00Z");
  const later = new Date("2026-10-14T12:00:00Z");

  it("keeps completion saved under the original lesson id", () => {
    const s = setLessonComplete(emptyProgress(), course.id, "what-is-programming", true, now);
    const summary = summarizeCourse(course, s.courses[course.id]);
    expect(summary.completed).toBe(1);
    expect(summary.total).toBe(publishedLessons(course).length);
  });

  it("drops a saved activity that moved to another lesson, instead of linking to nothing", () => {
    // Before Phase 6, debug-capital-print and the hello walkthrough were in lesson 1.
    let s = visitLesson(emptyProgress(), course.id, "what-is-programming", now);
    s = recordActivity(s, course.id, "what-is-programming", "debug-capital-print", later);
    expect(resumeTarget(course, s.courses[course.id])).toEqual({ lessonId: "what-is-programming", hash: undefined });
    s = recordActivity(s, course.id, "what-is-programming", "walkthrough-py-hello-program", later);
    expect(resumeTarget(course, s.courses[course.id])).toEqual({ lessonId: "what-is-programming", hash: undefined });
  });

  it("still resumes at an activity that's where it was saved", () => {
    const s = recordActivity(emptyProgress(), course.id, "what-is-programming", "reflect-exact-instructions", now);
    expect(resumeTarget(course, s.courses[course.id])).toEqual({ lessonId: "what-is-programming", hash: "activity-reflect-exact-instructions" });
  });

  it("keeps the moved activities' ids, so their own saved answers still apply", () => {
    const ids = new Set(lessons.flatMap((l) => [...resumableIdsIn(l)]));
    for (const id of ["predict-socks", "reflect-exact-instructions", "debug-capital-print", "practice-morning-routine", "walkthrough-py-hello-program"]) {
      expect(ids.has(id), id).toBe(true);
    }
  });
});
