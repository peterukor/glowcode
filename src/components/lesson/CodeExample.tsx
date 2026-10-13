import { Footprints, Terminal } from "lucide-react";
import { CodeView } from "@/components/CodeView";
import type { CodeBlock } from "@/courses/types";
import { RichTextView } from "./RichTextView";

/** The button that opens a code example's step-by-step walkthrough. */
export function VisualizationEntryPoint({ walkthroughId, onOpen }: { walkthroughId: string; onOpen: (id: string) => void }) {
  return (
    <button type="button" id={`open-${walkthroughId}`} className="btn-walkthrough" onClick={() => onOpen(walkthroughId)}>
      <Footprints className="h-4 w-4" aria-hidden />
      Walk through code
    </button>
  );
}

/** A read-only code snippet with its output and, when available, a walkthrough. */
export function CodeExample({ block, onOpenWalkthrough }: { block: CodeBlock; onOpenWalkthrough: (id: string) => void }) {
  return (
    <figure className="my-6 overflow-hidden rounded-3xl border-2 bg-code-bg shadow-soft">
      <div className="flex items-center gap-2 border-b border-code-line/30 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-coral" aria-hidden />
        <span className="h-2.5 w-2.5 rounded-full bg-sun" aria-hidden />
        <span className="h-2.5 w-2.5 rounded-full bg-teal" aria-hidden />
        <span className="ml-2 font-mono text-xs text-code-line">{block.language === "python" ? "Python" : "Java"}</span>
        {block.walkthrough && (
          <span className="ml-auto">
            <VisualizationEntryPoint walkthroughId={block.walkthrough.id} onOpen={onOpenWalkthrough} />
          </span>
        )}
      </div>
      <CodeView code={block.code} className="rounded-none py-3" />
      {block.output && (
        <div className="border-t border-code-line/30 px-4 py-3 font-mono text-sm text-code-fg">
          <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-code-line">
            <Terminal className="h-3.5 w-3.5" aria-hidden /> Output
          </div>
          {block.output.map((line, i) => (
            <div key={i}>
              <span className="text-teal" aria-hidden>
                ›{" "}
              </span>
              {line}
            </div>
          ))}
        </div>
      )}
      {block.caption && (
        <figcaption className="border-t border-code-line/30 bg-card px-4 py-2.5 text-sm text-muted-foreground">
          <RichTextView text={block.caption} />
        </figcaption>
      )}
    </figure>
  );
}
