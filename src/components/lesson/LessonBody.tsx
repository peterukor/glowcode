import { Brain, Globe, Languages, Lightbulb, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
import type { Block, CalloutTone, Lesson, LessonSection as Section } from "@/courses/types";
import { VariablesPanel } from "@/visualizations/VariableBox";
import { CodeExample } from "./CodeExample";
import { PracticeActivity } from "./PracticeActivity";
import { QuestionActivity } from "./QuestionActivity";
import { RichTextView } from "./RichTextView";

export type LessonHandlers = {
  onOpenWalkthrough: (walkthroughId: string) => void;
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
    <section id={section.id} className="lesson-section mt-12 first:mt-0" aria-labelledby={`${section.id}-title`}>
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

const CALLOUT: Record<CalloutTone, { label: string; icon: ReactNode; className: string }> = {
  "real-world": { label: "In the real world", icon: <Globe className="h-4 w-4" />, className: "border-sky/50 bg-sky/8 text-sky-ink" },
  tip: { label: "Tip", icon: <Lightbulb className="h-4 w-4" />, className: "border-amber/50 bg-amber/8 text-amber-ink" },
  mindset: { label: "Programmer mindset", icon: <Brain className="h-4 w-4" />, className: "border-grape/50 bg-grape/8 text-grape-ink" },
  careful: { label: "Watch out", icon: <TriangleAlert className="h-4 w-4" />, className: "border-coral/50 bg-coral/8 text-coral-ink" },
  "other-languages": { label: "Other languages", icon: <Languages className="h-4 w-4" />, className: "border-teal/50 bg-teal/8 text-teal-ink" },
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
        <aside className={`callout my-6 rounded-2xl border-2 p-4 ${tone.className}`}>
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide">
            <span aria-hidden>{tone.icon}</span>
            {block.title ?? tone.label}
          </p>
          <p className="mt-2 text-foreground">
            <RichTextView text={block.text} />
          </p>
        </aside>
      );
    }

    case "code":
      return <CodeExample block={block} onOpenWalkthrough={handlers.onOpenWalkthrough} />;

    case "figure":
      return (
        <figure className="my-6 rounded-3xl border-2 bg-card p-5">
          <VariablesPanel vars={block.figure.vars} highlight={block.figure.highlight} />
          <figcaption className="mt-4 text-sm text-muted-foreground">
            <RichTextView text={block.caption} />
          </figcaption>
        </figure>
      );

    case "question":
      return <QuestionActivity block={block} onAttempt={handlers.onActivity} />;

    case "practice":
      return <PracticeActivity block={block} onAttempt={handlers.onActivity} />;
  }
}
