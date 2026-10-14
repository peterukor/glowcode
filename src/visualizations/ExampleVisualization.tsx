import type { TraceStep, VisualizationKind, Walkthrough } from "@/types/trace";
import { readingNames } from "@/walkthrough/controller";
import { ConditionalFlow, FlowLegend } from "./conditional/ConditionalFlow";
import { FunctionView } from "./FunctionView";
import { LoopView } from "./LoopView";
import { ListView, StringView } from "./SequenceViews";
import { VariablesPanel } from "./VariableBox";
import { WhileLoopView } from "./WhileLoopView";

/**
 * Picks the renderer for one view of one event. Renderers receive data, never code: each
 * one draws the walkthrough's fixed structure (`ifChain`, `loopItems`, `whileLoop`) in the
 * state the event describes (`step.ifChain`, `step.loopIndex`, `step.whileLoop`,
 * `step.call`, `step.element`). Nothing here interprets Python or guesses from line numbers,
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

    case "collections": {
      // Every list and string the program has, with the item being used marked.
      const sequences = Object.entries(step.vars).filter(([, v]) => v.type === "list" || v.type === "str");
      if (!sequences.length) return <p className="text-sm text-muted-foreground">No lists or strings yet.</p>;
      return (
        <div className="space-y-6">
          {sequences.map(([name, v]) => {
            const active = step.element?.name === name ? step.element.index : undefined;
            return v.type === "list" ? (
              <ListView key={name} name={name} items={v.value} activeIndex={active} />
            ) : v.type === "str" ? (
              <StringView key={name} name={name} text={v.value} activeIndex={active} />
            ) : null;
          })}
        </div>
      );
    }
  }
}
