import { Brain, Cpu, Globe, Languages, Lightbulb, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
import type { Block, CalloutTone, Lesson, LessonSection as Section } from "@/courses/types";
import { CodeExample } from "./CodeExample";
import { Figure } from "./Figures";
import { PracticeActivity } from "./PracticeActivity";
import { QuestionActivity } from "./QuestionActivity";
import { ReflectActivity } from "./ReflectActivity";
import { RichTextView } from "./RichTextView";

export type LessonHandlers = {
  /** A student worked on an activity (answered, opened a hint or a walkthrough). */
  onActivity: (activityId: string) => void;
};

/** Renders a lesson's sections from its content definition. No lesson-specific code lives here. */
export function LessonBody({ lesson, handlers }: { lesson: Lesson; handlers: LessonHandlers }) {
  return (
    <div className="mt-10">
      {lesson.sections.map((section) => (
        <LessonSection key={section.id} section={section} handlers={handlers} />
      ))}
    </div>
  );
}

export function LessonSection({ section, handlers }: { section: Section; handlers: LessonHandlers }) {
  return (
    <section id={section.id} className="lesson-section" aria-labelledby={`${section.id}-title`}>
      <h2 id={`${section.id}-title`} className="text-2xl font-extrabold md:text-3xl">
        {section.title}
      </h2>
      <div className="lesson-prose mt-4">
        {section.blocks.map((block, i) => (
          <BlockView key={i} block={block} handlers={handlers} />
        ))}
      </div>
    </section>
  );
}

// Callouts are a colored rule plus a label, not a full card, so they stand out without
// boxing in the reading flow.
const CALLOUT: Record<CalloutTone, { label: string; icon: ReactNode; className: string }> = {
  "real-world": { label: "In the real world", icon: <Globe className="h-4 w-4" />, className: "border-sky bg-sky/6 text-sky-ink" },
  execution: { label: "How Python runs this", icon: <Cpu className="h-4 w-4" />, className: "border-primary bg-primary/5 text-grape-ink" },
  mindset: { label: "Think like a programmer", icon: <Brain className="h-4 w-4" />, className: "border-grape bg-grape/6 text-grape-ink" },
  tip: { label: "Tip", icon: <Lightbulb className="h-4 w-4" />, className: "border-amber bg-amber/8 text-amber-ink" },
  careful: { label: "Watch out", icon: <TriangleAlert className="h-4 w-4" />, className: "border-coral bg-coral/6 text-coral-ink" },
  "other-languages": { label: "In other languages", icon: <Languages className="h-4 w-4" />, className: "border-teal bg-teal/6 text-teal-ink" },
};

function BlockView({ block, handlers }: { block: Block; handlers: LessonHandlers }) {
  switch (block.type) {
    case "text":
      return (
        <p>
          <RichTextView text={block.text} />
        </p>
      );

    case "list": {
      const items = block.items.map((item, i) => (
        <li key={i}>
          <RichTextView text={item} />
        </li>
      ));
      return block.ordered ? <ol>{items}</ol> : <ul>{items}</ul>;
    }

    case "callout": {
      const tone = CALLOUT[block.tone];
      return (
        <aside className={`callout my-7 rounded-r-2xl border-l-4 py-3 pl-4 pr-4 ${tone.className}`} aria-label={block.title ?? tone.label}>
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide">
            <span aria-hidden>{tone.icon}</span>
            {block.title ?? tone.label}
          </p>
          <p className="mt-1.5 text-foreground">
            <RichTextView text={block.text} />
          </p>
        </aside>
      );
    }

    case "code":
      return <CodeExample block={block} onActivity={handlers.onActivity} />;

    case "figure":
      return <Figure block={block} />;

    case "question":
      return <QuestionActivity block={block} onAttempt={handlers.onActivity} />;

    case "reflect":
      return <ReflectActivity block={block} onAttempt={handlers.onActivity} />;

    case "practice":
      return <PracticeActivity block={block} onAttempt={handlers.onActivity} />;
  }
}
