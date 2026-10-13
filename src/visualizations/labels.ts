import type { VisualizationKind } from "@/types/trace";

/** Tab labels for the walkthrough player's visualization switcher. */
export const visualizationLabels: Record<VisualizationKind, string> = {
  variables: "Variables",
  flow: "Flow",
  collections: "Collections",
  loop: "Loop",
  function: "Function",
};
