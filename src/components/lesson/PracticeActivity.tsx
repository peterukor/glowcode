import { Dumbbell, Lightbulb } from "lucide-react";
import { useState } from "react";
import { CodeView } from "@/components/CodeView";
import type { PracticeBlock } from "@/courses/types";
import { RichTextView } from "./RichTextView";

/**
 * A practice task. Students write their answer wherever they code; Glowcode offers hints
 * one at a time and a sample solution to compare against (no code is run here).
 */
export function PracticeActivity({ block, onAttempt }: { block: PracticeBlock; onAttempt: (activityId: string) => void }) {
  const [hintsShown, setHintsShown] = useState(0);
  const [solution, setSolution] = useState(false);
  const hints = block.hints ?? [];

  return (
    <section id={`activity-${block.id}`} className="activity my-8 rounded-3xl border-2 border-sun bg-sun/10 p-5">
      <p className="inline-flex items-center gap-1.5 rounded-full bg-sun/35 px-3 py-1 text-xs font-bold">
        <Dumbbell className="h-3.5 w-3.5" aria-hidden /> Practice
      </p>
      <p className="mt-3 text-lg">
        <RichTextView text={block.prompt} />
      </p>

      {hintsShown > 0 && (
        <ol className="mt-4 space-y-2">
          {hints.slice(0, hintsShown).map((h, i) => (
            <li key={i} className="animate-pop flex gap-2 rounded-2xl bg-card p-3 text-sm">
              <Lightbulb className="h-4 w-4 shrink-0 text-amber" aria-hidden />
              <span>
                <span className="font-bold">Hint {i + 1}: </span>
                <RichTextView text={h} />
              </span>
            </li>
          ))}
        </ol>
      )}

      <div className="mt-4 flex flex-wrap gap-3">
        {hintsShown < hints.length && (
          <button
            type="button"
            className="btn-ghost !px-5 !py-2"
            onClick={() => {
              setHintsShown((n) => n + 1);
              onAttempt(block.id);
            }}
          >
            <Lightbulb className="h-4 w-4" aria-hidden /> {hintsShown === 0 ? "Show a hint" : "Another hint"}
          </button>
        )}
        <button
          type="button"
          className="btn-ghost !px-5 !py-2"
          aria-expanded={solution}
          onClick={() => {
            setSolution((s) => !s);
            onAttempt(block.id);
          }}
        >
          {solution ? "Hide sample solution" : "Show a sample solution"}
        </button>
      </div>

      {solution && (
        <div className="animate-pop mt-4">
          <CodeView code={block.solution} className="py-3" />
          {block.solutionNote && (
            <p className="mt-2 text-sm text-muted-foreground">
              <RichTextView text={block.solutionNote} />
            </p>
          )}
        </div>
      )}
    </section>
  );
}
