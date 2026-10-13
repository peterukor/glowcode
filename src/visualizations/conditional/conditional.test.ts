import { describe, expect, it } from "vitest";
import { examples } from "@/data/examples";
import type { Condition, IfChain } from "@/types/conditional";
import { layoutIfChain } from "./layout";
import { deriveChainState, evaluate } from "./state";

const cmp = (id: string): Condition => ({ kind: "compare", id, code: id });
const and = (...operands: Condition[]): Condition => ({ kind: "boolop", id: "and", op: "and", operands });
const or = (...operands: Condition[]): Condition => ({ kind: "boolop", id: "or", op: "or", operands });

describe("evaluate", () => {
  it("follows Python's short-circuit rules", () => {
    expect(evaluate(and(cmp("a"), cmp("b")), { a: false })).toBe(false); // b never checked
    expect(evaluate(and(cmp("a"), cmp("b")), { a: true })).toBeUndefined(); // still waiting on b
    expect(evaluate(and(cmp("a"), cmp("b")), { a: true, b: true })).toBe(true);
    expect(evaluate(or(cmp("a"), cmp("b")), { a: true })).toBe(true);
    expect(evaluate(or(cmp("a"), cmp("b")), { a: false, b: false })).toBe(false);
  });
});

describe("deriveChainState", () => {
  const chain: IfChain = {
    branches: [
      { id: "if", keyword: "if", condition: and(cmp("a"), cmp("b")), body: ["x = 1"] },
      { id: "elif", keyword: "elif", condition: cmp("c"), body: ["x = 2"] },
    ],
    elseBody: ["x = 3"],
  };

  it("is all idle before Python reaches the if", () => {
    const s = deriveChainState(chain, { results: {} });
    expect(s.taken).toBeUndefined();
    expect(Object.values(s.decisions)).toEqual(["idle", "idle"]);
  });

  it("marks short-circuited comparisons as skipped", () => {
    const s = deriveChainState(chain, { results: { a: false } });
    expect(s.conditions["a"]).toBe("false");
    expect(s.conditions["b"]).toBe("skipped");
    expect(s.decisions["if"]).toBe("false");
    expect(s.decisions["elif"]).toBe("idle");
  });

  it("skips everything after the first True branch", () => {
    const s = deriveChainState(chain, { results: { a: true, b: true } });
    expect(s.taken).toBe("if");
    expect(s.decisions["elif"]).toBe("skipped");
    expect(s.conditions["c"]).toBe("skipped");
  });

  it("falls through to else when every condition is False", () => {
    expect(deriveChainState(chain, { results: { a: false, c: false } }).taken).toBe("else");
    const noElse = { ...chain, elseBody: undefined };
    expect(deriveChainState(noElse, { results: { a: false, c: false } }).taken).toBe("none");
  });
});

describe("layoutIfChain", () => {
  const flowExamples = examples.filter((e) => e.ifChain);

  it.each(flowExamples.map((e) => [e.id, e.ifChain!] as const))("%s: every if/elif has a True and a False line", (_, chain) => {
    const { edges } = layoutIfChain(chain);
    for (const branch of chain.branches) {
      expect(edges.some((e) => e.source.kind === "true" && e.source.branch === branch.id)).toBe(true);
      expect(edges.some((e) => e.source.kind === "false" && e.source.branch === branch.id)).toBe(true);
    }
  });

  it.each(flowExamples.map((e) => [e.id, e.ifChain!] as const))("%s: no two boxes overlap", (_, chain) => {
    const { nodes } = layoutIfChain(chain);
    // Frames contain their content by design; every other box must stand alone.
    const boxes = nodes.flatMap((n) => (n.type !== "frame" && "box" in n ? [n.box] : []));
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i]!;
        const b = boxes[j]!;
        const overlap = a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
        expect(overlap, `boxes ${i} and ${j} overlap`).toBe(false);
      }
    }
  });

  it("feeds every and/or operand into its operator node", () => {
    const chain = examples.find((e) => e.id === "and-or")!.ifChain!;
    const operandEdges = layoutIfChain(chain).edges.filter((e) => e.source.kind === "operand");
    expect(operandEdges).toHaveLength(4);
  });

  it("matches every trace in the examples to a real branch", () => {
    for (const example of flowExamples) {
      const ids = new Set(example.ifChain!.branches.map((b) => b.id));
      for (const step of example.steps) {
        const at = step.ifChain?.at;
        if (at && (at.kind === "test" || at.kind === "body")) expect(ids.has(at.branch)).toBe(true);
      }
    }
  });
});
