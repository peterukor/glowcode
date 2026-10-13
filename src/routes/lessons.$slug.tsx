import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Lightbulb, Target } from "lucide-react";
import { useState } from "react";
import { CodeView } from "@/components/CodeView";
import { StepControls, useStepper } from "@/components/Stepper";
import { ExampleViz } from "@/components/viz";
import { getExample } from "@/lib/examples";
import { allLessons, findLesson } from "@/lib/lessons";

export const Route = createFileRoute("/lessons/$slug")({
  loader: ({ params }) => {
    const lesson = findLesson(params.slug);
    if (!lesson) throw notFound();
    return { lesson };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.lesson.title} — Glowcode Lessons` },
          { name: "description", content: loaderData.lesson.objective },
          { property: "og:title", content: `${loaderData.lesson.title} — Glowcode` },
          { property: "og:description", content: loaderData.lesson.objective },
        ]
      : [{ title: "Lesson not found — Glowcode" }, { name: "robots", content: "noindex" }],
  }),
  component: LessonPage,
});

function LessonPage() {
  const { lesson } = Route.useLoaderData();
  const ex = getExample(lesson.exampleId);
  const s = useStepper(ex.steps.length);
  const [hint, setHint] = useState(false);
  const idx = allLessons.findIndex((l) => l.slug === lesson.slug);
  const prev = allLessons[idx - 1];
  const next = allLessons[idx + 1];
  const step = ex.steps[s.step];

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <Link to="/lessons" className="text-sm font-semibold text-muted-foreground hover:text-primary">← All lessons</Link>
      <div className="mt-4 flex items-center gap-4">
        <span className="grid h-16 w-16 place-items-center rounded-2xl bg-brand text-3xl shadow-soft">{lesson.icon}</span>
        <div>
          <p className="font-mono text-xs font-bold uppercase tracking-wider text-primary">Lesson {idx + 1} · {lesson.difficulty}</p>
          <h1 className="text-4xl font-extrabold md:text-5xl">{lesson.title}</h1>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <div className="space-y-5">
          <div className="rounded-3xl border-2 bg-card p-6 shadow-soft">
            <div className="mb-3 flex items-center gap-2 font-bold text-teal"><Target className="h-5 w-5" /> {lesson.objective}</div>
            {lesson.explanation.map((p) => <p key={p} className="mt-3 text-lg leading-relaxed">{p}</p>)}
          </div>
          <CodeView code={ex.code} activeLine={step.line} className="shadow-soft" />
        </div>

        <div className="rounded-3xl border-2 bg-card p-5 shadow-soft">
          <StepControls s={s} compact />
          <div className="mt-6 min-h-56"><ExampleViz example={ex} step={step} kind={ex.viz[0]} /></div>
          <p key={s.step} className="animate-pop mt-5 rounded-2xl bg-secondary p-4 font-medium text-secondary-foreground">💡 {step.note}</p>
        </div>
      </div>

      <section className="mt-8 rounded-3xl border-2 border-sun bg-sun/15 p-6">
        <h2 className="text-2xl font-bold">🏆 Practice challenge</h2>
        <p className="mt-2 text-lg">{lesson.challenge.prompt}</p>
        <textarea defaultValue={lesson.challenge.starter} spellCheck={false}
          className="mt-4 h-32 w-full rounded-2xl bg-code-bg p-4 font-mono text-sm text-code-fg outline-none ring-primary focus:ring-4" />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button disabled title="Code checking arrives in a future version" className="btn-primary cursor-not-allowed opacity-60">Check answer · coming soon</button>
          <button onClick={() => setHint((h) => !h)} className="btn-ghost"><Lightbulb className="h-4 w-4" /> {hint ? "Hide hint" : "Show hint"}</button>
          {hint && <span className="animate-pop font-mono text-sm">{lesson.challenge.hint}</span>}
        </div>
      </section>

      <nav className="mt-10 flex justify-between gap-4">
        {prev ? <Link to="/lessons/$slug" params={{ slug: prev.slug }} className="btn-ghost"><ArrowLeft className="h-4 w-4" /> {prev.title}</Link> : <span />}
        {next && <Link to="/lessons/$slug" params={{ slug: next.slug }} className="btn-primary">{next.title} <ArrowRight className="h-4 w-4" /></Link>}
      </nav>
    </div>
  );
}
