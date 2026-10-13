import type { TraceStep, VisualizationKind, Walkthrough } from "@/types/trace";
import { ConditionalFlow, FlowLegend } from "./conditional/ConditionalFlow";
import { FunctionView, type FunctionStage } from "./FunctionView";
import { LoopView } from "./LoopView";
import { ListView, StringView } from "./SequenceViews";
import { VariablesPanel } from "./VariableBox";

/**
 * Picks the right visualization for an example at one step.
 * The loop / function / collections views still read a few demo-specific details;
 * they move into the trace format once those views get the same treatment as `flow`.
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
      return (
        <div className="py-6">
          <LoopView items={[3, 5, 7]} current={step.loopIndex} />
        </div>
      );

    case "function": {
      const stage: FunctionStage =
        step.line === 5 && !vars["text"] ? 1 : step.line === 2 ? 2 : step.line === 3 || vars["text"] ? 3 : 0;
      return <FunctionView name="greet" input='"Sam"' output='"Hi, Sam"' stage={stage} />;
    }

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
