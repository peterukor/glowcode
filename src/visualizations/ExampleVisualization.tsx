import type { TraceStep, VisualizationKind, Walkthrough } from "@/types/trace";
import { readingNames } from "@/walkthrough/controller";
import { ConditionalFlow, FlowLegend } from "./conditional/ConditionalFlow";
import { CallStackView } from "./CallStackView";
import { CollectionsView } from "./CollectionsView";
import { ForLoopView } from "./ForLoopView";
import { FunctionView } from "./FunctionView";
import { LoopView } from "./LoopView";
import { VariablesPanel } from "./VariableBox";
import { WhileLoopView } from "./WhileLoopView";

/**
 * Picks the renderer for one view of one event. Renderers receive data, never code: each
 * one draws the walkthrough's fixed structure (`ifChain`, `forLoop`, `whileLoop`, `loopItems`)
 * in the state the event describes (`step.ifChain`, `step.forLoop`, `step.whileLoop`,
 * `step.call`, `step.element`, `step.slice`, `step.mutation`, `step.frame` ...). Nothing here interprets Python or guesses from line numbers,
 * so a future tracer that produces the same data gets the same pictures.
 */
export function ExampleVisualization({
  example,
  step,
  previous,
  kind,
}: {
  example: Walkthrough;
  step: TraceStep;
  /** The event before this one, for showing what changed. */
  previous?: TraceStep;
  kind: VisualizationKind;
}) {
  switch (kind) {
    case "variables":
      return <VariablesPanel vars={step.vars} highlight={step.highlight} previous={previous?.vars} reading={readingNames(step)} />;

    case "flow":
      if (!example.ifChain) return null;
      return (
        <div className="space-y-4">
          <ConditionalFlow chain={example.ifChain} trace={step.ifChain} />
          <FlowLegend />
        </div>
      );

    case "loop":
      if (example.forLoop) return <ForLoopView shape={example.forLoop} trace={step.forLoop} vars={step.vars} />;
      if (example.whileLoop) return <WhileLoopView shape={example.whileLoop} trace={step.whileLoop} />;
      if (!example.loopItems) return null;
      return (
        <div className="py-6">
          <LoopView items={example.loopItems} current={step.loopIndex} />
        </div>
      );

    case "function":
      return step.call ? (
        <FunctionView call={step.call} />
      ) : (
        <p className="text-sm text-muted-foreground">No function is being called on this step.</p>
      );

    case "collections":
      return <CollectionsView step={step} previous={previous} strings={indexedNames(example)} />;

    case "stack":
      return <CallStackView step={step} previous={previous} />;
  }
}

/** Names the walkthrough indexes, slices or tests membership in: the strings worth drawing as sequences. */
function indexedNames(w: Walkthrough): Set<string> {
  return new Set(w.steps.flatMap((s) => [s.element?.name, s.slice?.name, s.membership?.name].filter((n): n is string => !!n)));
}
