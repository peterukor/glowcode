import { getReference } from "@/references/registry";
import type { Walkthrough } from "@/types/trace";
import { referencesIn } from "./richText";

/**
 * Checks one hand-written walkthrough for mistakes the player would show to students:
 * steps on lines that don't exist, predictions with no right answer, printed output
 * that disappears between steps, and diagrams whose data doesn't match the step.
 * It can't check that the values are what Python would produce; `scripts/check-python.ts`
 * runs the code for that.
 */
export function validateWalkthrough(w: Walkthrough): string[] {
  const problems: string[] = [];
  const say = (i: number, msg: string) => problems.push(`walkthrough "${w.id}" step ${i + 1}: ${msg}`);
  const lineCount = w.code.split("\n").length;

  w.steps.forEach((step, i) => {
    if (step.line < 1 || step.line > lineCount) say(i, `points at line ${step.line}, which doesn't exist`);

    const before = w.steps[i - 1]?.output ?? [];
    const now = step.output ?? [];
    if (before.some((line, j) => now[j] !== line)) say(i, "printed output from an earlier step is missing (output must include everything printed so far)");

    const cp = step.checkpoint;
    if (cp) {
      if (i === 0) say(i, "the first step can't have a prediction: there's no earlier step to pause on");
      if (!cp.choices.some((c) => c.id === cp.answer)) say(i, `prediction answer "${cp.answer}" isn't one of its choices`);
      const ids = cp.choices.map((c) => c.id);
      if (new Set(ids).size !== ids.length) say(i, "prediction has duplicate choice ids");
      const texts = [cp.prompt, cp.explanation, ...cp.choices.flatMap((c) => [c.text, c.feedback ?? ""])];
      for (const id of texts.flatMap(referencesIn)) if (!getReference(id)) say(i, `unknown reference "${id}"`);
    }

    if (step.calc?.phase === "assign" && !(step.calc.target in step.vars)) {
      say(i, `calc assigns to "${step.calc.target}", but that variable isn't in the step's vars`);
    }
    if (step.call?.prints && (step.call.phase === "result" || step.call.phase === "assign")) {
      const tail = now.slice(-step.call.prints.length);
      if (tail.join("\n") !== step.call.prints.join("\n")) say(i, "call prints something that isn't at the end of the step's output");
    }
    if (step.call?.assignTo && step.call.phase === "assign" && !(step.call.assignTo in step.vars)) {
      say(i, `call stores into "${step.call.assignTo}", but that variable isn't in the step's vars`);
    }
    if (step.loopIndex !== undefined && !w.loopItems) say(i, "has a loopIndex but the walkthrough has no loopItems");
  });

  if (w.visualizations.includes("flow") && !w.ifChain) problems.push(`walkthrough "${w.id}": flow view needs an ifChain`);
  return problems;
}
