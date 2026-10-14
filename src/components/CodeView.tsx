import { Fragment, type ReactNode } from "react";
import { tokenizeLine } from "@/references/code/pythonTokens";
import type { CodeReference } from "@/references/codeLinks";
import { ReferenceLink } from "@/references/ReferenceLink";
import { useOverflows } from "@/hooks/useOverflows";

const KEYWORDS = new Set(["def", "return", "if", "else", "elif", "for", "while", "in", "and", "or", "not", "is", "True", "False", "None", "import", "from", "class", "break", "continue", "pass", "with", "as", "lambda"]);
const FUNCTIONS = new Set(["print", "len", "input", "str", "int", "float", "bool", "type", "range", "list", "append", "upper", "lower"]);

/** Colour for one token: good enough for short beginner snippets, no dependency needed. */
function tokenClass(kind: string, text: string) {
  if (kind === "comment") return "text-syn-com italic";
  if (kind === "string") return "text-syn-str";
  if (kind === "number") return "text-syn-num";
  if (kind === "name" && KEYWORDS.has(text)) return "text-syn-kw font-semibold";
  if (kind === "name" && FUNCTIONS.has(text)) return "text-syn-fn";
  return "";
}

/** One highlighted line. Tokens that start a reference become terms that explain themselves. */
function renderLine(line: string, refs: CodeReference[]): ReactNode[] {
  return tokenizeLine(line).map((t, i) => {
    const cls = tokenClass(t.kind, t.text);
    const ref = refs.find((r) => r.start === t.start && r.end === t.start + t.text.length);
    const body = cls ? <span className={cls}>{t.text}</span> : t.text;
    if (ref) {
      return (
        <span key={i} className={cls}>
          <ReferenceLink id={ref.id} label={t.text} variant="code" />
        </span>
      );
    }
    return <Fragment key={i}>{body}</Fragment>;
  });
}

/** True when the element is wider than its box, so it needs to be keyboard-scrollable. */
/**
 * Read-only highlighted code with line numbers.
 * - `activeLine`: the line running right now (walkthroughs).
 * - `highlightLines`: lines the surrounding text is talking about (lessons).
 * - `references`: words to link to the manual (from `findCodeReferences`).
 * Long lines scroll sideways rather than wrapping, because indentation matters in Python;
 * when they do, the block becomes focusable so keyboard users can scroll it too.
 */
export function CodeView({
  code,
  activeLine,
  highlightLines,
  references = [],
  label = "Code",
  className = "",
}: {
  code: string;
  activeLine?: number;
  highlightLines?: number[];
  references?: CodeReference[];
  label?: string;
  className?: string;
}) {
  const lines = code.split("\n");
  const marked = new Set(highlightLines);
  const [ref, overflows] = useOverflows<HTMLPreElement>();

  return (
    <pre
      ref={ref}
      className={`code-view overflow-x-auto rounded-2xl bg-code-bg py-4 font-mono text-sm leading-7 text-code-fg ${className}`}
      aria-label={label}
      {...(overflows ? { tabIndex: 0, role: "region" } : {})}
    >
      {lines.map((ln, idx) => {
        const n = idx + 1;
        const active = activeLine === n;
        const isMarked = !active && marked.has(n);
        return (
          <div
            key={idx}
            className={`flex min-w-max pr-4 transition-colors ${active ? "bg-code-active" : isMarked ? "bg-teal/12" : ""}`}
            data-line={n}
            data-active={active || undefined}
            data-marked={isMarked || undefined}
          >
            <span
              className={`w-10 shrink-0 select-none border-l-4 pr-3 text-right ${
                active ? "border-sun text-sun" : isMarked ? "border-teal text-teal" : "border-transparent text-code-line"
              }`}
              aria-hidden
            >
              {n}
            </span>
            <code className="whitespace-pre">
              {renderLine(
                ln,
                references.filter((r) => r.line === n),
              )}
              {ln === "" ? " " : null}
            </code>
            {active && <span className="sr-only"> (running now)</span>}
            {isMarked && <span className="sr-only"> (highlighted)</span>}
          </div>
        );
      })}
    </pre>
  );
}
