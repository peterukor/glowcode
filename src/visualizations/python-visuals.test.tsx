// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { WalkthroughPlayer } from "@/components/walkthrough/WalkthroughPlayer";
import { pythonVisuals } from "@/data/pythonVisuals";
import type { ForLoopShape, TraceStep, Walkthrough } from "@/types/trace";
import { py } from "@/walkthrough/build";
import { CalculationView } from "./CalculationView";
import { CallStackView } from "./CallStackView";
import { CollectionsView } from "./CollectionsView";
import { ForLoopView } from "./ForLoopView";
import { FunctionView } from "./FunctionView";
import { SegmentedSequence } from "./SegmentedSequence";
import { VariablesPanel } from "./VariableBox";

afterEach(cleanup);

const demo = (id: string) => pythonVisuals.find((w) => w.id === id)!;
const plain = (w: Walkthrough): Walkthrough => ({ ...w, steps: w.steps.map((s) => ({ ...s, checkpoint: undefined })) });
const cells = () => [...document.querySelectorAll(".seq-cell")];
const visibleValues = () => cells().filter((c) => !c.hasAttribute("aria-hidden")).map((c) => c.querySelector(".seq-value")!.textContent);
const more = () => [...document.querySelectorAll(".seq-more")].map((m) => m.hasAttribute("data-show"));

describe("SegmentedSequence", () => {
  it("draws one container of cells with real indexes", () => {
    render(<SegmentedSequence items={[10, 20, 30]} />);
    expect(visibleValues()).toEqual(["10", "20", "30"]);
    expect([...document.querySelectorAll(".seq-index")].map((e) => e.textContent)).toEqual(["0", "1", "2"]);
    expect(more()).toEqual([false, false]);
  });

  it("shows five items of a long list, with an ellipsis only where items are hidden", () => {
    render(<SegmentedSequence items={[0, 1, 2, 3, 4, 5, 6, 7, 8]} />);
    expect(visibleValues()).toEqual(["0", "1", "2", "3", "4"]);
    expect(more()).toEqual([false, true]);
    cleanup();
    render(<SegmentedSequence items={[0, 1, 2, 3, 4, 5, 6, 7, 8]} focus={{ lo: 8, hi: 8 }} states={{ 8: "active" }} />);
    expect(visibleValues()).toEqual(["4", "5", "6", "7", "8"]);
    expect(more()).toEqual([true, false]);
    // Indexes stay the real ones when the window moves.
    expect(cells()[8]!.querySelector(".seq-index")!.textContent).toBe("8");
  });

  it("shows negative indexes on request, and ? for values not produced yet", () => {
    render(<SegmentedSequence items={["a", "b"]} strings showNegative states={{ 1: "pending" }} />);
    expect([...document.querySelectorAll(".seq-index-neg")].map((e) => e.textContent)).toEqual(["-2", "-1"]);
    expect(visibleValues()).toEqual(["a", "?"]);
  });
});

// The SVG diagrams expose their state as data attributes, so tests read what glows directly.
const strip = () => [...document.querySelectorAll(".strip-cell")];
const stripState = (i: number) => strip()[i]!.getAttribute("data-state");
const stripValues = () => strip().filter((c) => !c.hasAttribute("aria-hidden")).map((c) => c.querySelector(".strip-value")!.textContent);
const node = (id: string) => document.querySelector(`[data-node="${id}"]`)!.getAttribute("data-look");
const edge = (id: string) => document.querySelector(`[data-edge="${id}"]`)!.getAttribute("data-look");
const labelTone = (id: string) => document.querySelector(`[data-edge="${id}"]`) && [...document.querySelectorAll(".flow-label")].find((l) => l.textContent === (id === "yes" ? "Yes" : "No"))!.getAttribute("data-tone");
const text = (sel: string) => [...document.querySelectorAll(sel)].map((e) => e.textContent);

describe("ForLoopView", () => {
  const shape: ForLoopShape = { target: "number", iterable: "[10, 20, 30]", kind: "list", items: [10, 20, 30], body: ["print(number)"], after: 'print("done")' };

  it("before the loop: the whole flowchart is there, nothing glows, nothing is answered", () => {
    render(<ForLoopView shape={shape} vars={{}} />);
    for (const code of ["Next item available?", "print(number)", 'print("done")']) expect(text(".flow-code")).toContain(code);
    expect(document.querySelectorAll('[data-look="lit"]')).toHaveLength(0);
    expect(document.querySelector(".flow-decision-answer")).toBeNull();
    expect(document.querySelector(".loop-chip")).toBeNull();
  });

  it("next: the current item lifts out and travels to the question, answered Yes", () => {
    render(<ForLoopView shape={shape} trace={{ at: "next", index: 1 }} vars={{ number: py.int(10) }} />);
    expect([stripState(0), stripState(1), stripState(2)]).toEqual(["visited", "raised", "idle"]);
    expect(node("decision")).toBe("true");
    expect(document.querySelector(".flow-decision-answer")!.textContent).toBe("✓ Yes");
    expect(document.querySelector(".loop-chip")!.textContent).toBe("20");
    expect(edge("back")).toBe("lit"); // came back round for another lap
    expect(edge("feed")).toBe("lit");
    // Only the way Python goes is coloured; the other way out fades.
    expect(labelTone("yes")).toBe("true");
    expect(labelTone("exit")).toBe("dim");
  });

  it("assign: the value travels into the loop variable; the item stays in the list", () => {
    render(<ForLoopView shape={shape} trace={{ at: "assign", index: 1 }} vars={{ number: py.int(20) }} />);
    expect(document.querySelector(".loop-chip")!.textContent).toBe("20");
    expect(node("target")).toBe("lit");
    expect(edge("yes")).toBe("lit");
    expect(stripValues()).toEqual(["10", "20", "30"]);
  });

  it("body: the item settles back in place and the body line glows", () => {
    render(<ForLoopView shape={shape} trace={{ at: "body", index: 1, bodyLine: 0 }} vars={{ number: py.int(20) }} />);
    expect(stripState(1)).toBe("active");
    expect(document.querySelector(".loop-chip")).toBeNull();
    expect(node("body-0")).toBe("lit");
    expect(document.querySelector(".loop-target")!.textContent).toContain("number = 20");
  });

  it("exit: every item is done, the answer is No and the way out glows", () => {
    render(<ForLoopView shape={shape} trace={{ at: "exit", index: 3 }} vars={{ number: py.int(30) }} />);
    expect([stripState(0), stripState(1), stripState(2)]).toEqual(["visited", "visited", "visited"]);
    expect(document.querySelector(".flow-decision-answer")!.textContent).toBe("✗ No");
    expect(node("decision")).toBe("false");
    expect(edge("exit")).toBe("lit");
    expect(node("after")).toBe("lit");
    expect(edge("yes")).toBe("dim");
    expect(labelTone("exit")).toBe("false");
    expect(labelTone("yes")).toBe("dim");
  });

  it("before the loop, neither way out looks like an answer", () => {
    render(<ForLoopView shape={shape} vars={{}} />);
    expect([labelTone("yes"), labelTone("exit")]).toEqual(["idle", "idle"]);
  });

  it("a generator's values stay unknown until produced", () => {
    const gen: ForLoopShape = { ...shape, kind: "generator", iterable: "countdown(2)", items: [2, 1] };
    render(<ForLoopView shape={gen} trace={{ at: "next", index: 0 }} vars={{}} />);
    expect(stripValues()).toEqual(["?", "?"]);
    expect(document.querySelector(".flow-decision-answer")).toBeNull();
    cleanup();
    render(<ForLoopView shape={gen} trace={{ at: "next", index: 2 }} vars={{ x: py.int(1) }} />);
    expect(screen.getByText(/asking the generator/i)).toBeTruthy();
    expect(document.querySelector(".flow-decision-answer")).toBeNull();
  });

  it("a long iterable shows five items, with … only where items are hidden", () => {
    const long: ForLoopShape = { ...shape, items: [1, 2, 3, 4, 5, 6, 7, 8] };
    render(<ForLoopView shape={long} trace={{ at: "body", index: 7, bodyLine: 0 }} vars={{ number: py.int(8) }} />);
    expect(stripValues()).toEqual(["4", "5", "6", "7", "8"]);
    expect([...document.querySelectorAll(".strip-more")].map((m) => m.hasAttribute("data-show"))).toEqual([true, false]);
  });
});

describe("shared references and mutation", () => {
  it("draws two names for one list as arrows into one object, and a copy as another", () => {
    const vars = { a: py.list([1, 2], "A"), b: py.list([1, 2], "A"), c: py.list([1, 2], "C") };
    render(<VariablesPanel vars={vars} />);
    expect(screen.getByText(/one object, 2 names/)).toBeTruthy();
    cleanup();
    render(<CollectionsView step={{ line: 1, vars }} />);
    expect(text(".object-tag")).toEqual(["the same list: 2 names, 1 object", "list"]);
    expect(document.querySelectorAll(".object")).toHaveLength(2);
    expect(document.querySelectorAll(".binding-link")).toHaveLength(3);
  });

  it("marks a change in place without a 'was' for the name", () => {
    render(<VariablesPanel vars={{ xs: py.list([1, 2, 3], "L") }} previous={{ xs: py.list([1, 2], "L") }} />);
    expect(document.querySelector(".binding")!.getAttribute("data-state")).toBe("mutated");
    const t = document.querySelector(".binding")!.textContent!;
    expect(t).toMatch(/changed in place/i);
    expect(t).not.toMatch(/was/);
  });

  it("pop: the item leaves first, then the returned value is shown separately", () => {
    const steps = demo("py-list-changes").steps;
    const leaving = steps.find((s) => s.mutation?.kind === "pop")!;
    render(<CollectionsView step={leaving} />);
    expect(document.querySelector('.object-chip[data-tone="removed"]')!.textContent).toContain('"d"');
    expect(document.querySelector('.object-chip[data-tone="returned"]')).toBeNull();
    cleanup();
    const stored = steps.find((s) => s.call?.name === "pop" && s.call.phase === "assign")!;
    render(<CollectionsView step={stored} />);
    expect(document.querySelector('.object-chip[data-tone="removed"]')).toBeNull();
    expect(document.querySelector('.object-chip[data-tone="returned"]')!.textContent).toContain('"d"');
  });

  it("slicing selects the start, leaves out the stop", () => {
    const step = demo("py-string-slices").steps.find((s) => s.slice)!;
    render(<CollectionsView step={step} strings={new Set(["word"])} />);
    expect([1, 2, 3, 4, 5].map(stripState)).toEqual(["selected", "selected", "selected", "idle", "idle"]);
    expect(text(".strip-note")).toEqual(["start", "stop"]);
    expect(screen.getByText(/\[1:4\]: start kept, stop left out/)).toBeTruthy();
  });

  it("negative indexes highlight the right item and show the counting from the end", () => {
    const step = demo("py-string-slices").steps.find((s) => s.element?.index === -1)!;
    render(<CollectionsView step={step} strings={new Set(["word"])} />);
    expect(stripState(5)).toBe("active");
    expect(text(".strip-index-neg")).toEqual(["-6", "-5", "-4", "-3", "-2", "-1"]);
  });

  it("dict lookups and updates glow on the key's row", () => {
    const steps = demo("py-dict-update").steps;
    render(<CollectionsView step={steps.find((s) => s.element?.key === "apples")!} />);
    expect(document.querySelector('.dict-row[data-state="active"] .dict-key')!.textContent).toBe('"apples"');
    cleanup();
    render(<CollectionsView step={steps.find((s) => s.mutation?.key === "pears")!} />);
    expect(document.querySelector('.dict-row[data-state="changed"]')!.textContent).toContain("was 0");
  });

  it("set membership shows the real result", () => {
    render(<CollectionsView step={demo("py-set-membership").steps.find((s) => s.membership)!} />);
    expect(document.querySelector('.object-chip[data-tone="true"]')!.textContent).toContain("4 in seen True");
    expect(document.querySelector('.set-item-svg[data-state="active"]')!.textContent).toBe("4");
  });
});

describe("expression tree", () => {
  const steps = demo("py-precedence").steps;
  it("works out 3 * 2 before the +, and hides the result until the end", () => {
    render(<CalculationView calc={steps[1]!.calc!} vars={{}} />);
    const lit = () => [...document.querySelectorAll('.expr-op-svg[data-look="lit"]')].map((e) => e.textContent);
    expect(lit()).toEqual(["* = 6"]);
    expect(document.querySelector(".calc-result")!.textContent).toContain("?");
    cleanup();
    render(<CalculationView calc={steps[2]!.calc!} vars={{}} />);
    expect(lit()).toEqual(["+ = 10"]);
    expect(document.querySelector(".calc-result")!.textContent).toContain("10");
  });
});

describe("nested calls and the call stack", () => {
  it("print(len(...)): len returns into print, then print receives it", () => {
    const steps = demo("py-nested-call").steps;
    render(<FunctionView call={steps[1]!.call!} />);
    expect(screen.getByText(/goes into/)).toBeTruthy();
    expect(screen.getByText("print()")).toBeTruthy();
    cleanup();
    render(<FunctionView call={steps[2]!.call!} />);
    expect(screen.getByText(/returned by len\(\)/)).toBeTruthy();
  });

  it("stacks frames, newest on top, each with its own variables", () => {
    const steps = demo("py-call-stack").steps;
    const inner = steps.findIndex((s) => s.frame === "add_one");
    render(<CallStackView step={steps[inner]!} previous={steps[inner - 1]} />);
    expect(text(".stack-title")).toEqual(["add_one()", "double()", "main program"]);
    expect(document.querySelector(".stack-card")!.getAttribute("data-look")).toBe("lit");
    expect(text(".stack-status")).toEqual(["new call, running", "waiting for add_one(n)", "waiting for double(4)", "no variables yet"]);
    expect(screen.getByText("returns 5")).toBeTruthy();
    cleanup();
    render(<CallStackView step={steps[inner + 1]!} previous={steps[inner]} />);
    expect(document.querySelector('.stack-card[data-look="ghost"]')!.textContent).toContain("finished");
    expect(document.querySelectorAll('.stack-card:not([data-look="ghost"])')).toHaveLength(2);
  });
});

describe("playback stays exact", () => {
  const next = () => fireEvent.click(screen.getByRole("button", { name: "Next step" }));
  const prev = () => fireEvent.click(screen.getByRole("button", { name: "Previous step" }));
  const picture = () => document.querySelector(".loop-for")!.outerHTML;

  it("Previous and Reset restore exactly the same for-loop picture", () => {
    render(<WalkthroughPlayer walkthrough={plain(demo("py-for-list"))} />);
    next();
    next();
    const atTwo = picture();
    next();
    next();
    next();
    prev();
    prev();
    prev();
    expect(picture()).toBe(atTwo);
    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(document.querySelectorAll('.loop-for [data-look="lit"]')).toHaveLength(0);
  });

  it("doesn't reveal a predicted step before the student answers", () => {
    render(<WalkthroughPlayer walkthrough={demo("py-precedence")} />);
    next(); // asks first
    expect(document.querySelector(".calc-result")!.textContent).toContain("?");
    expect(screen.queryByText(/= 6/)).toBeNull();
  });
});

describe("every Python visualization demo", () => {
  it("renders every step of every view without crashing", () => {
    for (const w of pythonVisuals) {
      for (const step of w.steps as TraceStep[]) {
        render(<WalkthroughPlayer walkthrough={{ ...plain(w), steps: [step] }} />);
        cleanup();
      }
    }
  });
});
