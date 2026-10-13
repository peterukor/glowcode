import { Fragment, useEffect, useRef, useState } from "react";

const KEYWORDS = new Set(["def", "return", "if", "else", "elif", "for", "while", "in", "and", "or", "not", "True", "False", "None", "import", "from", "class", "range"]);
const BUILTINS = new Set(["print", "len", "append", "input", "str", "int"]);

/** Tiny Python highlighter: good enough for short beginner snippets, no dependency needed. */
function highlight(line: string) {
  const parts = line.split(/(#.*$|"[^"]*"|'[^']*'|\b\d+(?:\.\d+)?\b|\b\w+\b)/g);
  return parts.map((p, i) => {
    if (!p) return null;
    let cls = "";
    if (p.startsWith("#")) cls = "text-syn-com italic";
    else if (/^["']/.test(p)) cls = "text-syn-str";
    else if (/^\d/.test(p)) cls = "text-syn-num";
    else if (KEYWORDS.has(p)) cls = "text-syn-kw font-semibold";
    else if (BUILTINS.has(p)) cls = "text-syn-fn";
    return cls ? <span key={i} className={cls}>{p}</span> : <Fragment key={i}>{p}</Fragment>;
  });
}

/** True when the element is wider than its box, so it needs to be keyboard-scrollable. */
function useOverflows<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [overflows, setOverflows] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const check = () => setOverflows(el.scrollWidth > el.clientWidth + 1);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, overflows] as const;
}

/**
 * Read-only highlighted code with line numbers.
 * - `activeLine`: the line running right now (walkthroughs).
 * - `highlightLines`: lines the surrounding text is talking about (lessons).
 * Long lines scroll sideways rather than wrapping, because indentation matters in Python;
 * when they do, the block becomes focusable so keyboard users can scroll it too.
 */
export function CodeView({
  code,
  activeLine,
  highlightLines,
  label = "Code",
  className = "",
}: {
  code: string;
  activeLine?: number;
  highlightLines?: number[];
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
              {highlight(ln)}
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
