// Acceptance walkthroughs: the exact programs the QA acceptance review checks
// (QA_ACCEPTANCE_REPORT.md). They sit in the developer showcase (/dev/visualizations?w=<id>)
// so they can be inspected in a browser, and they're replayed in real Python by
// scripts/check-python.ts like every other walkthrough. Students never see them.

import type { PyItem } from "@/types/python";
import type { Walkthrough } from "@/types/trace";
import { buildSteps, py, type StepInput } from "@/walkthrough/build";

/** `for n in [<items>]:` / `print(n)` over a list literal, one lap per item, then the exit. */
function forOverLiteral(id: string, target: string, items: number[]): Walkthrough {
  const literal = `[${items.join(", ")}]`;
  const laps = items.flatMap((item, index): StepInput[] => [
    { line: 1, forLoop: { at: "next", index }, note: `Next item available? Yes: item ${index + 1} of ${items.length} rises out of its cell.` },
    { line: 1, set: { [target]: py.int(item) }, forLoop: { at: "assign", index }, note: `${target} now refers to ${item}.` },
    { line: 2, print: [String(item)], forLoop: { at: "body", index, bodyLine: 0 }, note: `The body runs and prints ${item}.` },
  ]);
  return {
    id,
    title: `for over ${items.length} item${items.length === 1 ? "" : "s"}`,
    language: "python",
    visualizations: ["loop", "variables"],
    forLoop: { target, iterable: literal, kind: "list", items: items as PyItem[], body: [`print(${target})`] },
    code: `for ${target} in ${literal}:
    print(${target})`,
    steps: buildSteps([
      ...laps,
      { line: 1, forLoop: { at: "exit", index: items.length }, note: "Next item available? No: every item has been used, so the loop ends." },
    ]),
  };
}

const range = (n: number, start = 1, step = 1) => Array.from({ length: n }, (_, i) => start + i * step);

/** The brief's for-loop example, exactly. */
export const qaForNumber = forOverLiteral("qa-for-number", "number", [10, 20, 30]);
export const qaFor1 = forOverLiteral("qa-for-1", "n", [7]);
export const qaFor5 = forOverLiteral("qa-for-5", "n", range(5, 10, 10));
export const qaFor6 = forOverLiteral("qa-for-6", "n", range(6, 10, 10));
export const qaFor20 = forOverLiteral("qa-for-20", "n", range(20));

const scoreCalc = (phase: "read" | "calculate" | "assign") => ({
  target: "score",
  parts: [{ code: "score", value: "10" }, { code: "+" }, { code: "5" }],
  result: "15",
  phase,
});

/** Reading, calculating and rebinding are separate events; score changes only on the last. */
export const qaScore: Walkthrough = {
  id: "qa-score",
  title: "score = score + 5",
  language: "python",
  visualizations: ["variables"],
  code: `score = 10
score = score + 5
print(score)`,
  steps: buildSteps([
    { line: 1, set: { score: py.int(10) }, highlight: "score", note: "score refers to 10." },
    { line: 2, calc: scoreCalc("read"), note: "Python reads the value score refers to now: 10." },
    { line: 2, calc: scoreCalc("calculate"), note: "It works out 10 + 5 = 15. score still refers to 10." },
    { line: 2, set: { score: py.int(15) }, highlight: "score", calc: scoreCalc("assign"), note: "Now score is rebound to 15." },
    { line: 3, print: ["15"], note: "print shows 15." },
  ]),
};

/** b = a shares one list object; append through b is seen through a. */
export const qaAlias: Walkthrough = {
  id: "qa-alias",
  title: "b = a shares one list",
  language: "python",
  visualizations: ["collections", "variables", "function"],
  code: `a = [1, 2]
b = a
b.append(3)
print(a)`,
  steps: buildSteps([
    { line: 1, set: { a: py.list([1, 2], "shared") }, note: "a refers to a new list." },
    { line: 2, set: { b: py.list([1, 2], "shared") }, note: "b refers to the same list object as a." },
    {
      line: 3,
      set: { a: py.list([1, 2, 3], "shared"), b: py.list([1, 2, 3], "shared") },
      mutation: { name: "b", kind: "append", index: 2, value: 3 },
      call: { name: "append", receiver: "b", receiverValue: "[1, 2]", args: ["3"], returns: "None", changes: "[1, 2, 3]", phase: "result" },
      note: "append changes the one list in place and returns None. a sees the 3 too.",
    },
    { line: 4, print: ["[1, 2, 3]"], note: "a and b are one list: [1, 2, 3]." },
  ]),
};

/** a.copy() makes a second list object; changing it leaves a alone. */
export const qaCopy: Walkthrough = {
  id: "qa-copy",
  title: "b = a.copy() makes a new list",
  language: "python",
  visualizations: ["collections", "variables"],
  code: `a = [1, 2]
b = a.copy()
b.append(3)
print(a, b)`,
  steps: buildSteps([
    { line: 1, set: { a: py.list([1, 2], "original") }, note: "a refers to a new list." },
    { line: 2, set: { b: py.list([1, 2], "copy") }, note: "copy() makes a separate list with the same items. b refers to it." },
    {
      line: 3,
      set: { b: py.list([1, 2, 3], "copy") },
      mutation: { name: "b", kind: "append", index: 2, value: 3 },
      note: "Only b's list gets the 3.",
    },
    { line: 4, print: ["[1, 2] [1, 2, 3]"], note: "Two lists: a is unchanged." },
  ]),
};

export const acceptanceVisuals: Walkthrough[] = [qaForNumber, qaFor1, qaFor5, qaFor6, qaFor20, qaScore, qaAlias, qaCopy];
