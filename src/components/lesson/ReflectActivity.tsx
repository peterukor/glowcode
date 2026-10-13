import { MessageCircleQuestion } from "lucide-react";
import { useId, useState } from "react";
import { CodeView } from "@/components/CodeView";
import type { ReflectBlock } from "@/courses/types";
import { RichTextView } from "./RichTextView";

/**
 * "Think it through": an open question with no options to pick from. Students reason on
 * their own (in their head, on paper or out loud), then reveal a model explanation to
 * compare with. Nothing is typed or graded.
 */
export function ReflectActivity({ block, onAttempt }: { block: ReflectBlock; onAttempt: (activityId: string) => void }) {
  const [open, setOpen] = useState(false);
  const answerId = useId();

  return (
    <section id={`activity-${block.id}`} className="activity reflect my-8 rounded-3xl border-2 border-grape/30 bg-grape/5 p-5">
      <p className="inline-flex items-center gap-1.5 rounded-full bg-grape/12 px-3 py-1 text-xs font-bold text-grape-ink">
        <MessageCircleQuestion className="h-3.5 w-3.5" aria-hidden /> Think it through
      </p>
      <p className="mt-3 text-lg font-semibold">
        <RichTextView text={block.prompt} />
      </p>
      {block.code && <CodeView code={block.code} label="Code for this question" className="mt-3 py-3" />}

      {!open && <p className="mt-3 text-sm text-muted-foreground">Answer it in your own words first, then compare.</p>}

      <button
        type="button"
        className="btn-ghost mt-4 !px-5 !py-2"
        aria-expanded={open}
        aria-controls={answerId}
        onClick={() => {
          if (!open) onAttempt(block.id);
          setOpen((o) => !o);
        }}
      >
        {open ? "Hide the explanation" : "Compare with an explanation"}
      </button>

      <div id={answerId} hidden={!open} className="animate-pop mt-4 rounded-2xl bg-card p-4">
        <RichTextView text={block.answer} />
      </div>
    </section>
  );
}
