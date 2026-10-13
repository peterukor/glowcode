/**
 * The shape of all course content. Content files only produce these plain objects;
 * React components decide how they look.
 *
 * Ordering: array position is display order. IDs are what persist (URLs, progress),
 * so lessons can be reordered or inserted without breaking anyone's saved progress.
 */
import type { Language, Walkthrough } from "@/types/trace";
import type { Variables } from "@/types/python";
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

export type CalloutTone = "real-world" | "tip" | "mindset" | "careful" | "other-languages";

export type Block =
  | { type: "text"; text: RichText }
  | { type: "list"; items: RichText[]; ordered?: boolean }
  | { type: "callout"; tone: CalloutTone; title?: string; text: RichText }
  | CodeBlock
  | FigureBlock
  | QuestionBlock
  | PracticeBlock;

export type CodeBlock = {
  type: "code";
  code: string;
  language: Language;
  caption?: RichText;
  /** What the program prints, shown under the code. */
  output?: string[];
  /** Adds "Walk through code" for a step-by-step view of this snippet. */
  walkthrough?: Walkthrough;
};

/** A static illustration drawn with an existing visualization component. */
export type FigureBlock = {
  type: "figure";
  caption: RichText;
  figure: { kind: "variables"; vars: Variables; highlight?: string };
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
  choices: { id: string; text: RichText }[];
  answer: string;
  /** Shown after answering; explain why, not just what. */
  explanation: RichText;
};

export type PracticeBlock = {
  type: "practice";
  id: string;
  prompt: RichText;
  hints?: RichText[];
  /** A sample solution the student can reveal after trying. */
  solution: string;
  solutionNote?: RichText;
};

export type ActivityBlock = QuestionBlock | PracticeBlock;
