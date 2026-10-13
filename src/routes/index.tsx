import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, Play } from "lucide-react";
import { CodeView } from "@/components/CodeView";
import { Flowchart, ListViz, LoopViz, StringViz, VarBox } from "@/components/viz";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Glowcode — Watch Your Python Code Come Alive" },
      { name: "description", content: "A playful, visual way to learn Python. Write real code and see variables, loops and functions animate." },
      { property: "og:title", content: "Glowcode — Watch Your Python Code Come Alive" },
      { property: "og:description", content: "Write real Python. See exactly what it does." },
    ],
  }),
  component: Index,
});

const features = [
  { t: "Variables", d: "Labeled boxes that hold values.", c: "border-sky", viz: <div className="grid grid-cols-2 gap-3 pt-3"><VarBox name="age" value={{ type: "int", value: 16 }} /><VarBox name="name" value={{ type: "str", value: "Ada" }} /></div> },
  { t: "Loops", d: "Watch each lap, one at a time.", c: "border-grape", viz: <div className="scale-75 py-4"><LoopViz items={[3, 5, 7]} current={1} /></div> },
  { t: "Conditionals", d: "See which path Python takes.", c: "border-coral", viz: <div className="scale-90"><Flowchart condition="x > 5" yes="big" no="small" branch="yes" /></div> },
  { t: "Lists", d: "Indexed boxes, starting at 0.", c: "border-teal", viz: <ListViz name="fruits" items={["apple", "kiwi", "mango"]} activeIndex={2} /> },
  { t: "Strings", d: "Text as a row of characters.", c: "border-sun", viz: <StringViz name="word" text="code" activeIndex={0} /> },
  { t: "Functions", d: "Inputs in, results out.", c: "border-grape", viz: <div className="flex items-center justify-center gap-2 py-4 font-mono text-sm"><span className="rounded-xl bg-t-str/15 px-3 py-2 text-t-str">"Sam"</span>→<span className="rounded-xl border-2 border-primary px-3 py-2 font-bold">greet()</span>→<span className="rounded-xl bg-t-str/15 px-3 py-2 text-t-str">"Hi, Sam"</span></div> },
];

function Index() {
  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-hero" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 lg:grid-cols-2 lg:py-28">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border-2 bg-card px-4 py-1.5 text-sm font-bold shadow-soft">🐍 Python for total beginners</span>
            <h1 className="mt-6 text-5xl font-extrabold leading-[1.02] md:text-7xl">
              Don't just write code. <span className="text-brand">Watch it come alive.</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg text-muted-foreground">Write real Python and see every variable, loop and decision animate in front of you — step by step.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/playground" className="btn-primary"><Play className="h-4 w-4" /> Start coding</Link>
              <Link to="/lessons" className="btn-ghost"><BookOpen className="h-4 w-4" /> Explore lessons</Link>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -right-4 -top-6 h-24 w-24 animate-float rounded-3xl bg-sun/70 blur-sm" />
            <div className="absolute -bottom-6 -left-6 h-20 w-20 animate-float rounded-full bg-teal/60 blur-sm [animation-delay:1.5s]" />
            <div className="relative rounded-[2rem] border-2 bg-card p-4 shadow-soft">
              <CodeView code={`fruits = ["apple", "kiwi"]\nfruits.append("mango")\nfor f in fruits:\n    print(f)`} activeLine={2} />
              <div className="my-3 text-center text-2xl text-primary">↓ becomes ↓</div>
              <div className="rounded-2xl bg-muted/60 p-5"><ListViz name="fruits" items={["apple", "kiwi", "mango"]} activeIndex={2} /></div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20">
        <h2 className="text-center text-4xl font-extrabold md:text-5xl">Three steps. Zero mystery.</h2>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            { n: "1", t: "Write", d: "Type real Python in a friendly editor.", c: "bg-grape" },
            { n: "2", t: "Run", d: "Play, pause, or step through line by line.", c: "bg-sky" },
            { n: "3", t: "Understand", d: "See exactly what changed and why.", c: "bg-teal" },
          ].map((x) => (
            <div key={x.n} className="rounded-3xl border-2 bg-card p-8 shadow-soft transition-transform hover:-translate-y-1">
              <span className={`grid h-14 w-14 place-items-center rounded-2xl font-display text-2xl font-extrabold text-primary-foreground ${x.c}`}>{x.n}</span>
              <h3 className="mt-5 text-2xl font-bold">{x.t}</h3>
              <p className="mt-2 text-muted-foreground">{x.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-muted/50 py-20">
        <div className="mx-auto max-w-7xl px-5">
          <h2 className="text-4xl font-extrabold md:text-5xl">Every concept, <span className="text-brand">visible.</span></h2>
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.t} className={`rounded-3xl border-2 border-t-8 bg-card p-6 shadow-soft ${f.c}`}>
                <h3 className="text-xl font-bold">{f.t}</h3>
                <p className="text-sm text-muted-foreground">{f.d}</p>
                <div className="mt-4 flex min-h-32 items-center justify-center overflow-hidden">{f.viz}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-24 text-center">
        <div className="rounded-[2.5rem] bg-brand p-12 shadow-soft">
          <h2 className="text-4xl font-extrabold text-primary-foreground md:text-5xl">Ready to see your code think?</h2>
          <Link to="/playground" className="mt-8 inline-flex items-center gap-2 rounded-full bg-card px-7 py-3.5 font-bold text-foreground transition-transform hover:scale-105">
            Open the playground <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
