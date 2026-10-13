import { createFileRoute, Link } from "@tanstack/react-router";
import { chapters, type Lesson } from "@/data/lessons";

export const Route = createFileRoute("/lessons/")({
  head: () => ({
    meta: [
      { title: "Python Lessons · Glowcode" },
      { name: "description", content: "A visual learning path through Python: variables, loops, lists, functions and more." },
    ],
  }),
  component: Lessons,
});

const tone: Record<Lesson["color"], string> = {
  grape: "bg-grape/15 border-grape text-grape",
  sky: "bg-sky/15 border-sky text-sky",
  teal: "bg-teal/15 border-teal text-teal",
  sun: "bg-sun/25 border-sun text-foreground",
  coral: "bg-coral/15 border-coral text-coral",
};
const diff = { Beginner: "bg-teal/20 text-teal", Easy: "bg-sky/20 text-sky", Medium: "bg-coral/20 text-coral" };

function Lessons() {
  let n = 0;
  return (
    <div className="relative">
      <div className="absolute inset-x-0 top-0 h-80 bg-hero" />
      <div className="relative mx-auto max-w-6xl px-5 py-14">
        <h1 className="text-5xl font-extrabold md:text-6xl">Your learning <span className="text-brand">path</span></h1>
        <p className="mt-3 max-w-xl text-lg text-muted-foreground">Bite-sized lessons. Every one comes with a live visualization and a tiny challenge.</p>

        {chapters.map((ch) => (
          <section key={ch.title} className="mt-14">
            <h2 className="mb-6 text-2xl font-bold">{ch.title}</h2>
            <div className="relative grid gap-6 md:grid-cols-3">
              <div className="absolute left-0 right-0 top-14 hidden h-1 rounded-full border-t-4 border-dashed border-border md:block" />
              {ch.lessons.map((l) => {
                n++;
                return (
                  <Link key={l.slug} to="/lessons/$slug" params={{ slug: l.slug }}
                    className="group relative rounded-3xl border-2 bg-card p-6 shadow-soft transition-all hover:-translate-y-1.5 hover:border-primary">
                    <div className="flex items-start justify-between">
                      <div className={`grid h-16 w-16 place-items-center rounded-2xl border-2 text-3xl transition-transform group-hover:rotate-6 group-hover:scale-110 ${tone[l.color]}`}>{l.icon}</div>
                      <span className="font-mono text-sm font-bold text-muted-foreground">#{String(n).padStart(2, "0")}</span>
                    </div>
                    <h3 className="mt-5 text-xl font-bold">{l.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{l.objective}</p>
                    <span className={`mt-4 inline-block rounded-full px-3 py-1 text-xs font-bold ${diff[l.difficulty]}`}>{l.difficulty}</span>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
