import { describe, expect, it } from "vitest";
import { getExample } from "@/data/examples";
import type { Walkthrough } from "@/types/trace";
import { deriveChainState } from "@/visualizations/conditional/state";
import { buildSteps, py } from "./build";
import { allWalkthroughUses, walkthroughCatalog } from "./catalog";
import { initialPlayback, linePosition, readingNames, reducePlayback, viewPlayback, type PlaybackAction, type PlaybackState } from "./controller";
import { matchRecording, replayable, type RecordedEvent } from "./replay";
import { validateWalkthrough, validateWalkthroughs } from "./validate";

const reassign = getExample("reassign");
const run = (w: Walkthrough, actions: PlaybackAction["type"][] | PlaybackAction[]): PlaybackState =>
  actions.reduce<PlaybackState>(
    (s, a) => reducePlayback(w, s, typeof a === "string" ? ({ type: a } as PlaybackAction) : a),
    initialPlayback,
  );
const plain: Walkthrough = { ...reassign, steps: reassign.steps.map((s) => ({ ...s, checkpoint: undefined })) };

describe("playback controller", () => {
  it("steps forward and back one event at a time, within bounds", () => {
    expect(run(plain, ["next", "next"]).index).toBe(2);
    expect(run(plain, ["next", "next", "prev"]).index).toBe(1);
    expect(run(plain, ["prev"]).index).toBe(0);
    expect(run(plain, Array(20).fill("next")).index).toBe(plain.steps.length - 1);
  });

  it("derives the same view however you get to a step", () => {
    const direct = viewPlayback(plain, run(plain, ["next", "next"]));
    const roundabout = viewPlayback(plain, run(plain, ["next", "next", "next", "next", "prev", "prev"]));
    expect(roundabout).toEqual(direct);
    expect(viewPlayback(plain, run(plain, ["next", "next", "reset"]))).toEqual(viewPlayback(plain, initialPlayback));
  });

  it("waits at a prediction: Next is blocked until it's revealed", () => {
    let s = run(reassign, []);
    expect(viewPlayback(reassign, s).waiting?.index).toBe(1);
    expect(viewPlayback(reassign, s).canNext).toBe(false);
    s = reducePlayback(reassign, s, { type: "next" });
    expect(s.index).toBe(0);

    s = reducePlayback(reassign, s, { type: "check", choiceId: "3" });
    expect(s.records[1]).toEqual({ ruledOut: ["3"], correct: false, revealed: false });
    expect(s.index).toBe(0); // a wrong answer reveals nothing
    s = reducePlayback(reassign, s, { type: "check", choiceId: "5" });
    expect(s.records[1]!.correct).toBe(true);
    s = reducePlayback(reassign, s, { type: "reveal" });
    expect(s.index).toBe(1);
    expect(viewPlayback(reassign, s).recap?.correct).toBe(true);
  });

  it("never asks again when stepping back, and Reset asks again", () => {
    let s = run(reassign, [{ type: "reveal" }, { type: "prev" }]);
    expect(viewPlayback(reassign, s).waiting).toBeUndefined();
    s = reducePlayback(reassign, s, { type: "next" });
    expect(s.index).toBe(1);
    s = reducePlayback(reassign, s, { type: "reset" });
    expect(viewPlayback(reassign, s).waiting?.index).toBe(1);
  });

  it("ignores answers when nothing is waiting, and unknown choices", () => {
    const s = run(plain, [{ type: "check", choiceId: "5" }]);
    expect(s).toEqual(initialPlayback);
    expect(run(reassign, [{ type: "check", choiceId: "nope" }]).records).toEqual({});
  });

  it("describes repeated lines and several events on one line", () => {
    const loop = getExample("loop").steps;
    expect(linePosition(loop, 1)).toBeUndefined(); // the for line, first time
    expect(linePosition(loop, 2)).toBe("same line, next step"); // the item is assigned
    expect(linePosition(loop, 5)).toBe("running again"); // lap 2
    expect(linePosition(loop, 9)).toBe("running again (3rd time)");
  });

  it("knows which names a calculation reads", () => {
    const [, read, calc, assign] = reassign.steps;
    expect(readingNames(read!)).toEqual(["count"]);
    expect(readingNames(calc!)).toEqual(["count"]);
    expect(readingNames(assign!)).toEqual([]);
  });
    expect(readingNames(step({}))).toEqual(["score"]);
    expect(readingNames(step({ add: "15" }))).toEqual([]);
  });
});

describe("reassignment events", () => {
  it("reads, calculates and rebinds on the same line, without changing count early", () => {
    const line2 = reassign.steps.filter((s) => s.line === 2);
    expect(line2.map((s) => s.calc?.phase)).toEqual(["read", "calculate", "assign"]);
    expect(line2.map((s) => s.vars["count"])).toEqual([py.int(3), py.int(3), py.int(5)]);
    expect(reassign.steps[1]!.output).toBeUndefined(); // nothing printed before line 3
  });
});

describe("buildSteps", () => {
  it("carries variables and output forward and derives the highlight", () => {
    const steps = buildSteps([
      { line: 1, set: { a: py.int(1) }, note: "a" },
      { line: 2, set: { b: py.str("x") }, print: ["hi"], note: "b" },
      { line: 3, call: { name: "print", args: ["1"], prints: ["1"], phase: "result" }, note: "c" },
      { line: 4, unset: ["a"], note: "d" },
    ]);
    expect(steps[1]).toMatchObject({ vars: { a: py.int(1), b: py.str("x") }, output: ["hi"], highlight: "b" });
    expect(steps[2]!.output).toEqual(["hi", "1"]); // a call's prints count as output
    expect(steps[2]!.highlight).toBeUndefined();
    expect(steps[3]!.vars).toEqual({ b: py.str("x") });
    expect(steps[0]!.output).toBeUndefined();
  });
});

const base: Walkthrough = {
  id: "w",
  title: "W",
  language: "python",
  visualizations: ["variables"],
  code: "x = 1\nx = x + 1\nprint(x)",
  steps: buildSteps([
    { line: 1, set: { x: py.int(1) }, note: "x" },
    { line: 2, calc: { target: "x", parts: [{ code: "x", value: "1" }, { code: "+" }, { code: "1" }], result: "2", phase: "calculate" }, note: "c" },
    { line: 2, set: { x: py.int(2) }, calc: { target: "x", parts: [{ code: "x", value: "1" }, { code: "+" }, { code: "1" }], result: "2", phase: "assign" }, note: "a" },
    { line: 3, print: ["2"], note: "p" },
  ]),
};

const andOrChain: Walkthrough["ifChain"] = {
  branches: [
    {
      id: "b1",
      keyword: "if",
      condition: {
        kind: "boolop",
        id: "g1",
        op: "and",
        operands: [
          { kind: "compare", id: "c1", code: "a" },
          { kind: "compare", id: "c2", code: "b" },
        ],
      },
      body: ["pass"],
    },
    { id: "b2", keyword: "elif", condition: { kind: "compare", id: "c3", code: "c" }, body: ["pass"] },
  ],
};
const withResults = (results: Record<string, boolean>): Walkthrough => ({
  ...base,
  visualizations: ["flow"],
  ifChain: andOrChain,
  steps: [{ line: 1, vars: {}, note: "n", ifChain: { results, at: { kind: "test", branch: "b1" } } }],
});

describe("validateWalkthrough", () => {
  it("accepts a correct walkthrough", () => {
    expect(validateWalkthrough(base)).toEqual([]);
  });

  it.each([
    ["no steps", { ...base, steps: [] }, /has no steps/],
    ["unknown view", { ...base, visualizations: ["sparkles" as never] }, /unknown visualization kind/],
    ["flow without a chain", { ...base, visualizations: ["flow"] as const }, /flow view needs an ifChain/],
    ["loop without data", { ...base, visualizations: ["loop"] as const }, /loop view needs/],
    ["missing note", { ...base, steps: base.steps.map((s, i) => (i === 0 ? { ...s, note: "" } : s)) }, /needs a note/],
    ["bad line", { ...base, steps: [...base.steps, { ...base.steps[3]!, line: 9 }] }, /line 9, which doesn't exist/],
    [
      "value changes before the assign event",
      { ...base, steps: base.steps.map((s, i) => (i === 1 ? { ...s, vars: { x: py.int(2) } } : s)) },
      /changes before the calc's assign event/,
    ],
    ["assign stores a different value", { ...base, steps: base.steps.map((s, i) => (i === 2 ? { ...s, vars: { x: py.int(3) } } : s)) }, /calc result is 2/],
    ["malformed int", { ...base, steps: base.steps.map((s, i) => (i === 0 ? { ...s, vars: { x: py.int(1.5) } } : s)) }, /malformed int/],
    ["element out of range", { ...base, steps: base.steps.map((s, i) => (i === 0 ? { ...s, vars: { w: py.str("ab") }, element: { name: "w", index: 5 } } : s)) }, /out of range/],
  ])("catches %s", (_name, w, problem) => {
    expect(validateWalkthrough(w as Walkthrough).join("\n")).toMatch(problem);
  });

  it("follows Python's short-circuit and branch order", () => {
    expect(validateWalkthrough(withResults({ c1: true, c2: false }))).toEqual([]);
    expect(validateWalkthrough(withResults({ c1: false, c2: true })).join()).toMatch(/Python skips it/);
    expect(validateWalkthrough(withResults({ c2: true })).join()).toMatch(/before the operands before it/);
    expect(validateWalkthrough(withResults({ c1: true, c2: true, c3: true })).join()).toMatch(/earlier branch already decided/);
    expect(validateWalkthrough(withResults({ c9: true })).join()).toMatch(/unknown condition "c9"/);
  });

  it("checks while-loop progress", () => {
    const w: Walkthrough = {
      ...base,
      visualizations: ["loop"],
      whileLoop: { condition: "x < 2", body: ["x += 1"] },
      steps: [
        { line: 1, vars: {}, note: "n", whileLoop: { checks: 2, at: "check", result: true } },
        { line: 1, vars: {}, note: "n", whileLoop: { checks: 1, at: "body", result: false } },
        { line: 1, vars: {}, note: "n", whileLoop: { checks: 2, at: "exit", result: true } },
      ],
    };
    const problems = validateWalkthrough(w).join("\n");
    expect(problems).toMatch(/can't go backwards/);
    expect(problems).toMatch(/body can't run after a False check/);
    expect(problems).toMatch(/only end after a False check/);
  });

  it("rejects two different walkthroughs with one id, but allows reusing the same one", () => {
    expect(validateWalkthroughs([base, base])).toEqual([]);
    expect(validateWalkthroughs([base, { ...base }]).join()).toMatch(/Two different walkthroughs use the id "w"/);
  });
});

describe("every walkthrough in the app", () => {
  it("is valid, and ids are unique", () => {
    expect(validateWalkthroughs(allWalkthroughUses())).toEqual([]);
  });

  it("is listed once in the catalog, with where it's used", () => {
    const catalog = walkthroughCatalog();
    expect(new Set(catalog.map((e) => e.walkthrough.id)).size).toBe(catalog.length);
    expect(catalog.find((e) => e.walkthrough.id === "len")!.usedIn).toEqual(["Playground", "Manual: len()"]);
    expect(catalog.find((e) => e.walkthrough.id === "py-score-reassign")!.usedIn).toEqual(["Lesson: Changing Values with Reassignment"]);
  });
});

describe("conditional state", () => {
  it("shows a short-circuited comparison as skipped, never as evaluated", () => {
    const andOr = getExample("and-or");
    const atElif = andOr.steps.find((s) => s.ifChain?.results.c3 !== undefined)!;
    const state = deriveChainState(andOr.ifChain!, atElif.ifChain);
    expect(state.conditions.c4).toBe("skipped"); // `with_adult or ...` was already True
    expect(state.taken).toBe("b2");
  });

  it("shows nothing as evaluated before Python gets there", () => {
    const ifElse = getExample("if-else");
    const state = deriveChainState(ifElse.ifChain!, ifElse.steps[0]!.ifChain);
    expect(state.conditions.c1).toBe("idle");
    expect(state.taken).toBeUndefined();
  });
});

describe("matchRecording (replaying against Python)", () => {
  // What a tracer records for `x = 1 / x = x + 1 / print(x)`: state before each line, then the end.
  const recording: RecordedEvent[] = [
    { line: 1, vars: {}, out: "" },
    { line: 2, vars: { x: 1 }, out: "" },
    { line: 3, vars: { x: 2 }, out: "" },
    { line: null, vars: { x: 2 }, out: "2\n" },
  ];

  it("accepts steps that match the real run, and asks Python to check the calculation", () => {
    const { problems, evals } = matchRecording(base, recording);
    expect(problems).toEqual([]);
    expect(evals).toEqual([
      { at: 1, expr: "x + 1", expect: "2", what: "step 2: x's calculation" },
      { at: 1, expr: "x", expect: "1", what: "step 2: the value of x" },
    ]);
  });

  it("reports a wrong value after a line", () => {
    const wrong = { ...base, steps: base.steps.map((s, i) => (i >= 2 ? { ...s, vars: { x: py.int(3) } } : s)) };
    expect(matchRecording(wrong, recording).problems.join()).toMatch(/after this line Python has \{"x":2\}/);
  });

  it("reports lines that Python doesn't run at that point", () => {
    const extra = { ...base, steps: [...base.steps, { ...base.steps[0]!, line: 2 }] };
    expect(matchRecording(extra, recording).problems.join()).toMatch(/doesn't run line 2 at this point/);
  });

  it("replays functions too, but not input(), classes or imports", () => {
    expect(replayable(base)).toBe(true);
    expect(replayable(getExample("function"))).toBe(true);
    expect(replayable({ ...base, code: 'name = input("Name: ")' })).toBe(false);
    expect(replayable({ ...base, code: "import math\nx = 1" })).toBe(false);
  });

  it("compares which names share one object with Python's id()s", () => {
    const shared: Walkthrough = {
      ...base,
      code: "a = [1]\nb = a",
      steps: [
        { line: 1, vars: { a: py.list([1], "L1") }, note: "n" },
        { line: 2, vars: { a: py.list([1], "L1"), b: py.list([1], "L1") }, note: "n" },
      ],
    };
    const a = { list: [1] };
    const rec: RecordedEvent[] = [
      { line: 1, vars: {}, out: "", ids: {} },
      { line: 2, vars: { a }, out: "", ids: { a: 7 } },
      { line: null, vars: { a, b: a }, out: "", ids: { a: 7, b: 7 } },
    ];
    expect(matchRecording(shared, rec).problems).toEqual([]);
    // Python made a copy, but the walkthrough draws one shared object.
    const copied = rec.map((e, i) => (i === 2 ? { ...e, ids: { a: 7, b: 8 } } : e));
    expect(matchRecording(shared, copied).problems.join()).toMatch(/names sharing one object: Python has \[\], the walkthrough shows \[a=b\]/);
  });

  it("follows a call into its function and back to the waiting line", () => {
    const call: Walkthrough = {
      ...base,
      code: "def double(n):\n    return n * 2\nx = double(4)",
      steps: [
        { line: 1, vars: {}, note: "n" },
        { line: 3, vars: {}, note: "n" },
        { line: 2, vars: { n: py.int(4) }, frame: "double", callers: [{ name: "<module>", vars: {}, calling: "double(4)" }], note: "n" },
        { line: 3, vars: { x: py.int(8) }, note: "n" },
      ],
    };
    const main = (vars: Record<string, unknown>) => ({ name: "<module>", vars });
    const rec: RecordedEvent[] = [
      { line: 1, vars: {}, out: "", stack: [main({})] },
      { line: 3, vars: {}, out: "", stack: [main({})] },
      { line: 2, vars: { n: 4 }, out: "", stack: [main({}), { name: "double", vars: { n: 4 } }] },
      { line: 3, vars: {}, out: "", stack: [main({})], kind: "return" },
      { line: null, vars: { x: 8 }, out: "", stack: [main({ x: 8 })] },
    ];
    expect(matchRecording(call, rec).problems).toEqual([]);
    const wrongFrame = { ...call, steps: call.steps.map((s, i) => (i === 2 ? { ...s, frame: "triple" } : s)) };
    expect(matchRecording(wrongFrame, rec).problems.join()).toMatch(/call stack: Python has <module> > double, the walkthrough shows <module> > triple/);
  });
});

describe("validateWalkthrough: collections, loops, trees and frames", () => {
  const lists = (steps: Walkthrough["steps"]): Walkthrough => ({ ...base, visualizations: ["collections"], steps });

  it("checks a mutation against the object before it, and keeps its identity", () => {
    const ok = lists([
      { line: 1, vars: { xs: py.list([1, 2], "L") }, note: "n" },
      { line: 1, vars: { xs: py.list([1, 2, 3], "L") }, mutation: { name: "xs", kind: "append", index: 2, value: 3 }, note: "n" },
    ]);
    expect(validateWalkthrough(ok)).toEqual([]);
    const wrongResult = lists([ok.steps[0]!, { ...ok.steps[1]!, vars: { xs: py.list([3, 1, 2], "L") } }]);
    expect(validateWalkthrough(wrongResult).join()).toMatch(/after append, "xs" should be \[1, 2, 3\]/);
    const newObject = lists([ok.steps[0]!, { ...ok.steps[1]!, vars: { xs: py.list([1, 2, 3], "M") } }]);
    expect(validateWalkthrough(newObject).join()).toMatch(/object id must stay the same/);
    const popWrong = lists([ok.steps[0]!, { ...ok.steps[1]!, vars: { xs: py.list([1], "L") }, mutation: { name: "xs", kind: "pop", index: 1, removed: 9 } }]);
    expect(validateWalkthrough(popWrong).join()).toMatch(/says pop removed 9, but index 1 held 2/);
  });

  it("requires names that share one object to show the same value", () => {
    const w = lists([{ line: 1, vars: { a: py.list([1], "L"), b: py.list([2], "L") }, note: "n" }]);
    expect(validateWalkthrough(w).join()).toMatch(/"a" and "b" share object L but show different values/);
  });

  it("checks indexes, slices and membership results", () => {
    const w = lists([
      { line: 1, vars: { s: py.str("abc") }, element: { name: "s", index: -4 }, note: "n" },
      { line: 1, vars: { s: py.str("abc") }, slice: { name: "s", start: 2, stop: 5 }, note: "n" },
      { line: 1, vars: { s: py.str("abc"), t: py.set([1, 2], "T") }, membership: { name: "t", value: 3, result: true }, note: "n" },
    ]);
    const problems = validateWalkthrough(w).join("\n");
    expect(problems).toMatch(/element index -4 is out of range/);
    expect(problems).toMatch(/slice bounds are outside/);
    expect(problems).toMatch(/says 3 in t is True, but it's False/);
  });

  it("checks that an expression tree is worked out from the bottom up", () => {
    const tree = { id: "add", code: "1 + 2 * 3", op: "+", left: { id: "a", code: "1" }, right: { id: "mul", code: "2 * 3", op: "*", left: { id: "b", code: "2" }, right: { id: "c", code: "3" } } };
    const w: Walkthrough = {
      ...base,
      steps: [{ line: 1, vars: {}, calc: { target: "x", parts: [{ code: "1" }, { code: "+" }, { code: "2" }, { code: "*" }, { code: "3" }], result: "7", phase: "calculate", tree, active: "add", done: {} }, note: "n" }],
    };
    expect(validateWalkthrough(w).join()).toMatch(/"1 \+ 2 \* 3" is evaluated before "2 \* 3"/);
  });

  it("checks for-loop events: order, the loop variable, and the exit", () => {
    const shape = { target: "n", iterable: "[1, 2]", kind: "list" as const, items: [1, 2], body: ["print(n)"] };
    const w: Walkthrough = {
      ...base,
      visualizations: ["loop"],
      forLoop: shape,
      steps: [
        { line: 1, vars: { n: py.int(2) }, forLoop: { at: "assign", index: 1 }, note: "n" },
        { line: 1, vars: { n: py.int(5) }, forLoop: { at: "assign", index: 0 }, note: "n" },
        { line: 1, vars: { n: py.int(2) }, forLoop: { at: "exit", index: 1 }, note: "n" },
      ],
    };
    const problems = validateWalkthrough(w).join("\n");
    expect(problems).toMatch(/can't go backwards/);
    expect(problems).toMatch(/n should refer to 1 once it's assigned, but the step shows 5/);
    expect(problems).toMatch(/for-loop index 1 doesn't fit "exit" with 2 items/);
  });

  it("asks for a stack view only when steps have frames", () => {
    expect(validateWalkthrough({ ...base, visualizations: ["stack"] }).join()).toMatch(/stack view needs steps with a frame or callers/);
  });
});
