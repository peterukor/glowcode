import { Bug, CircleCheck, CircleX, Eye, Lightbulb, RotateCcw } from "lucide-react";
import { useId, useState } from "react";
import { CodeView } from "@/components/CodeView";
import type { QuestionBlock } from "@/courses/types";
import { RichTextView } from "./RichTextView";
import { SampleInput } from "./SampleInput";

type Status = "answering" | "wrong" | "correct" | "revealed";

const DEFAULT_WRONG =
  "Not quite. Go back through the code one line at a time and say what each line does before choosing again.";

/**
 * A "predict the output" or "find the bug" question.
 * - A wrong answer gets feedback about that specific misunderstanding, not the answer.
 * - Students can try again, ask for a hint, or choose to reveal the answer.
 * - The explanation (the "why") appears once they get it right or reveal it.
 * Answering records an activity for "resume", but never completes the lesson.
 */
export function QuestionActivity({ block, onAttempt }: { block: QuestionBlock; onAttempt: (activityId: string) => void }) {
  const [choice, setChoice] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("answering");
  const [ruledOut, setRuledOut] = useState<string[]>([]);
  const [hintShown, setHintShown] = useState(false);
  const name = useId();
  const promptId = useId();

  const debug = block.variant === "debug";
  const done = status === "correct" || status === "revealed";
  const lastWrong = status === "wrong" ? block.choices.find((c) => c.id === choice) : undefined;

  const check = () => {
    if (!choice) return;
    onAttempt(block.id);
    if (choice === block.answer) {
      setStatus("correct");
    } else {
      setStatus("wrong");
      setRuledOut((r) => (r.includes(choice) ? r : [...r, choice]));
    }
  };

  const tryAgain = () => {
    setChoice(null);
    setStatus("answering");
  };

  const reveal = () => {
    onAttempt(block.id);
    setStatus("revealed");
  };

  return (
    <section
      id={`activity-${block.id}`}
      className="activity question my-8 rounded-3xl border-2 bg-card p-5 shadow-soft"
      data-variant={block.variant}
      data-status={status}
      aria-labelledby={promptId}
    >
      <p className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${debug ? "bg-coral/15 text-coral-ink" : "bg-sky/15 text-sky-ink"}`}>
        {debug ? <Bug className="h-3.5 w-3.5" aria-hidden /> : <Eye className="h-3.5 w-3.5" aria-hidden />}
        {debug ? "Find the bug" : "Predict"}
      </p>

      <fieldset className="mt-3 min-w-0" disabled={done}>
        <legend id={promptId} className="text-lg font-bold">
          <RichTextView text={block.prompt} />
        </legend>

        {block.code && <CodeView code={block.code} label="Code for this question" className="mt-3 py-3" />}
        {block.input && (
          <div className="mt-2">
            <SampleInput lines={block.input} />
          </div>
        )}
        {block.errorOutput && (
          <div className="mt-2 rounded-2xl border-2 border-coral/40 bg-coral/8 px-4 py-3" role="group" aria-label="What Python printed">
            <p className="text-xs font-bold uppercase tracking-wide text-coral-ink">What Python printed</p>
            {/* Never wrap: the ^ markers line up with the code above them by column. Long lines scroll
                inside the box instead (focusable, so keyboard users can scroll it too). */}
            <pre className="mt-1 overflow-x-auto whitespace-pre pb-1 font-mono text-sm" tabIndex={0} aria-label="Error message">
              {block.errorOutput}
            </pre>
          </div>
        )}

        <div className="mt-4 grid gap-2">
          {block.choices.map((c) => {
            const isRuledOut = ruledOut.includes(c.id);
            const isAnswer = done && c.id === block.answer;
            const isSelected = choice === c.id;
            const state = isAnswer ? "answer" : isRuledOut ? "ruled-out" : isSelected ? "selected" : "idle";
            return (
              <label
                key={c.id}
                data-state={state}
                className={`choice flex items-center gap-3 rounded-2xl border-2 px-4 py-3 transition-colors ${
                  state === "answer"
                    ? "border-teal bg-teal/10"
                    : state === "ruled-out"
                      ? "cursor-not-allowed border-coral/40 bg-coral/5 text-muted-foreground"
                      : state === "selected"
                        ? "cursor-pointer border-primary bg-primary/8"
                        : "cursor-pointer hover:border-primary/50"
                }`}
              >
                <input
                  type="radio"
                  name={name}
                  value={c.id}
                  checked={isSelected}
                  disabled={isRuledOut || done}
                  onChange={() => {
                    setChoice(c.id);
                    if (status === "wrong") setStatus("answering");
                  }}
                  className="h-4 w-4 accent-[var(--primary)]"
                />
                <span className="flex-1">
                  <RichTextView text={c.text} />
                </span>
                {isAnswer && <CircleCheck className="h-5 w-5 text-teal" aria-hidden />}
                {isRuledOut && <CircleX className="h-5 w-5 text-coral" aria-hidden />}
                {isAnswer && <span className="sr-only">(correct answer)</span>}
                {isRuledOut && <span className="sr-only">(already tried, not correct)</span>}
              </label>
            );
          })}
        </div>
      </fieldset>

      {block.hint && hintShown && !done && (
        <p className="animate-pop mt-4 flex gap-2 rounded-2xl bg-amber/10 p-3 text-sm">
          <Lightbulb className="h-4 w-4 shrink-0 text-amber" aria-hidden />
          <span>
            <span className="font-bold">Hint: </span>
            <RichTextView text={block.hint} />
          </span>
        </p>
      )}

      {/* Feedback is announced to screen readers as it changes. */}
      <div aria-live="polite">
        {status === "wrong" && (
          <div className="animate-pop mt-4 rounded-2xl border-2 border-coral/40 bg-coral/8 p-4">
            <p className="font-bold text-coral-ink">Not quite.</p>
            <p className="mt-1">
              <RichTextView text={lastWrong?.feedback ?? DEFAULT_WRONG} />
            </p>
          </div>
        )}
        {done && (
          <div className="animate-pop mt-4 rounded-2xl border-2 border-teal/40 bg-teal/8 p-4">
            <p className="font-bold text-teal-ink">{status === "correct" ? "Yes, that's it!" : "Here's the answer."}</p>
            <p className="mt-1">
              <RichTextView text={block.explanation} />
            </p>
          </div>
        )}
      </div>

      {!done && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {status === "wrong" ? (
            <button type="button" className="btn-primary !px-5 !py-2" onClick={tryAgain}>
              <RotateCcw className="h-4 w-4" aria-hidden /> Try again
            </button>
          ) : (
            <button type="button" className="btn-primary !px-5 !py-2" disabled={choice === null} onClick={check}>
              Check answer
            </button>
          )}
          {block.hint && !hintShown && (
            <button type="button" className="btn-ghost !px-4 !py-2" onClick={() => setHintShown(true)}>
              <Lightbulb className="h-4 w-4" aria-hidden /> Hint
            </button>
          )}
          {ruledOut.length > 0 && (
            <button type="button" className="text-sm font-semibold text-muted-foreground underline-offset-4 hover:underline" onClick={reveal}>
              Show the answer
            </button>
          )}
        </div>
      )}
    </section>
  );
}
