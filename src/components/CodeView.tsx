import { Fragment } from "react";

const KW = new Set(["def", "return", "if", "else", "elif", "for", "while", "in", "and", "or", "not", "True", "False", "None", "import", "from", "class", "range"]);
const FN = new Set(["print", "len", "append", "input", "str", "int"]);

function highlight(line: string) {
  const parts = line.split(/(#.*$|"[^"]*"|'[^']*'|\b\d+(?:\.\d+)?\b|\b\w+\b)/g);
  return parts.map((p, i) => {
    if (!p) return null;
    let cls = "";
    if (p.startsWith("#")) cls = "text-syn-com italic";
    else if (/^["']/.test(p)) cls = "text-syn-str";
    else if (/^\d/.test(p)) cls = "text-syn-num";
    else if (KW.has(p)) cls = "text-syn-kw font-semibold";
    else if (FN.has(p)) cls = "text-syn-fn";
    return cls ? <span key={i} className={cls}>{p}</span> : <Fragment key={i}>{p}</Fragment>;
  });
}

/** Read-only highlighted code with line numbers and an active-line marker. */
export function CodeView({ code, activeLine, className = "" }: { code: string; activeLine?: number; className?: string }) {
  const lines = code.split("\n");
  return (
    <pre className={`overflow-auto rounded-2xl bg-code-bg py-4 font-mono text-sm leading-7 text-code-fg ${className}`}>
      {lines.map((ln, idx) => {
        const active = activeLine === idx + 1;
        return (
          <div key={idx} className={`flex pr-4 transition-colors ${active ? "bg-code-active" : ""}`}>
            <span className={`w-10 shrink-0 select-none border-l-4 pr-3 text-right ${active ? "border-sun text-sun" : "border-transparent text-code-line"}`}>{idx + 1}</span>
            <code className="whitespace-pre">{highlight(ln) }{ln === "" ? " " : null}</code>
          </div>
        );
      })}
    </pre>
  );
}
