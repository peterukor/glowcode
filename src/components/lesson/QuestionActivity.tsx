import { Bug, CircleCheck, CircleX, Eye } from "lucide-react";
import { useId, useState } from "react";
import { CodeView } from "@/components/CodeView";
import type { QuestionBlock } from "@/courses/types";
import { RichTextView } from "./RichTextView";

/** A "predict the output" or "find the bug" multiple-choice question. */
export function QuestionActivity({ block, onAttempt }: { block: QuestionBlock; onAttempt: (activityId: string) => void }) {
  const [choice, setChoice] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const name = useId();
  const correct = checked && choice === block.answer;
  const debug = block.variant === "debug";

  return (
    <section id={`activity-${block.id}`} className="activity my-8 rounded-3xl border-2 bg-card p-5 shadow-soft" data-variant={block.variant}>
      <p className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${debug ? "bg-coral/15 text-coral-ink" : "bg-sky/15 text-sky-ink"}`}>
        {debug ? <Bug className="h-3.5 w-3.5" aria-hidden /> : <Eye className="h-3.5 w-3.5" aria-hidden />}
        {debug ? "Debug it" : "Predict"}
      </p>
      <fieldset className="mt-3">
        <legend className="text-lg font-bold">
          <RichTextView text={block.prompt} />
        </legend>
        {block.code && <CodeView code={block.code} className="mt-3 py-3" />}
        <div className="mt-4 grid gap-2">
          {block.choices.map((c) => {
            const isAnswer = checked && c.id === block.answer;
            const isWrongPick = checked && c.id === choice && c.id !== block.answer;
            return (
              <label
                key={c.id}
                className={`choice flex cursor-pointer items-center gap-3 rounded-2xl border-2 px-4 py-3 transition-colors ${
                  isAnswer ? "border-teal bg-teal/10" : isWrongPick ? "border-coral bg-coral/10" : choice === c.id ? "border-primary bg-primary/5" : "hover:border-primary/50"
                }`}
              >
                <input
                  type="radio"
                  name={name}
                  value={c.id}
                  checked={choice === c.id}
                  onChange={() => {
                    setChoice(c.id);
                    setChecked(false);
                  }}
                  className="h-4 w-4 accent-[var(--primary)]"
                />
                <span className="flex-1">
                  <RichTextView text={c.text} />
                </span>
                {isAnswer && <CircleCheck className="h-5 w-5 text-teal" aria-hidden />}
                {isWrongPick && <CircleX className="h-5 w-5 text-coral" aria-hidden />}
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="btn-primary !px-5 !py-2"
          disabled={choice === null}
          onClick={() => {
            setChecked(true);
            onAttempt(block.id);
          }}
        >
          Check answer
        </button>
        {checked && (
          <p role="status" className={`animate-pop font-bold ${correct ? "text-teal-ink" : "text-coral-ink"}`}>
            {correct ? "Yes, that's it!" : "Not quite. Here's why:"}
          </p>
        )}
      </div>

      {checked && (
        <div className="animate-pop mt-4 rounded-2xl bg-muted/70 p-4">
          <RichTextView text={block.explanation} />
        </div>
      )}
    </section>
  );
}
