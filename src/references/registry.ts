/**
 * Minimal reference (manual / glossary) entries, so lessons can link to stable IDs today.
 * The full manual (syntax, arguments, examples, common mistakes, pages) arrives in Phase 3
 * and extends `ReferenceEntry`; lesson content won't need to change.
 *
 * ID convention: <language|concept>.<category>.<name>, e.g.
 *   concept.variable  ·  python.builtins.print  ·  python.types.str.upper
 * Methods live under their type (python.types.list.append), matching the manual's tree.
 */

export type ReferenceCategory = "concept" | "keyword" | "data-type" | "operator" | "built-in" | "method" | "error";

export type ReferenceEntry = {
  id: string;
  title: string;
  category: ReferenceCategory;
  /** One or two plain-English sentences, shown on hover / focus / tap. */
  summary: string;
};

const entries = [
  {
    id: "concept.program",
    title: "Program",
    category: "concept",
    summary: "A list of instructions, written in a programming language, that a computer carries out in order.",
  },
  {
    id: "concept.programming-language",
    title: "Programming language",
    category: "concept",
    summary: "A precise written language for instructions that both people and computers can read. Python and Java are programming languages.",
  },
  {
    id: "concept.interpreter",
    title: "Interpreter",
    category: "concept",
    summary: "The program that reads your Python code and carries it out, one instruction at a time, from the top.",
  },
  {
    id: "concept.variable",
    title: "Variable",
    category: "concept",
    summary: "A name that refers to a value, so a program can remember the value and use it later.",
  },
  {
    id: "python.builtins.print",
    title: "print()",
    category: "built-in",
    summary: "Shows values as text in the console. It displays information; it doesn't give a value back to your program (it returns None).",
  },
  {
    id: "python.operators.assignment",
    title: "= (assignment)",
    category: "operator",
    summary: "Works out the value on the right, then makes the name on the left refer to it. It is not the math 'equals'.",
  },
  {
    id: "python.operators.addition",
    title: "+ (addition)",
    category: "operator",
    summary: "Adds two numbers. With two strings it joins them instead: \"Hi, \" + \"Sam\" gives \"Hi, Sam\".",
  },
  {
    id: "python.types.int",
    title: "int",
    category: "data-type",
    summary: "Whole numbers like 13, 0 or -5. Short for integer.",
  },
  {
    id: "python.types.str",
    title: "str",
    category: "data-type",
    summary: "Text, written inside quotes like \"Ada\". Short for string: a string of characters.",
  },
  {
    id: "python.errors.NameError",
    title: "NameError",
    category: "error",
    summary: "Python stopped because the code used a name it doesn't know. Usually a typo, a capital letter, or a variable used before it was created.",
  },
] as const satisfies readonly ReferenceEntry[];

export type ReferenceId = (typeof entries)[number]["id"];

const byId = new Map<string, ReferenceEntry>(entries.map((e) => [e.id, e]));

export function getReference(id: string): ReferenceEntry | undefined {
  return byId.get(id);
}

export const allReferences: readonly ReferenceEntry[] = entries;
