import { Dumbbell, Lightbulb } from "lucide-react";
import { useId, useState } from "react";
import { CodeView } from "@/components/CodeView";
import type { PracticeBlock } from "@/courses/types";
import { RichTextView } from "./RichTextView";

/**
 * A practice task. Students solve it wherever they like (paper, their own editor, or in
 * their head); Glowcode never runs or checks their code. It offers:
 * - the goal, optional context, and a checklist students can check their own work against
 * - hints one at a time, from a nudge to a more specific step
 * - a sample solution behind a gentle "try it first" step, with the reasoning behind it
 *   and other valid approaches
 */
export function PracticeActivity({ block, onAttempt }: { block: PracticeBlock; onAttempt: (activityId: string) => void }) {
  const [hintsShown, setHintsShown] = useState(0);
  const [solution, setSolution] = useState<"hidden" | "confirm" | "shown">("hidden");
  const hints = block.hints ?? [];
  const goalId = useId();

  return (
    <section id={`activity-${block.id}`} className="activity practice my-8 rounded-3xl border-2 border-sun bg-sun/10 p-5" aria-labelledby={goalId}>
      <p className="inline-flex items-center gap-1.5 rounded-full bg-sun/35 px-3 py-1 text-xs font-bold">
        <Dumbbell className="h-3.5 w-3.5" aria-hidden /> Practice
      </p>
      {block.context && (
        <p className="mt-3">
          <RichTextView text={block.context} />
        </p>
      )}
      <p id={goalId} className="mt-3 text-lg font-semibold">
        <RichTextView text={block.prompt} />
      </p>

      {block.checklist && block.checklist.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-bold">Your solution should:</p>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
            {block.checklist.map((item, i) => (
              <li key={i}>
                <RichTextView text={item} />
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="mt-4 text-sm text-muted-foreground">
        Solve it on paper, in your own code editor, or in your head. Glowcode doesn't run or check your code
        {block.checklist?.length ? ", so use the list above to check your own work." : "."}
      </p>

      {hintsShown > 0 && (
        <ol className="mt-4 space-y-2" aria-label="Hints">
          {hints.slice(0, hintsShown).map((h, i) => (
            <li key={i} className="animate-pop flex gap-2 rounded-2xl bg-card p-3 text-sm">
              <Lightbulb className="h-4 w-4 shrink-0 text-amber" aria-hidden />
              <span>
                <span className="font-bold">
                  Hint {i + 1} of {hints.length}:{" "}
                </span>
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
            <Lightbulb className="h-4 w-4" aria-hidden /> {hintsShown === 0 ? "Show a hint" : "Show another hint"}
          </button>
        )}
        {solution === "hidden" && (
          <button type="button" className="btn-ghost !px-5 !py-2" onClick={() => setSolution("confirm")}>
            Show a sample solution
          </button>
        )}
        {solution === "shown" && (
          <button type="button" className="btn-ghost !px-5 !py-2" aria-expanded onClick={() => setSolution("hidden")}>
            Hide the sample solution
          </button>
        )}
      </div>

      {solution === "confirm" && (
        <div className="animate-pop mt-4 rounded-2xl bg-card p-4" role="group" aria-label="Before you look">
          <p className="font-semibold">Have you given it a real try?</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Even a half-finished attempt helps: comparing your thinking with a solution sticks much better than reading one
            cold.
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <button
              type="button"
              className="btn-primary !px-5 !py-2"
              onClick={() => {
                setSolution("shown");
                onAttempt(block.id);
              }}
            >
              Show the sample solution
            </button>
            <button type="button" className="btn-ghost !px-5 !py-2" onClick={() => setSolution("hidden")}>
              I'll keep trying
            </button>
          </div>
        </div>
      )}

      {solution === "shown" && (
        <div className="animate-pop mt-4 space-y-3">
          <CodeView code={block.solution} label="Sample solution" className="py-3" />
          {block.solutionNote && (
            <div className="rounded-2xl bg-card p-4">
              <p className="text-sm font-bold">Why this works</p>
              <p className="mt-1">
                <RichTextView text={block.solutionNote} />
              </p>
            </div>
          )}
          {block.alternatives?.map((alt, i) => (
            <div key={i} className="rounded-2xl bg-card p-4">
              <p className="text-sm font-bold">Another way</p>
              <p className="mt-1">
                <RichTextView text={alt.note} />
              </p>
              {alt.code && <CodeView code={alt.code} label="Alternative solution" className="mt-2 py-3" />}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
