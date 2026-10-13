/**
 * The shape of all course content. Content files only produce these plain objects;
 * React components decide how they look.
 *
 * Ordering: array position is display order. IDs are what persist (URLs, progress),
 * so lessons can be reordered or inserted without breaking anyone's saved progress.
 */
import type { Language, Walkthrough } from "@/types/trace";
import type { PyValue, Variables } from "@/types/python";
import type { ReferenceId } from "@/references/registry";

/**
 * - published:   visible and openable
 * - coming-soon: visible but not openable (a teaser)
 * - draft:       invisible to students; can't be opened by URL either
 */
export type PublicationStatus = "published" | "coming-soon" | "draft";

export type CourseTheme = "grape" | "sky" | "teal" | "coral" | "sun";

export type Course = {
  /** Stable, URL-safe. Never change once students have progress. */
  id: string;
  title: string;
  description: string;
  /** An emoji, matching the rest of Glowcode's iconography. */
  icon: string;
  theme: CourseTheme;
  status: PublicationStatus;
  language?: Language;
  chapters: Chapter[];
};

export type Chapter = {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
};

export type Lesson = {
  /** Stable, URL-safe, unique within its course. */
  id: string;
  title: string;
  /** One sentence shown in navigation and cards. */
  description: string;
  status: PublicationStatus;
  /** "By the end of this lesson you can…" statements. */
  objectives: string[];
  sections: LessonSection[];
  /** Reference entries to list under "Look it up". Inline links live in the text itself. */
  references?: ReferenceId[];
};

/** A titled part of a lesson. Its id doubles as a page anchor (#id). */
export type LessonSection = {
  id: string;
  title: string;
  blocks: Block[];
};

/**
 * Inline text with a tiny markup:
 *   `code`   **bold**   [label](ref:python.builtins.print)
 */
export type RichText = string;

/**
 * Use callouts sparingly: one or two per section at most.
 * - real-world: connects the idea to something familiar
 * - execution: a short "how Python runs this" explanation
 * - mindset: a programmer-thinking prompt
 * - tip / careful: practical advice or a common trap
 * - other-languages: an optional comparison that beginners can skip
 */
export type CalloutTone = "real-world" | "execution" | "mindset" | "tip" | "careful" | "other-languages";

export type Block =
  | { type: "text"; text: RichText }
  | { type: "list"; items: RichText[]; ordered?: boolean }
  | { type: "callout"; tone: CalloutTone; title?: string; text: RichText }
  | CodeBlock
  | FigureBlock
  | QuestionBlock
  | ReflectBlock
  | PracticeBlock;

export type CodeBlock = {
  type: "code";
  code: string;
  language: Language;
  caption?: RichText;
  /**
   * What the program prints to the screen (via print()), shown under the code as
   * "Printed output". Never use it for return values.
   */
  output?: string[];
  /** Lines the surrounding text talks about, marked in the margin (1-indexed). */
  highlightLines?: number[];
  /** Adds "Walk through code" for a step-by-step view of this snippet. */
  walkthrough?: Walkthrough;
};

/** A static concept illustration. Always introduce it in the text and give it a caption. */
export type FigureBlock = {
  type: "figure";
  caption: RichText;
  figure:
    | { kind: "variables"; vars: Variables; highlight?: string }
    /** Names pointing at values: Python's actual model. `previous` shows a value the name used to refer to. */
    | { kind: "names"; bindings: { name: string; value: PyValue; previous?: PyValue }[] }
    /** A short ordered process, drawn as connected steps (e.g. how instructions are followed). */
    | { kind: "sequence"; steps: RichText[] };
};

/**
 * Activities have ids so progress can remember the last one a student worked on.
 * Ids only need to be unique within their lesson.
 */
export type QuestionBlock = {
  type: "question";
  id: string;
  /** predict: "what will this print?"  debug: "what's wrong here?" */
  variant: "predict" | "debug";
  prompt: RichText;
  code?: string;
  /** What Python printed when the code ran, e.g. an error message for debug questions. */
  errorOutput?: string;
  /**
   * Answer options. `feedback` on a wrong choice explains the misunderstanding behind it
   * without giving the answer away, so the student can try again.
   */
  choices: { id: string; text: RichText; feedback?: RichText }[];
  answer: string;
  /** An optional nudge students can ask for before answering. */
  hint?: RichText;
  /** Shown once the student gets it right or chooses to reveal it; explain why, not just what. */
  explanation: RichText;
};

/**
 * An open "think it through" prompt: the student reasons on their own (or out loud),
 * then reveals a model explanation to compare with. Nothing is typed or graded.
 */
export type ReflectBlock = {
  type: "reflect";
  id: string;
  prompt: RichText;
  code?: string;
  /** The model explanation, revealed on request. */
  answer: RichText;
};

/**
 * A task students solve on paper, in their own editor or in their head.
 * Glowcode never runs or checks their code; it offers hints and a sample to compare with.
 */
export type PracticeBlock = {
  type: "practice";
  id: string;
  /** The goal, in one or two sentences. */
  prompt: RichText;
  /** Optional background that makes the goal concrete. */
  context?: RichText;
  /** What a working solution should do, for students to check their own work against. */
  checklist?: RichText[];
  /** Revealed one at a time, from a gentle nudge to a more specific step. */
  hints?: RichText[];
  /** A sample solution the student can reveal after trying. */
  solution: string;
  /** Why the sample works: the reasoning, not a restatement of the code. */
  solutionNote?: RichText;
  /** Other valid approaches worth knowing about. */
  alternatives?: { code?: string; note: RichText }[];
};

export type ActivityBlock = QuestionBlock | ReflectBlock | PracticeBlock;
