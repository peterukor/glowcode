import type { Chapter } from "@/courses/types";

/**
 * Chapters 3–10 of the Python Fundamentals outline (Phase 6). They show in the course
 * contents as "Planned" and have no lessons until they're written; see COURSE_OUTLINE.md.
 * When a chapter gets its first lesson, move it to its own folder like getting-started/.
 */
const planned = (id: string, title: string, description: string): Chapter => ({ id, title, description, status: "planned", lessons: [] });

export const plannedChapters: Chapter[] = [
  planned("operators-expressions", "Operators & Expressions", "Arithmetic, comparisons and how Python works out an expression step by step."),
  planned("conditionals", "Making Decisions with Conditionals", "Run different code depending on whether something is true."),
  planned("loops", "Repetition with Loops", "Repeat instructions without copying them, with for and while loops."),
  planned("strings", "Strings", "Work with text: characters, indexes, slices and string methods."),
  planned("lists-collections", "Lists & Collections", "Keep many values together in lists, tuples and dictionaries."),
  planned("functions", "Functions", "Name a set of instructions, give it inputs and get a value back."),
  planned("errors-debugging", "Errors & Debugging", "Read error messages and track down mistakes methodically."),
  planned("putting-it-together", "Putting It Together", "Combine everything in small, complete programs."),
];
