import { createFileRoute } from "@tanstack/react-router";
import { Info } from "lucide-react";
import { useState } from "react";
import { WalkthroughPlayer } from "@/components/walkthrough/WalkthroughPlayer";
import { examples } from "@/data/examples";

export const Route = createFileRoute("/playground")({
  head: () => ({
    meta: [
      { title: "Python Playground · Glowcode" },
      { name: "description", content: "Step through Python code and watch variables, decisions and loops animate." },
    ],
  }),
  component: Playground,
});

function Playground() {
  const [exampleId, setExampleId] = useState(examples[0]!.id);
  const example = examples.find((e) => e.id === exampleId) ?? examples[0]!;

  const picker = (
    <div className="mb-5 flex flex-wrap items-center gap-2">
      <span className="mr-2 text-sm font-bold text-muted-foreground">Examples</span>
      {examples.map((e) => (
        <button
          key={e.id}
          type="button"
          onClick={() => setExampleId(e.id)}
          aria-pressed={e.id === exampleId}
          className={`rounded-full border-2 px-4 py-1.5 text-sm font-semibold transition-all ${
            e.id === exampleId ? "border-primary bg-primary-button text-primary-foreground shadow-soft" : "bg-card hover:border-primary"
          }`}
        >
          {e.emoji} {e.title}
        </button>
      ))}
      <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-sun/25 px-3 py-1 text-xs font-bold">
        <Info className="h-3.5 w-3.5" /> Prototype: replays a pre-recorded trace
      </span>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-5">
      {/* Keyed so switching examples starts fresh (step 1, default view). */}
      <WalkthroughPlayer key={example.id} walkthrough={example} playLabel="Run demo" header={picker} />
    </div>
  );
}
