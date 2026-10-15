import { describe, expect, it } from "vitest";
import { courses, getCourse } from "@/courses/registry";
import { activitiesIn, chapterCounts, lessonNeighbors, lessonPosition, linkedReferencesIn, resumableIdsIn, validateCourses, walkthroughsIn } from "@/courses/queries";
import type { Block, Lesson, QuestionBlock } from "@/courses/types";
import { emptyProgress, recordActivity, resumeTarget, setLessonComplete, summarizeCourse } from "@/progress/progress";
import { getReference } from "@/references/registry";
import type { Walkthrough } from "@/types/trace";
import { initialPlayback, reducePlayback, viewPlayback, type PlaybackAction, type PlaybackState } from "@/walkthrough/controller";
import { validateWalkthrough } from "@/walkthrough/validate";
import { variables } from "./chapters/variables/chapter";

const course = getCourse("python-fundamentals")!;
const lessons = variables.lessons;
const lesson = (id: string) => lessons.find((l) => l.id === id)!;
const blocks = (l: Lesson): Block[] => l.sections.flatMap((s) => s.blocks);
const questions = (l: Lesson) => activitiesIn(l).filter((a): a is QuestionBlock => a.type === "question");
const walkthrough = (id: string) => lessons.flatMap(walkthroughsIn).find((w) => w.id === id)!;
const run = (w: Walkthrough, actions: PlaybackAction[]): PlaybackState => actions.reduce((s, a) => reducePlayback(w, s, a), initialPlayback);
const usesInput = (code: string | undefined) => !!code && /\binput\s*\(/.test(code);

describe("Chapter 2 structure", () => {
  it("has eight published lessons in teaching order, after Chapter 1", () => {
    expect(lessons.map((l) => l.id)).toEqual([
      "why-variables-exist",
      "values-and-types",
      "creating-variables",
      "using-variables",
      "reassignment",
      "type-conversion",
      "getting-input",
      "chapter-2-review",
    ]);
    expect(lessons.every((l) => l.status === "published")).toBe(true);
    expect(course.chapters[1]).toBe(variables);
    expect(lessonNeighbors(course, "why-variables-exist").prev?.lesson.id).toBe("chapter-1-review");
    expect(lessonPosition(course, "reassignment")).toEqual({ index: 5, count: 8 });
  });

  it("is complete, and leaves Chapter 1 complete and Chapters 3–10 planned", () => {
    expect(variables.status).toBe("complete");
    expect(course.chapters[0]!.status).toBe("complete");
    expect(course.chapters.slice(2).every((c) => c.status === "planned" && c.lessons.length === 0)).toBe(true);
    expect(course.chapters[2]!.title).toBe("Operators & Expressions");
    expect(chapterCounts(course)).toEqual({ available: 2, upcoming: 8, total: 10 });
  });

  it("uses unique, valid ids and references across the app", () => {
    expect(validateCourses(courses)).toEqual([]);
    const all = course.chapters.flatMap((c) => c.lessons);
    expect(new Set(all.map((l) => l.id)).size).toBe(all.length);
  });

  it("gives every lesson objectives, an opening reason and a short recap", () => {
    for (const l of lessons) {
      expect(l.objectives.length, l.id).toBeGreaterThanOrEqual(3);
      expect(l.sections[0]!.id === "why" || l.sections[0]!.id === "how-to-use", l.id).toBe(true);
      const last = l.sections.at(-1)!;
      expect(last.id).toBe("key-ideas");
      expect(last.blocks).toHaveLength(1);
      expect(last.blocks[0]!.type).toBe("list");
    }
  });

  it("asks for a prediction and gives practice in every lesson", () => {
    for (const l of lessons) {
      const predictsInWalkthrough = walkthroughsIn(l).some((w) => w.steps.some((s) => s.checkpoint));
      expect(questions(l).some((q) => q.variant === "predict") || predictsInWalkthrough, l.id).toBe(true);
      expect(activitiesIn(l).some((a) => a.type === "practice"), l.id).toBe(true);
    }
  });

  it("explains every wrong answer, in questions and in walkthrough checkpoints", () => {
    for (const l of lessons) {
      for (const q of questions(l)) for (const c of q.choices) if (c.id !== q.answer) expect(c.feedback, `${l.id}/${q.id}/${c.id}`).toBeTruthy();
      for (const w of walkthroughsIn(l)) {
        for (const s of w.steps) if (s.checkpoint) for (const c of s.checkpoint.choices) if (c.id !== s.checkpoint.answer) expect(c.feedback, `${w.id}/${c.id}`).toBeTruthy();
      }
    }
  });

  it("never prints a walkthrough's output above it when the walkthrough asks for a prediction", () => {
    for (const l of lessons) {
      for (const b of blocks(l)) if (b.type === "code" && b.walkthrough?.steps.some((s) => s.checkpoint)) expect(b.output, `${l.id}/${b.walkthrough.id}`).toBeUndefined();
    }
  });

  it("doesn't describe variables as boxes that contain values", () => {
    const text = JSON.stringify(lessons).toLowerCase();
    for (const phrase of ["stored in a box", "inside the box", "box that holds", "box called", "variable holds", "variable contains", "stored inside"]) {
      expect(text.includes(phrase), phrase).toBe(false);
    }
  });
});

describe("Chapter 2 manual links", () => {
  const linked = new Set(lessons.flatMap((l) => [...linkedReferencesIn(l), ...(l.references ?? [])]));

  it("links every entry the chapter relies on, and each one exists", () => {
    for (const id of [
      "concept.variable",
      "python.operators.assignment",
      "python.types.int",
      "python.types.float",
      "python.types.str",
      "python.types.bool",
      "python.types.None",
      "python.builtins.print",
      "python.builtins.input",
      "python.builtins.int",
      "python.builtins.float",
      "python.builtins.str",
      "python.builtins.type",
      "python.errors.NameError",
      "python.errors.ValueError",
    ]) {
      expect(linked.has(id), id).toBe(true);
      expect(getReference(id), id).toBeTruthy();
    }
  });
});

describe("Chapter 2 walkthroughs", () => {
  it("are all valid", () => {
    for (const w of lessons.flatMap(walkthroughsIn)) expect(validateWalkthrough(w), w.id).toEqual([]);
  });

  it("score = score + 5: read, calculate, produce, rebind, print, and score changes only at the rebind", () => {
    const w = walkthrough("py-score-reassign");
    const line2 = w.steps.filter((s) => s.line === 2);
    expect(line2.map((s) => s.calc?.phase)).toEqual(["read", "calculate", "calculate", "assign"]);
    expect(line2[1]!.calc!.done).toEqual({}); // calculating: no result yet
    expect(line2[2]!.calc!.done).toEqual({ add: "15" }); // the result is produced...
    for (const s of line2.slice(0, 3)) expect(s.vars.score).toEqual({ type: "int", value: 10 }); // ...but not stored
    expect(line2[3]!.vars.score).toEqual({ type: "int", value: 15 });
    expect(w.steps.at(-1)!.output).toEqual(["15"]);
  });

  it("asks what score refers to before the rebind, without showing the rebind", () => {
    const w = walkthrough("py-score-reassign");
    const i = w.steps.findIndex((s) => s.checkpoint);
    expect(w.steps[i]!.vars.score).toEqual({ type: "int", value: 10 });
    const s = run(w, Array(i + 2).fill({ type: "next" }));
    expect(s.index).toBe(i - 1); // stopped before the prediction step
    expect(viewPlayback(w, s).step.vars.score).toEqual({ type: "int", value: 10 });
  });

  it("supports Previous, Next and Reset on the reassignment walkthrough", () => {
    const w = walkthrough("py-score-reassign");
    const i = w.steps.findIndex((st) => st.checkpoint);
    let s = run(w, [...Array(i - 1).fill({ type: "next" }), { type: "reveal" }, { type: "next" }, { type: "next" }]);
    expect(s.index).toBe(w.steps.length - 1);
    expect(viewPlayback(w, s).step.output).toEqual(["15"]);
    s = reducePlayback(w, s, { type: "prev" });
    expect(viewPlayback(w, s).step.vars.score).toEqual({ type: "int", value: 15 });
    expect(viewPlayback(w, s).step.output).toBeUndefined();
    s = reducePlayback(w, s, { type: "reset" });
    expect(s.index).toBe(0);
    for (let k = 0; k < i; k++) s = reducePlayback(w, s, { type: "next" });
    expect(s.index).toBe(i - 1); // Reset asks the prediction again instead of skipping past it
    expect(viewPlayback(w, s).waiting?.index).toBe(i);
  });

  it("b = a: b keeps 10 after a is rebound", () => {
    const w = walkthrough("py-independent-names");
    const after = w.steps.find((s) => s.line === 3)!;
    expect(after.vars).toEqual({ a: { type: "int", value: 20 }, b: { type: "int", value: 10 } });
    expect(w.steps.at(-1)!.output).toEqual(["10"]);
  });

  it("int(): the string goes in, an int comes back (not printed), and only then is age assigned", () => {
    const w = walkthrough("py-int-conversion");
    const calls = w.steps.filter((s) => s.call?.name === "int");
    expect(calls.map((s) => s.call!.phase)).toEqual(["call", "result", "assign"]);
    expect(calls[0]!.call!.args).toEqual(['"18"']);
    expect(calls[1]!.call!.returns).toBe("18");
    expect(calls[1]!.call!.prints).toBeUndefined();
    expect("age" in calls[1]!.vars).toBe(false);
    expect(calls[2]!.vars.age).toEqual({ type: "int", value: 18 });
    expect(calls[2]!.vars.age_text).toEqual({ type: "str", value: "18" });
  });

  it("input(): returns a string from labelled sample input", () => {
    const w = walkthrough("py-input-age");
    expect(w.input).toEqual(["18"]);
    const ret = w.steps.find((s) => s.call?.name === "input" && s.call.phase === "result")!;
    expect(ret.call!.returns).toBe('"18"');
    const stored = w.steps.find((s) => "age_text" in s.vars)!;
    expect(stored.vars.age_text).toEqual({ type: "str", value: "18" });
    expect(w.steps.at(-1)!.output).toEqual(["How old are you? 18", "19"]);
  });
});

describe("Chapter 2 sample input", () => {
  it("gives every program that calls input() a sample answer, so nothing pretends the student typed", () => {
    for (const l of lessons) {
      for (const b of blocks(l)) {
        if (b.type === "code" && usesInput(b.code)) {
          expect(b.input?.length, `${l.id} code`).toBeGreaterThan(0);
          if (b.walkthrough) expect(b.walkthrough.input, `${l.id}/${b.walkthrough.id}`).toEqual(b.input);
        }
        if (b.type === "question" && usesInput(b.code)) expect(b.input?.length, `${l.id}/${b.id}`).toBeGreaterThan(0);
        if (b.type === "practice" && usesInput(b.solution)) expect(b.input?.length, `${l.id}/${b.id}`).toBeGreaterThan(0);
      }
    }
  });

  it("says plainly in the notes that the answer comes from a sample user", () => {
    for (const id of ["py-input-name", "py-input-age"]) {
      const notes = walkthrough(id).steps.map((s) => s.note).join(" ");
      expect(notes, id).toMatch(/sample user/);
      expect(notes.toLowerCase(), id).not.toMatch(/\byou typ/);
    }
  });
});

describe("Chapter 2 answers and errors", () => {
  const answerOf = (lessonId: string, qid: string) => questions(lesson(lessonId)).find((q) => q.id === qid)!.answer;

  it("marks the right choice for each question", () => {
    expect(answerOf("why-variables-exist", "predict-change-name")).toBe("grace");
    expect(answerOf("values-and-types", "predict-print-none")).toBe("none");
    expect(answerOf("values-and-types", "predict-type-price-text")).toBe("str");
    expect(answerOf("values-and-types", "predict-which-bool")).toBe("bool");
    expect(answerOf("creating-variables", "predict-valid-name")).toBe("valid");
    expect(answerOf("creating-variables", "debug-backwards-assignment")).toBe("left");
    expect(answerOf("creating-variables", "debug-name-with-space")).toBe("space");
    expect(answerOf("using-variables", "predict-name-vs-text")).toBe("word");
    expect(answerOf("using-variables", "debug-name-case")).toBe("case");
    expect(answerOf("using-variables", "debug-misspelled-variable")).toBe("fix");
    expect(answerOf("reassignment", "predict-score")).toBe("5");
    expect(answerOf("reassignment", "predict-trace-points")).toBe("right");
    expect(answerOf("type-conversion", "debug-mixed-plus")).toBe("mixed");
    expect(answerOf("type-conversion", "predict-convert-then-join")).toBe("joined");
    expect(answerOf("type-conversion", "debug-int-word")).toBe("content");
    expect(answerOf("getting-input", "predict-two-inputs")).toBe("joined");
    expect(answerOf("getting-input", "debug-input-word")).toBe("convert");
    expect(answerOf("chapter-2-review", "review-trace-xy")).toBe("right");
    expect(answerOf("chapter-2-review", "review-names-independent")).toBe("right");
    expect(answerOf("chapter-2-review", "review-convert-or-join")).toBe("right");
    expect(answerOf("chapter-2-review", "review-input-type")).toBe("right");
  });

  it("includes the brief's x/y trace, with 8 and 13 as the answer", () => {
    const q = questions(lesson("chapter-2-review")).find((x) => x.id === "review-trace-xy")!;
    expect(q.code).toBe("x = 5\ny = x\nx = x + 3\ny = y + x\n\nprint(x)\nprint(y)");
    expect(q.choices.find((c) => c.id === q.answer)!.text).toBe("`8`, then `13`");
  });

  it("shows real tracebacks for NameError, TypeError, ValueError and SyntaxError", () => {
    const debug = lessons.flatMap(questions).filter((q) => q.variant === "debug");
    const kinds = new Set(debug.map((q) => /^(\w+Error):/m.exec(q.errorOutput!)?.[1]));
    expect([...kinds].sort()).toEqual(["NameError", "SyntaxError", "TypeError", "ValueError"]);
    for (const q of debug) expect(q.errorOutput, q.id).toMatch(/File "main\.py", line \d/);
  });
});

describe("progress across the Phase 7 rewrite", () => {
  const now = new Date("2026-10-15T12:00:00Z");

  it("keeps completion saved under the original lesson id", () => {
    const s = setLessonComplete(emptyProgress(), course.id, "why-variables-exist", true, now);
    expect(summarizeCourse(course, s.courses[course.id]).completed).toBe(1);
  });

  it("keeps the Phase 3 activity ids, now in the lessons that teach them", () => {
    expect(resumableIdsIn(lesson("using-variables")).has("debug-name-case")).toBe(true);
    expect(resumableIdsIn(lesson("using-variables")).has("reflect-use-before-create")).toBe(true);
    expect(resumableIdsIn(lesson("reassignment")).has("predict-score")).toBe(true);
    expect(resumableIdsIn(lesson("reassignment")).has("reflect-earlier-print")).toBe(true);
    expect(resumableIdsIn(lesson("reassignment")).has("practice-player-level")).toBe(true);
  });

  it("opens the first lesson at the top when the saved activity has moved", () => {
    const s = recordActivity(emptyProgress(), course.id, "why-variables-exist", "walkthrough-py-birthday", now);
    expect(resumeTarget(course, s.courses[course.id])).toEqual({ lessonId: "why-variables-exist", hash: undefined });
  });
});
