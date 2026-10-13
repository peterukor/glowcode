import { createFileRoute } from "@tanstack/react-router";
import { ChevronDown, Info, Terminal } from "lucide-react";
import { useState } from "react";
import { CodeView } from "@/components/CodeView";
import { StepControls, useStepper } from "@/components/Stepper";
import { ExampleViz, TypeLegend, VariablesPanel } from "@/components/viz";
import { examples, type VizKind } from "@/lib/examples";

export const Route = createFileRoute("/playground")({
  head: () => ({
    meta: [
      { title: "Python Playground — Glowcode" },
      { name: "description", content: "Step through Python code and watch variables, loops and branches animate." },
      { property: "og:title", content: "Python Playground — Glowcode" },
      { property: "og:description", content: "Step through Python code and watch it come alive." },
    ],
  }),
  component: Playground,
});

const vizLabels: Record<VizKind, string> = { variables: "Variables", flowchart: "Flowchart", collections: "Collections", loop: "Loop", function: "Function" };

function Playground() {
  const [exId, setExId] = useState(examples[0].id);
  const ex = examples.find((e) => e.id === exId)!;
  const s = useStepper(ex.steps.length);
  const [kind, setKind] = useState<VizKind>(ex.viz[0]);
  const [consoleOpen, setConsoleOpen] = useState(true);
  const step = ex.steps[s.step];
  const viz = ex.viz.includes(kind) ? kind : ex.viz[0];

  return (
    <div className="mx-auto max-w-7xl px-5 py-6">
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <span className="mr-2 text-sm font-bold text-muted-foreground">Examples</span>
        {examples.map((e) => (
          <button key={e.id} onClick={() => { setExId(e.id); setKind(e.viz[0]); }}
            className={`rounded-full border-2 px-4 py-1.5 text-sm font-semibold transition-all ${e.id === exId ? "border-primary bg-primary text-primary-foreground shadow-soft" : "bg-card hover:border-primary"}`}>
            {e.emoji} {e.title}
          </button>
        ))}
        <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-sun/25 px-3 py-1 text-xs font-bold">
          <Info className="h-3.5 w-3.5" /> Prototype · replays a pre-recorded demo trace
        </span>
      </div>

      <div className="mb-5 rounded-3xl border-2 bg-card p-3 shadow-soft"><StepControls s={s} /></div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="flex flex-col gap-5">
          <div className="overflow-hidden rounded-3xl border-2 bg-code-bg shadow-soft">
            <div className="flex items-center gap-2 border-b border-code-line/30 px-4 py-3">
              <span className="h-3 w-3 rounded-full bg-coral" /><span className="h-3 w-3 rounded-full bg-sun" /><span className="h-3 w-3 rounded-full bg-teal" />
              <span className="ml-3 font-mono text-xs text-code-line">main.py</span>
            </div>
            <CodeView code={ex.code} activeLine={step.line} className="min-h-64 rounded-none" />
          </div>

          <div className="rounded-3xl border-2 bg-card shadow-soft">
            <button onClick={() => setConsoleOpen((o) => !o)} className="flex w-full items-center gap-2 px-5 py-3 font-bold">
              <Terminal className="h-4 w-4 text-teal" /> Console
              <ChevronDown className={`ml-auto h-4 w-4 transition-transform ${consoleOpen ? "" : "-rotate-90"}`} />
            </button>
            {consoleOpen && (
              <div className="mx-4 mb-4 min-h-20 rounded-2xl bg-code-bg p-4 font-mono text-sm text-code-fg">
                {step.output?.length ? step.output.map((o, i) => <div key={i} className="animate-pop"><span className="text-teal">›</span> {o}</div>) : <span className="text-code-line">No output yet…</span>}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <div className="relative overflow-hidden rounded-3xl border-2 bg-card p-5 shadow-soft">
            <div className="pointer-events-none absolute inset-0 bg-hero opacity-60" />
            <div className="relative">
              <div className="mb-5 flex flex-wrap items-center gap-2">
                <h2 className="mr-auto text-xl font-bold">Visualization</h2>
                {ex.viz.map((k) => (
                  <button key={k} onClick={() => setKind(k)} className={`rounded-full px-3 py-1 text-xs font-bold transition-all ${viz === k ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:text-foreground"}`}>{vizLabels[k]}</button>
                ))}
              </div>
              <div className="min-h-56"><ExampleViz example={ex} step={step} kind={viz} /></div>
              <div key={s.step} className="animate-pop mt-6 flex items-start gap-3 rounded-2xl border-2 border-primary/30 bg-card/80 p-4">
                <span className="text-2xl">💡</span>
                <p className="font-medium">{step.note}</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border-2 bg-card p-5 shadow-soft">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-bold">Variables</h3><TypeLegend />
            </div>
            <VariablesPanel vars={step.vars} highlight={step.highlight} />
          </div>
        </div>
      </div>
    </div>
  );
}
