import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, Play } from "lucide-react";
import { CodeView } from "@/components/CodeView";
import { ConditionalFlow } from "@/visualizations/conditional/ConditionalFlow";
import { LoopView } from "@/visualizations/LoopView";
import { ListView, StringView } from "@/visualizations/SequenceViews";
import { VariableBox } from "@/visualizations/VariableBox";
import type { ReactNode } from "react";
import type { IfChain } from "@/types/conditional";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Glowcode · Watch your Python come alive" },
      { name: "description", content: "A playful, visual way to learn Python. Step through real code and watch variables, loops and functions change." },
    ],
  }),
  component: Index,
});

const previewChain: IfChain = {
  branches: [
    {
      id: "b1",
      keyword: "if",
      condition: {
        kind: "boolop",
        id: "g1",
        op: "and",
        operands: [
          { kind: "compare", id: "c1", code: "x > 5" },
          { kind: "compare", id: "c2", code: "x < 9" },
        ],
      },
      body: ['size = "mid"'],
    },
  ],
  elseBody: ['size = "other"'],
  after: "print(size)",
};

type Feature = {
  title: string;
  blurb: string;
  accent: string;
  /** Extra grid classes for cards that need a wider slot. */
  span?: string;
  preview: ReactNode;
};

const features: Feature[] = [
  {
    title: "Variables",
    blurb: "Small labeled boxes, color-coded by type.",
    accent: "border-sky",
    preview: (
      <div className="flex flex-wrap justify-center gap-3">
        <VariableBox name="age" value={{ type: "int", value: 16 }} active />
        <VariableBox name="height" value={{ type: "float", value: 1.62 }} />
        <VariableBox name="name" value={{ type: "str", value: "Ada" }} />
        <VariableBox name="is_coder" value={{ type: "bool", value: true }} />
      </div>
    ),
  },
  {
    title: "Loops",
    blurb: "Watch each lap, one at a time.",
    accent: "border-grape",
    preview: (
      <div className="scale-75 py-4">
        <LoopView items={[3, 5, 7]} current={1} />
      </div>
    ),
  },
  {
    title: "Lists",
    blurb: "Indexed boxes, starting at 0.",
    accent: "border-teal",
    preview: <ListView name="fruits" items={["apple", "kiwi", "mango"]} activeIndex={2} />,
  },
  {
    title: "Conditionals",
    blurb: "One flow tree: see every check, and the path Python took.",
    accent: "border-coral",
    span: "md:col-span-2 lg:col-span-3",
    preview: (
      <div className="w-full">
        <ConditionalFlow chain={previewChain} trace={{ results: { c1: true, c2: true }, at: { kind: "after" } }} />
      </div>
    ),
  },
  {
    title: "Strings",
    blurb: "Text as a row of characters.",
    accent: "border-sun",
    preview: <StringView name="word" text="code" activeIndex={0} />,
  },
  {
    title: "Functions",
    blurb: "Inputs in, results out.",
    accent: "border-grape",
    preview: (
      <div className="flex items-center justify-center gap-2 py-4 font-mono text-sm">
        <span className="rounded-xl bg-t-str/15 px-3 py-2 text-t-str">"Sam"</span>→
        <span className="rounded-xl border-2 border-primary px-3 py-2 font-bold">greet()</span>→
        <span className="rounded-xl bg-t-str/15 px-3 py-2 text-t-str">"Hi, Sam"</span>
      </div>
    ),
  },
  {
    title: "Comparisons",
    blurb: "Every comparison becomes True or False.",
    accent: "border-teal",
    preview: (
      <div className="flex flex-col items-center gap-2 font-mono text-sm">
        <span className="rounded-xl border-2 border-teal bg-teal/10 px-3 py-1.5">
          7 * 6 == 42 <span className="font-bold text-teal">→ True</span>
        </span>
        <span className="rounded-xl border-2 border-coral bg-coral/10 px-3 py-1.5">
          3 &gt; 10 <span className="font-bold text-coral">→ False</span>
        </span>
      </div>
    ),
  },
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
            <p className="mt-6 max-w-lg text-lg text-muted-foreground">Step through real Python programs and watch every variable, loop and decision change in front of you, one step at a time.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/courses" className="btn-primary"><Play className="h-4 w-4" /> Start learning</Link>
              <Link to="/playground" className="btn-ghost"><BookOpen className="h-4 w-4" /> Try the playground</Link>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -right-4 -top-6 h-24 w-24 animate-float rounded-3xl bg-sun/70 blur-sm" />
            <div className="absolute -bottom-6 -left-6 h-20 w-20 animate-float rounded-full bg-teal/60 blur-sm [animation-delay:1.5s]" />
            <div className="relative rounded-[2rem] border-2 bg-card p-4 shadow-soft">
              <CodeView code={`fruits = ["apple", "kiwi"]\nfruits.append("mango")\nfor f in fruits:\n    print(f)`} activeLine={2} />
              <div className="my-3 text-center text-2xl text-primary">↓ becomes ↓</div>
              <div className="rounded-2xl bg-muted/60 p-5"><ListView name="fruits" items={["apple", "kiwi", "mango"]} activeIndex={2} /></div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20">
        <h2 className="text-center text-4xl font-extrabold md:text-5xl">Three steps. Zero mystery.</h2>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            { n: "1", t: "Read", d: "Start from a short, real Python program.", c: "bg-grape" },
            { n: "2", t: "Step", d: "Play, pause, or step through it line by line.", c: "bg-sky" },
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
          <div className="mt-10 grid grid-flow-dense gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className={`min-w-0 rounded-3xl border-2 border-t-8 bg-card p-6 shadow-soft ${f.accent} ${f.span ?? ""}`}>
                <h3 className="text-xl font-bold">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.blurb}</p>
                <div className="mt-4 flex min-h-32 items-center justify-center overflow-hidden">{f.preview}</div>
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
