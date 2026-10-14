import { CircleCheck, CircleX, Eye, RotateCcw } from "lucide-react";
import { useId, useState, type Ref } from "react";
import { RichTextView } from "@/components/lesson/RichTextView";
import type { Checkpoint } from "@/types/trace";
import type { CheckpointRecord } from "@/walkthrough/controller";

const DEFAULT_WRONG = "Not quite. Look at the highlighted line and the values Python has right now, then try again.";

/**
 * The question shown while the walkthrough is paused before a step. The student picks an
 * answer and checks it; wrong answers get feedback (not the answer) and can be retried.
 * "Reveal next step" is always reachable, so nobody is stuck: before any answer it's a
 * deliberate "skip", after one it's the natural next move.
 */
export function CheckpointQuestion({
  checkpoint,
  record,
  onCheck,
  onReveal,
  ref: promptRef,
}: {
  checkpoint: Checkpoint;
  record: CheckpointRecord;
  onCheck: (choiceId: string) => void;
  onReveal: () => void;
  /** The question's heading, focused when the student tries to move on without answering. */
  ref?: Ref<HTMLHeadingElement>;
}) {
  const [choice, setChoice] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const name = useId();
  const promptId = useId();

  const lastWrong = record.ruledOut.at(-1);
  const wrongChoice = showFeedback && !record.correct ? checkpoint.choices.find((c) => c.id === lastWrong) : undefined;
  const answered = record.correct || record.ruledOut.length > 0;

  return (
    <section className="checkpoint animate-pop mt-4 rounded-2xl border-2 border-sky/50 bg-sky/8 p-4" aria-labelledby={promptId}>
      <p className="inline-flex items-center gap-1.5 rounded-full bg-sky/15 px-3 py-1 text-xs font-bold text-sky-ink">
        <Eye className="h-3.5 w-3.5" aria-hidden /> Predict the next step
      </p>
      <fieldset className="mt-2" disabled={record.correct}>
        <legend className="w-full">
          <h4 id={promptId} ref={promptRef} tabIndex={-1} className="font-bold outline-none">
            <RichTextView text={checkpoint.prompt} />
          </h4>
        </legend>
        <div className="mt-3 grid gap-2">
          {checkpoint.choices.map((c) => {
            const ruledOut = record.ruledOut.includes(c.id);
            const right = record.correct && c.id === checkpoint.answer;
            const selected = choice === c.id;
            return (
              <label
                key={c.id}
                data-state={right ? "answer" : ruledOut ? "ruled-out" : selected ? "selected" : "idle"}
                className={`flex items-center gap-3 rounded-xl border-2 bg-card px-3 py-2 text-sm transition-colors ${
                  right
                    ? "border-teal bg-teal/10"
                    : ruledOut
                      ? "cursor-not-allowed border-coral/40 text-muted-foreground"
                      : selected
                        ? "cursor-pointer border-primary"
                        : "cursor-pointer hover:border-primary/50"
                }`}
              >
                <input
                  type="radio"
                  name={name}
                  value={c.id}
                  checked={selected}
                  disabled={ruledOut || record.correct}
                  onChange={() => {
                    setChoice(c.id);
                    setShowFeedback(false);
                  }}
                  className="h-4 w-4 accent-[var(--primary)]"
                />
                <span className="flex-1">
                  <RichTextView text={c.text} />
                </span>
                {right && <CircleCheck className="h-4 w-4 text-teal" aria-hidden />}
                {ruledOut && <CircleX className="h-4 w-4 text-coral" aria-hidden />}
                {right && <span className="sr-only">(correct)</span>}
                {ruledOut && <span className="sr-only">(already tried, not correct)</span>}
              </label>
            );
          })}
        </div>
      </fieldset>

      <div aria-live="polite">
        {record.correct && <p className="mt-3 font-bold text-teal-ink">That's right. Reveal the next step to watch it happen.</p>}
        {wrongChoice && (
          <p className="mt-3 rounded-xl bg-coral/8 p-3 text-sm">
            <span className="font-bold text-coral-ink">Not quite. </span>
            <RichTextView text={wrongChoice.feedback ?? DEFAULT_WRONG} />
          </p>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        {!record.correct && !wrongChoice && (
          <button
            type="button"
            className="btn-primary !px-4 !py-2"
            disabled={choice === null}
            onClick={() => {
              if (!choice) return;
              onCheck(choice);
              setShowFeedback(true);
              if (choice !== checkpoint.answer) setChoice(null);
            }}
          >
            Check prediction
          </button>
        )}
        {wrongChoice && (
          <button type="button" className="btn-ghost !px-4 !py-2" onClick={() => setShowFeedback(false)}>
            <RotateCcw className="h-4 w-4" aria-hidden /> Try again
          </button>
        )}
        {answered ? (
          <button type="button" className={`${record.correct ? "btn-primary" : "btn-ghost"} !px-4 !py-2`} onClick={onReveal}>
            Reveal next step
          </button>
        ) : (
          <button type="button" className="text-sm font-semibold text-muted-foreground underline-offset-4 hover:underline" onClick={onReveal}>
            Skip and reveal the next step
          </button>
        )}
      </div>
    </section>
  );
}

/** Shown with the revealed step: what the student predicted, and why the answer is what it is. */
export function CheckpointRecap({ checkpoint, record }: { checkpoint: Checkpoint; record: CheckpointRecord }) {
  const answer = checkpoint.choices.find((c) => c.id === checkpoint.answer);
  const firstTry = record.correct && record.ruledOut.length === 0;
  const verdict = firstTry
    ? "You predicted this correctly."
    : record.correct
      ? "You got there after another try."
      : record.ruledOut.length
        ? "Here's what actually happened."
        : "You skipped the prediction.";
  return (
    <div className="checkpoint-recap animate-pop mt-4 rounded-2xl border-2 border-teal/40 bg-teal/8 p-4 text-sm" role="group" aria-label="Your prediction">
      <p className="font-bold text-teal-ink">{verdict}</p>
      {answer && (
        <p className="mt-1">
          <span className="font-semibold">Answer: </span>
          <RichTextView text={answer.text} />
        </p>
      )}
      <p className="mt-1">
        <RichTextView text={checkpoint.explanation} />
      </p>
    </div>
  );
}
