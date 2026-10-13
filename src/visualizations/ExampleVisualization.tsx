import type { TraceStep, VisualizationKind, Walkthrough } from "@/types/trace";
import { ConditionalFlow, FlowLegend } from "./conditional/ConditionalFlow";
import { FunctionView } from "./FunctionView";
import { LoopView } from "./LoopView";
import { ListView, StringView } from "./SequenceViews";
import { VariablesPanel } from "./VariableBox";

/**
 * Picks the right visualization for an example at one step. Each view reads its data from
 * the walkthrough and the step (`ifChain`, `loopItems`/`loopIndex`, `call`). The collections
 * view still reads a few demo-specific details.
 */
export function ExampleVisualization({ example, step, kind }: { example: Walkthrough; step: TraceStep; kind: VisualizationKind }) {
  const vars = step.vars;

  switch (kind) {
    case "variables":
      return <VariablesPanel vars={vars} highlight={step.highlight} />;

    case "flow":
      if (!example.ifChain) return null;
      return (
        <div className="space-y-4">
          <ConditionalFlow chain={example.ifChain} trace={step.ifChain} />
          <FlowLegend />
        </div>
      );

    case "loop":
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
      const fruits = vars["fruits"];
      const word = vars["word"];
      return (
        <div className="space-y-6">
          {fruits?.type === "list" && (
            <ListView
              name="fruits"
              items={fruits.value}
              activeIndex={step.line === 2 ? fruits.value.length - 1 : step.line === 5 ? 2 : undefined}
            />
          )}
          {word?.type === "str" && <StringView name="word" text={word.value} activeIndex={step.line >= 4 ? 0 : undefined} />}
        </div>
      );
    }
  }
}
