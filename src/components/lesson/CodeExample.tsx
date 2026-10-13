import { Footprints, Terminal, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { CodeView } from "@/components/CodeView";
import { WalkthroughPlayer } from "@/components/walkthrough/WalkthroughPlayer";
import { walkthroughActivityId } from "@/courses/queries";
import type { CodeBlock } from "@/courses/types";
import { RichTextView } from "./RichTextView";

const LANGUAGE_LABEL = { python: "Python", java: "Java" } as const;

/**
 * A read-only code snippet: language label, line numbers, optional marked lines, caption
 * and printed output. If it has a walkthrough, "Walk through code" expands the
 * step-by-step player right here, in place of the snippet, so the student never loses
 * their place. Without one, no walkthrough button is shown at all.
 */
export function CodeExample({ block, onActivity }: { block: CodeBlock; onActivity: (activityId: string) => void }) {
  const [open, setOpen] = useState(false);
  const openButton = useRef<HTMLButtonElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const opened = useRef(false);
  const wt = block.walkthrough;
  const language = LANGUAGE_LABEL[block.language];
  const lineCount = block.code.split("\n").length;
  const predictions = wt?.steps.filter((s) => s.checkpoint).length ?? 0;

  // Move focus into the walkthrough when it opens, and back to its button when it closes.
  useEffect(() => {
    if (open) heading.current?.focus();
    else if (opened.current) openButton.current?.focus();
    opened.current ||= open;
  }, [open]);

  return (
    <div id={wt ? `activity-${walkthroughActivityId(wt.id)}` : undefined} className="code-example my-7">
      {open && wt ? (
        <section className="breakout walkthrough-inline animate-pop rounded-[2rem] border-2 border-primary/30 bg-muted/40 p-3 sm:p-4" aria-labelledby={`${wt.id}-title`}>
          <div className="mb-3 flex items-center gap-3 px-1">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-wide text-primary">Code walkthrough</p>
              <h3 id={`${wt.id}-title`} ref={heading} tabIndex={-1} className="truncate text-lg font-extrabold outline-none">
                {wt.title}
              </h3>
            </div>
            <span className="hidden text-xs text-muted-foreground sm:inline">← → keys step through</span>
            <button type="button" className="btn-ghost !px-4 !py-2" onClick={() => setOpen(false)}>
              <X className="h-4 w-4" aria-hidden /> Close
            </button>
          </div>
          <WalkthroughPlayer walkthrough={wt} />
        </section>
      ) : (
        <figure className="overflow-hidden rounded-3xl border-2 bg-code-bg shadow-soft">
          <div className="flex flex-wrap items-center gap-2 border-b border-code-line/30 px-4 py-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-coral" aria-hidden />
            <span className="h-2.5 w-2.5 rounded-full bg-sun" aria-hidden />
            <span className="h-2.5 w-2.5 rounded-full bg-teal" aria-hidden />
            <span className="ml-2 font-mono text-xs text-code-line">{language}</span>
            {wt && predictions > 0 && (
              <span className="ml-auto text-xs font-semibold text-sun">
                {predictions === 1 ? "Includes a prediction" : `Includes ${predictions} predictions`}
              </span>
            )}
            {wt && (
              <button
                ref={openButton}
                type="button"
                id={`open-${wt.id}`}
                className={`btn-walkthrough ${predictions > 0 ? "" : "ml-auto"}`}
                aria-expanded={false}
                onClick={() => {
                  setOpen(true);
                  onActivity(walkthroughActivityId(wt.id));
                }}
              >
                <Footprints className="h-4 w-4" aria-hidden />
                Walk through code
              </button>
            )}
          </div>
          <CodeView
            code={block.code}
            highlightLines={block.highlightLines}
            label={`${language} code, ${lineCount} ${lineCount === 1 ? "line" : "lines"}`}
            className="rounded-none py-3"
          />
          {block.output && <PrintedOutput lines={block.output} />}
          {block.caption && (
            <figcaption className="border-t border-code-line/30 bg-card px-4 py-2.5 text-sm text-muted-foreground">
              <RichTextView text={block.caption} />
            </figcaption>
          )}
        </figure>
      )}
    </div>
  );
}

/**
 * What the program printed. Labeled as printed output (what print() shows on screen)
 * so it's never confused with a value a function returns.
 */
export function PrintedOutput({ lines }: { lines: string[] }) {
  return (
    <div className="border-t border-code-line/30 px-4 py-3 font-mono text-sm text-code-fg" role="group" aria-label="Printed output">
      <div className="mb-1 flex items-center gap-1.5 font-sans text-xs font-semibold text-code-line">
        <Terminal className="h-3.5 w-3.5" aria-hidden /> Printed output
      </div>
      {lines.map((line, i) => (
        <div key={i}>
          <span className="text-teal" aria-hidden>
            ›{" "}
          </span>
          {line}
        </div>
      ))}
    </div>
  );
}
