import { Send, Sparkles } from "lucide-react";
import { useId } from "react";

/**
 * Everything Ask Glow will need to answer in context: the lesson or manual page the student
 * is reading. A future AI service receives it together with the student's question.
 */
export type AssistantContext =
  | {
      kind: "lesson";
      courseId: string;
      courseTitle: string;
      lessonId: string;
      lessonTitle: string;
      objectives: string[];
      /** Later: the walkthrough and step a student is looking at when they ask. */
      walkthrough?: { id: string; code: string; line: number };
    }
  | {
      kind: "reference";
      /** Undefined on the manual's home page. */
      referenceId?: string;
      referenceTitle: string;
    };

/** Phase 2+: implement this and pass it as `onAsk` to switch the assistant on. */
export type AskGlow = (question: string, context: AssistantContext) => Promise<string>;

const SUGGESTIONS = [
  "Explain this more simply",
  "Why does this code do that?",
  "Walk me through it line by line",
  "Help me understand an error",
  "Give me a hint",
];

/**
 * The Ask Glow panel. Visual shell only: it never pretends to answer. When `onAsk` is
 * provided (later phase), the suggestions and input come alive.
 */
export function AssistantPanel({ context, onAsk }: { context: AssistantContext; onAsk?: AskGlow }) {
  const available = Boolean(onAsk);
  // Unique ids: the panel can exist twice (desktop column + mobile drawer).
  const titleId = useId();
  const inputId = useId();
  return (
    <section className="flex h-full flex-col gap-4 p-4" aria-labelledby={titleId}>
      <header className="flex items-center gap-2 xl:pl-10">
        <span className="grid h-8 w-8 place-items-center rounded-xl bg-brand text-white shadow-soft" aria-hidden>
          <Sparkles className="h-4 w-4" />
        </span>
        <h2 id={titleId} className="text-base font-extrabold">
          Ask Glow
        </h2>
        {!available && <span className="ml-auto rounded-full bg-sun/30 px-2 py-0.5 text-[11px] font-bold">Coming soon</span>}
      </header>

      <div className="rounded-2xl border-2 border-dashed bg-muted/40 p-4 text-sm">
        <p className="font-semibold">Glow, your learning helper, isn't switched on yet.</p>
        <p className="mt-2 text-muted-foreground">
          Soon you'll be able to ask questions about this page right here: simpler explanations, why code behaves a
          certain way, or a hint when you're stuck.
        </p>
      </div>

      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">You'll be able to ask</p>
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((s) => (
            <li key={s}>
              <button
                type="button"
                disabled={!available}
                className="rounded-full border-2 bg-card px-3 py-1 text-xs font-semibold text-muted-foreground disabled:cursor-not-allowed"
              >
                {s}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <p className="text-xs text-muted-foreground">
        Glow will know you're reading{" "}
        <span className="font-semibold text-foreground">{context.kind === "lesson" ? context.lessonTitle : context.referenceTitle}</span>.
      </p>

      <form className="mt-auto flex items-end gap-2" onSubmit={(e) => e.preventDefault()} aria-label="Ask Glow a question">
        <label htmlFor={inputId} className="sr-only">
          Your question
        </label>
        <textarea
          id={inputId}
          rows={2}
          disabled={!available}
          placeholder={available ? "Ask about this page…" : "Ask Glow is coming soon"}
          className="min-h-11 flex-1 resize-none rounded-2xl border-2 bg-card px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-70"
        />
        <button type="submit" disabled={!available} className="icon-btn h-11 w-11 disabled:opacity-50" aria-label="Send question">
          <Send className="h-4 w-4" />
        </button>
      </form>
    </section>
  );
}
