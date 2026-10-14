/**
 * Finds the words in a code snippet that can safely link to a reference entry.
 *
 * Correctness comes before coverage. A word only links when the snippet itself shows what
 * it means:
 * - a built-in function (print, len, input, type) when it's called, isn't after a dot,
 *   and the snippet never defines or assigns that name itself (`print = 5` shadows it);
 * - a statement keyword (if, elif, for, while) at the start of a line, and `else` only
 *   when it closes an if/elif at the same indentation (not a for/while/try `else`);
 * - a method (upper, append) only when the receiver's type is certain: a string literal,
 *   or a name whose every assignment in the snippet is a literal / input() / str() of that
 *   type, and that is never bound any other way (loop variable, parameter, import...).
 * Words inside strings and comments never link. Anything unclear stays plain text.
 *
 * Pure function over text, so a future code editor can use it as-is.
 */
import { allReferences } from "./registry";
import { significant, tokenizeLine, type Token } from "./code/pythonTokens";

export type CodeReference = {
  /** 1-indexed line. */
  line: number;
  /** Character offsets within the line, end exclusive. */
  start: number;
  end: number;
  id: string;
};

const pythonEntries = allReferences.filter((e) => e.scope === "python");
const callName = (title: string) => title.replace(/\(\)$/, "");

const BUILTINS = new Map(pythonEntries.filter((e) => e.category === "built-in").map((e) => [callName(e.title), e.id]));
const KEYWORDS = new Map<string, string>([
  ...pythonEntries.filter((e) => e.category === "keyword").map((e) => [e.title, e.id] as [string, string]),
  ["elif", "python.keywords.if"],
]);
/** "str" → { upper: "python.types.str.upper" } */
const METHODS = new Map<string, Map<string, string>>();
for (const e of pythonEntries.filter((x) => x.category === "method" && x.parent)) {
  const typeName = e.parent!.split(".").at(-1)!;
  const method = callName(e.title.slice(e.title.indexOf(".") + 1));
  if (!METHODS.has(typeName)) METHODS.set(typeName, new Map());
  METHODS.get(typeName)!.set(method, e.id);
}

type Line = { n: number; indent: number; tokens: Token[]; sig: Token[] };

const isAssignOp = (t: Token) => t.kind === "op" && (t.text === "=" || /^(\*\*|\/\/|[+\-*/%])=$/.test(t.text));
const OPEN = new Set(["(", "[", "{"]);
const CLOSE = new Set([")", "]", "}"]);

/** Index of the matching closing bracket for the opener at `i`, or -1. */
function closing(sig: Token[], i: number): number {
  let depth = 0;
  for (let j = i; j < sig.length; j++) {
    if (OPEN.has(sig[j]!.text)) depth++;
    else if (CLOSE.has(sig[j]!.text) && --depth === 0) return j;
  }
  return -1;
}

/** What a right-hand side certainly evaluates to, if we can tell from the text alone. */
function literalType(rhs: Token[], bound: Set<string>): string | undefined {
  if (rhs.length === 1 && rhs[0]!.kind === "string" && !/^[bB]/.test(rhs[0]!.text)) return "str";
  if (rhs[0]?.text === "[" && closing(rhs, 0) === rhs.length - 1) return "list";
  const head = rhs[0];
  if (head?.kind === "name" && rhs[1]?.text === "(" && closing(rhs, 1) === rhs.length - 1 && !bound.has(head.text)) {
    if (head.text === "input" || head.text === "str") return "str";
  }
  return undefined;
}

export function findPythonReferences(code: string): CodeReference[] {
  const lines: Line[] = code.split("\n").map((text, i) => {
    const tokens = tokenizeLine(text);
    return { n: i + 1, indent: text.length - text.trimStart().length, tokens, sig: significant(tokens) };
  });

  // 1. Every name the snippet binds itself, and the types we can be sure of.
  const bound = new Set<string>();
  const kinds = new Map<string, Set<string>>(); // name → types of its assignments ("?" = unknown)
  const addKind = (name: string, kind: string) => {
    if (!kinds.has(name)) kinds.set(name, new Set());
    kinds.get(name)!.add(kind);
  };
  let starImport = false;
  const assignments: { name: string; rhs: Token[] }[] = [];

  for (const { sig } of lines) {
    const names = sig.filter((t) => t.kind === "name");
    const has = (word: string) => sig.some((t) => t.kind === "name" && t.text === word);
    if (has("import")) {
      if (sig.some((t) => t.text === "*")) starImport = true;
      names.forEach((t) => (bound.add(t.text), addKind(t.text, "?")));
      continue;
    }
    if (has("def") || has("class") || has("lambda") || has("global") || has("nonlocal")) {
      // Function names, parameters, class names: all bound, types unknown.
      const from = sig.findIndex((t) => ["def", "class", "lambda", "global", "nonlocal"].includes(t.text));
      const to = sig[from]!.text === "lambda" ? sig.findIndex((t, i) => i > from && t.text === ":") : sig.length;
      sig.slice(from + 1, to < 0 ? sig.length : to).forEach((t) => t.kind === "name" && (bound.add(t.text), addKind(t.text, "?")));
    }
    sig.forEach((t, i) => {
      if (t.text === "for") {
        // Loop variables, in statements and comprehensions: everything up to `in`.
        for (let j = i + 1; j < sig.length && sig[j]!.text !== "in"; j++) {
          if (sig[j]!.kind === "name") (bound.add(sig[j]!.text), addKind(sig[j]!.text, "?"));
        }
      }
      if (t.text === "as" && sig[i + 1]?.kind === "name") (bound.add(sig[i + 1]!.text), addKind(sig[i + 1]!.text, "?"));
      if (t.text === ":=" && sig[i - 1]?.kind === "name") (bound.add(sig[i - 1]!.text), addKind(sig[i - 1]!.text, "?"));
    });

    // Assignment targets: names before the last top-level `=` (or `+=` ...), not after a dot.
    let depth = 0;
    let last = -1;
    sig.forEach((t, i) => {
      if (OPEN.has(t.text)) depth++;
      else if (CLOSE.has(t.text)) depth--;
      else if (depth === 0 && isAssignOp(t)) last = i;
    });
    if (last < 0) continue;
    const targets = sig.slice(0, last).filter((t, i, arr) => t.kind === "name" && arr[i - 1]?.text !== ".");
    targets.forEach((t) => bound.add(t.text));
    const simple = last === 1 && sig[0]!.kind === "name" && sig[1]!.text === "=";
    if (simple) assignments.push({ name: sig[0]!.text, rhs: sig.slice(2) });
    else targets.forEach((t) => addKind(t.text, "?"));
  }
  for (const a of assignments) addKind(a.name, literalType(a.rhs, bound) ?? "?");
  const typeOf = (name: string) => {
    const k = kinds.get(name);
    return k && k.size === 1 && !k.has("?") ? [...k][0] : undefined;
  };

  // 2. Links.
  const refs: CodeReference[] = [];
  const link = (line: number, t: Token, id: string) => refs.push({ line, start: t.start, end: t.start + t.text.length, id });

  lines.forEach((ln, li) => {
    const { sig, n } = ln;
    const first = sig[0];
    if (first?.kind === "name" && KEYWORDS.has(first.text)) {
      if (first.text !== "else" || closesIf(lines, li)) link(n, first, KEYWORDS.get(first.text)!);
    }
    sig.forEach((t, i) => {
      if (t.kind !== "name" || sig[i + 1]?.text !== "(") return;
      const before = sig[i - 1];
      if (before?.text === ".") {
        const receiver = sig[i - 2];
        const type = receiver?.kind === "string" && !/^[bB]/.test(receiver.text) ? "str" : receiver?.kind === "name" ? typeOf(receiver.text) : undefined;
        const id = type ? METHODS.get(type)?.get(t.text) : undefined;
        if (id) link(n, t, id);
        return;
      }
      const id = BUILTINS.get(t.text);
      if (id && !bound.has(t.text) && !starImport && before?.text !== "def") link(n, t, id);
    });
  });
  return refs;
}

/** True when the `else` on line `li` belongs to an if/elif at the same indentation. */
function closesIf(lines: Line[], li: number): boolean {
  const indent = lines[li]!.indent;
  for (let j = li - 1; j >= 0; j--) {
    const ln = lines[j]!;
    if (!ln.sig.length || ln.indent > indent) continue;
    return ln.indent === indent && (ln.sig[0]!.text === "if" || ln.sig[0]!.text === "elif");
  }
  return false;
}

/** The language-neutral entry point (lessons, the manual, and later the IDE). */
export function findCodeReferences(code: string, language: string): CodeReference[] {
  return language === "python" ? findPythonReferences(code) : [];
}
