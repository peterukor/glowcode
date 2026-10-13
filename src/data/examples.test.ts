import { describe, expect, it } from "vitest";
import { validateWalkthrough } from "@/courses/validateWalkthrough";
import type { Walkthrough } from "@/types/trace";
import { examples } from "./examples";

describe("playground examples", () => {
  it("are all valid walkthroughs", () => {
    expect(examples.flatMap(validateWalkthrough)).toEqual([]);
  });

  it("include the three Phase 2.1 demonstrations, each with a prediction", () => {
    for (const id of ["reassign", "if-else", "len"]) {
      const example = examples.find((e) => e.id === id)!;
      expect(example.steps.some((s) => s.checkpoint)).toBe(true);
    }
  });

  it("splits a calculation and its assignment into two events on one line", () => {
    const steps = examples.find((e) => e.id === "reassign")!.steps.filter((s) => s.line === 2);
    expect(steps.map((s) => s.calc?.phase)).toEqual(["calculate", "assign"]);
    // While calculating, the variable still refers to the old value.
    expect(steps[0]!.vars["count"]).toEqual({ type: "int", value: 3 });
    expect(steps[1]!.vars["count"]).toEqual({ type: "int", value: 5 });
  });

  it("revisits the loop line on every lap and once more to exit", () => {
    const loop = examples.find((e) => e.id === "loop")!;
    const forLine = loop.steps.filter((s) => s.line === 2);
    expect(forLine.map((s) => s.loopIndex)).toEqual([0, 1, 2, 3]);
    expect(loop.steps.at(-1)!.output).toEqual(["15"]);
  });

  it("keeps a function's returned value apart from what it prints", () => {
    const len = examples.find((e) => e.id === "len")!;
    const returned = len.steps.find((s) => s.call?.name === "len" && s.call.phase === "result")!;
    expect(returned.call!.returns).toBe("3");
    expect(returned.call!.prints).toBeUndefined();
    expect(returned.output ?? []).toEqual([]); // returning prints nothing
    const printed = len.steps.find((s) => s.call?.name === "print" && s.call.phase === "result")!;
    expect(printed.call!.prints).toEqual(["3"]);
    expect(printed.call!.returns).toBe("None");
  });

  it("takes only the else path when the condition is False", () => {
    const ifElse = examples.find((e) => e.id === "if-else")!;
    const last = ifElse.steps.at(-1)!;
    expect(last.ifChain).toEqual({ results: { c1: false }, at: { kind: "else" } });
    expect(last.output).toEqual(["Minor"]);
  });
});

describe("validateWalkthrough", () => {
  const base: Walkthrough = {
    id: "w",
    title: "W",
    language: "python",
    visualizations: ["variables"],
    code: "x = 1\nprint(x)",
    steps: [
      { line: 1, vars: { x: { type: "int", value: 1 } }, note: "" },
      { line: 2, vars: { x: { type: "int", value: 1 } }, output: ["1"], note: "" },
    ],
  };

  it("accepts a correct walkthrough", () => {
    expect(validateWalkthrough(base)).toEqual([]);
  });

  it("reports broken predictions, vanishing output and bad lines", () => {
    const broken: Walkthrough = {
      ...base,
      steps: [
        {
          ...base.steps[0]!,
          checkpoint: { prompt: "?", choices: [{ id: "a", text: "A" }], answer: "a", explanation: "" },
        },
        { ...base.steps[1]!, checkpoint: { prompt: "?", choices: [{ id: "a", text: "A" }, { id: "a", text: "B" }], answer: "z", explanation: "" } },
        { line: 9, vars: {}, output: [], note: "" },
      ],
    };
    const problems = validateWalkthrough(broken).join("\n");
    expect(problems).toMatch(/first step can't have a prediction/);
    expect(problems).toMatch(/answer "z" isn't one of its choices/);
    expect(problems).toMatch(/duplicate choice ids/);
    expect(problems).toMatch(/line 9, which doesn't exist/);
    expect(problems).toMatch(/printed output from an earlier step is missing/);
  });
});
