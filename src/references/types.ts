/**
 * The shape of a reference (manual) entry. Plain data, no React: lessons, the manual pages
 * and a future code editor all read the same entries.
 *
 * Only `id`, `scope`, `category`, `title`, `summary` and `explanation` are required. Add the
 * other fields when they apply: a concept like "variable" has no parameters, while a
 * built-in function should say what it returns, prints and changes.
 */
import type { RichText } from "@/courses/types";
import type { CallEvent, Walkthrough } from "@/types/trace";

/** General programming ideas, or one language. Java entries will use "java". */
export type ReferenceScope = "concept" | "python" | "java";

export type ReferenceCategory = "concept" | "data-type" | "built-in" | "method" | "keyword" | "operator" | "error";

export type ReferenceParameter = {
  name: string;
  description: RichText;
  optional?: boolean;
};

/** A read-only example. Everything here is checked against real Python by `check:python`. */
export type ReferenceExample = {
  code: string;
  /** What the program prints, line by line. When `input` is given, include what the user typed, as it appears on screen. */
  output?: string[];
  /** Lines the user types for `input()`, in order. */
  input?: string[];
  caption?: RichText;
  /** Draws the call as inputs → function → returns / prints / changes (reuses FunctionView). */
  call?: CallEvent;
  /** An existing curated walkthrough of exactly this code. Never write one just for decoration. */
  walkthrough?: Walkthrough;
};

export type ReferenceMistake = {
  title: RichText;
  explanation: RichText;
  code?: string;
  input?: string[];
  /** The last line of the error Python prints for `code`, e.g. "NameError: name 'x' is not defined". */
  error?: string;
  /** What `code` prints when the mistake doesn't crash (it just does the wrong thing). */
  output?: string[];
  /** The code never finishes (an infinite loop), so it isn't run by the checker. */
  neverEnds?: boolean;
};

export type ReferenceEntry = {
  /**
   * Stable, used in URLs and lesson links: `<scope>.<group>.<name>`, e.g. `python.builtins.print`.
   * Methods live under their type: `python.types.str.upper`. Concepts: `concept.variable`.
   * Never change an id once lessons link to it.
   */
  id: string;
  scope: ReferenceScope;
  category: ReferenceCategory;
  /** As students would write it: "print()", "str.upper()", "if", "NameError". */
  title: string;
  /** One or two plain sentences. Shown in hover popups and search results. */
  summary: string;
  /** Other names students might search for: "uppercase", "elif". */
  aliases?: string[];
  /** Words and phrases that should find this entry: "add item", "not defined". */
  keywords?: string[];
  /** For methods: the id of the type they belong to. */
  parent?: string;

  /** What it is and why you'd use it, in short paragraphs. */
  explanation: RichText[];
  /** How to write it, as code. */
  syntax?: string;
  parameters?: ReferenceParameter[];
  /** Accepted types or important restrictions. */
  accepts?: RichText;
  /** For functions and methods, the three outcomes are always shown side by side. */
  returns?: RichText;
  prints?: RichText;
  changes?: RichText;
  examples?: ReferenceExample[];
  mistakes?: ReferenceMistake[];
  /** Entries that help understand this one. Chosen by hand, not "everything in the category". */
  related?: string[];
};
