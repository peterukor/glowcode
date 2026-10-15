import { describe, expect, it } from "vitest";
import { courses, getCourse } from "./registry";
import { findPublishedLesson, lessonNeighbors, publishedLessons, validateCourses, visibleChapters } from "./queries";
import { parseRichText } from "./richText";
import type { Course, Lesson } from "./types";

const lesson = (id: string, status: Lesson["status"] = "published"): Lesson => ({
  id,
  title: id,
  description: "",
  status,
  objectives: [],
  sections: [{ id: "s", title: "S", blocks: [{ type: "text", text: "hi" }] }],
});

const fixture: Course = {
  id: "fixture",
  title: "Fixture",
  description: "",
  icon: "🧪",
  theme: "sky",
  status: "published",
  chapters: [
    { id: "one", title: "One", description: "", lessons: [lesson("a"), lesson("secret", "draft"), lesson("b")] },
    { id: "two", title: "Two", description: "", lessons: [lesson("later", "coming-soon")] },
    { id: "hidden", title: "Hidden", description: "", lessons: [lesson("wip", "draft")] },
    { id: "three", title: "Three", description: "", lessons: [lesson("c")] },
  ],
};

describe("registry content", () => {
  it("has no content problems (ids, references, answers, walkthrough lines)", () => {
    expect(validateCourses(courses)).toEqual([]);
  });

  it("opens Python Fundamentals and keeps the other courses as Coming Soon", () => {
    expect(getCourse("python-fundamentals")?.status).toBe("published");
    for (const id of ["version-control", "computer-fundamentals", "java-fundamentals"]) {
      expect(getCourse(id)?.status).toBe("coming-soon");
      expect(publishedLessons(getCourse(id)!)).toHaveLength(0);
    }
  });

  it("starts Python with Chapter 1's lessons, in order", () => {
    const ids = publishedLessons(getCourse("python-fundamentals")!).map((e) => e.lesson.id);
    expect(ids.slice(0, 2)).toEqual(["what-is-programming", "how-computers-follow-instructions"]);
    expect(ids.at(-1)).toBe("chapter-2-review");
  });
});

describe("publication status", () => {
  it("never exposes draft lessons", () => {
    expect(publishedLessons(fixture).map((e) => e.lesson.id)).toEqual(["a", "b", "c"]);
    expect(findPublishedLesson(fixture, "secret")).toBeUndefined();
    expect(findPublishedLesson(fixture, "later")).toBeUndefined();
  });

  it("shows coming-soon lessons in navigation but hides drafts and empty chapters", () => {
    const chapters = visibleChapters(fixture);
    expect(chapters.map((c) => c.id)).toEqual(["one", "two", "three"]);
    expect(chapters[0]!.lessons.map((l) => l.id)).toEqual(["a", "b"]);
  });

  it("treats every lesson of an unpublished course as unopenable", () => {
    expect(publishedLessons({ ...fixture, status: "coming-soon" })).toHaveLength(0);
  });
});

describe("lesson navigation", () => {
  it("moves across chapters and skips drafts and coming-soon lessons", () => {
    expect(lessonNeighbors(fixture, "a").prev).toBeUndefined();
    expect(lessonNeighbors(fixture, "a").next?.lesson.id).toBe("b");
    expect(lessonNeighbors(fixture, "b").next?.lesson.id).toBe("c");
    expect(lessonNeighbors(fixture, "c").prev?.lesson.id).toBe("b");
    expect(lessonNeighbors(fixture, "c").next).toBeUndefined();
  });
});

describe("validateCourses", () => {
  it("reports duplicate lesson ids and broken references", () => {
    const broken: Course = {
      ...fixture,
      chapters: [
        {
          id: "x",
          title: "X",
          description: "",
          lessons: [lesson("dup"), { ...lesson("dup"), sections: [{ id: "s", title: "S", blocks: [{ type: "text", text: "[x](ref:nope.missing)" }] }] }],
        },
      ],
    };
    const problems = validateCourses([broken]);
    expect(problems.some((p) => p.includes('Duplicate lesson id "dup"'))).toBe(true);
    expect(problems.some((p) => p.includes('unknown reference "nope.missing"'))).toBe(true);
  });

  it("checks question choices, marked lines and reference links in feedback", () => {
    const withBlocks = (blocks: Lesson["sections"][number]["blocks"]): Course => ({
      ...fixture,
      chapters: [{ id: "x", title: "X", description: "", lessons: [{ ...lesson("l"), sections: [{ id: "s", title: "S", blocks }] }] }],
    });
    const problems = validateCourses([
      withBlocks([
        {
          type: "question",
          id: "q",
          variant: "predict",
          prompt: "?",
          choices: [
            { id: "a", text: "A", feedback: "See [this](ref:nope.feedback)." },
            { id: "a", text: "Also A" },
          ],
          answer: "b",
          explanation: "",
        },
        { type: "code", language: "python", code: "x = 1", highlightLines: [2] },
        { type: "reflect", id: "q", prompt: "Why?", answer: "Because." },
      ]),
    ]);
    expect(problems.some((p) => p.includes('answer "b" isn\'t one of its choices'))).toBe(true);
    expect(problems.some((p) => p.includes('Duplicate choice id "a"'))).toBe(true);
    expect(problems.some((p) => p.includes("line 2, which doesn't exist"))).toBe(true);
    expect(problems.some((p) => p.includes('unknown reference "nope.feedback"'))).toBe(true);
    expect(problems.some((p) => p.includes('Duplicate activity id "q"'))).toBe(true);
  });
});

describe("parseRichText", () => {
  it("splits code, bold and reference links", () => {
    expect(parseRichText("Use `print()` to **show** [a value](ref:concept.variable) or [`len()`](ref:python.builtins.len).")).toEqual([
      { kind: "text", text: "Use " },
      { kind: "code", text: "print()" },
      { kind: "text", text: " to " },
      { kind: "bold", text: "show" },
      { kind: "text", text: " " },
      { kind: "ref", id: "concept.variable", label: "a value", code: false },
      { kind: "text", text: " or " },
      { kind: "ref", id: "python.builtins.len", label: "len()", code: true },
      { kind: "text", text: "." },
    ]);
  });

  it("leaves plain text alone", () => {
    expect(parseRichText("just words")).toEqual([{ kind: "text", text: "just words" }]);
  });
});
