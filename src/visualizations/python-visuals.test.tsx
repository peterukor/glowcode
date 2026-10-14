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
const stateOf = (i: number) => cells()[i]!.getAttribute("data-state");
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

describe("ForLoopView", () => {
  const shape: ForLoopShape = { target: "number", iterable: "[10, 20, 30]", kind: "list", items: [10, 20, 30], body: ["print(number)"], after: 'print("done")' };
  const on = (sel: string) => document.querySelector(sel)!.hasAttribute("data-on");

  it("before the loop: nothing glows and nothing is answered", () => {
    render(<ForLoopView shape={shape} vars={{}} />);
    expect(document.querySelectorAll("[data-on]")).toHaveLength(0);
    expect(screen.queryByText(/Yes$|No$/)).toBeNull();
  });

  it("next: the current item rises and the question is answered Yes", () => {
    render(<ForLoopView shape={shape} trace={{ at: "next", index: 1 }} vars={{ number: py.int(10) }} />);
    expect([stateOf(0), stateOf(1), stateOf(2)]).toEqual(["visited", "raised", "idle"]);
    expect(screen.getByText(/✓ Yes/)).toBeTruthy();
    expect(on(".viz-edge-back")).toBe(true); // came back round for another lap
  });

  it("assign: the value travels to the loop variable; the item stays in the list", () => {
    render(<ForLoopView shape={shape} trace={{ at: "assign", index: 1 }} vars={{ number: py.int(20) }} />);
    expect(document.querySelector(".for-transfer-chip")!.textContent).toContain("20");
    expect(on(".for-target")).toBe(true);
    expect(visibleValues()).toEqual(["10", "20", "30"]);
  });

  it("body: the item settles back in place and the body line glows", () => {
    render(<ForLoopView shape={shape} trace={{ at: "body", index: 1, bodyLine: 0 }} vars={{ number: py.int(20) }} />);
    expect(stateOf(1)).toBe("active");
    expect(document.querySelector(".for-transfer-chip")).toBeNull();
    expect(on(".viz-op")).toBe(true);
  });

  it("exit: every item is done, the answer is No and the exit glows", () => {
    render(<ForLoopView shape={shape} trace={{ at: "exit", index: 3 }} vars={{ number: py.int(30) }} />);
    expect([stateOf(0), stateOf(1), stateOf(2)]).toEqual(["visited", "visited", "visited"]);
    expect(screen.getByText(/✗ No/)).toBeTruthy();
    expect(on(".loop-exit")).toBe(true);
  });

  it("a generator's values stay unknown until produced", () => {
    const gen: ForLoopShape = { ...shape, kind: "generator", iterable: "countdown(2)", items: [2, 1] };
    render(<ForLoopView shape={gen} trace={{ at: "next", index: 0 }} vars={{}} />);
    expect(visibleValues()).toEqual(["?", "?"]);
    cleanup();
    render(<ForLoopView shape={gen} trace={{ at: "next", index: 2 }} vars={{ x: py.int(1) }} />);
    expect(screen.getByText(/asking the generator/i)).toBeTruthy();
    expect(screen.queryByText(/✓ Yes/)).toBeNull();
  });
});

describe("shared references and mutation", () => {
  it("draws two names for one list as one object, and a copy as another", () => {
    const vars = { a: py.list([1, 2], "A"), b: py.list([1, 2], "A"), c: py.list([1, 2], "C") };
    render(<VariablesPanel vars={vars} />);
    expect(screen.getByText(/one object, 2 names/)).toBeTruthy();
    cleanup();
    render(<CollectionsView step={{ line: 1, vars }} />);
    expect(screen.getByText(/the same list \(2 names, 1 object\)/)).toBeTruthy();
    expect(document.querySelectorAll(".seq")).toHaveLength(2);
  });

  it("marks a change in place without a 'was' for the name", () => {
    render(<VariablesPanel vars={{ xs: py.list([1, 2, 3], "L") }} previous={{ xs: py.list([1, 2], "L") }} />);
    expect(document.querySelector(".binding")!.getAttribute("data-state")).toBe("mutated");
    const text = document.querySelector(".binding")!.textContent!;
    expect(text).toMatch(/changed in place/i);
    expect(text).not.toMatch(/was/);
  });

  it("pop: the item leaves first, then the returned value is shown separately", () => {
    const steps = demo("py-list-changes").steps;
    const leaving = steps.find((s) => s.mutation?.kind === "pop")!;
    render(<CollectionsView step={leaving} />);
    expect(document.querySelector(".removed-chip")!.textContent).toContain('"d"');
    expect(document.querySelector(".returned-chip")).toBeNull();
    cleanup();
    const stored = steps.find((s) => s.call?.name === "pop" && s.call.phase === "assign")!;
    render(<CollectionsView step={stored} />);
    expect(document.querySelector(".removed-chip")).toBeNull();
    expect(document.querySelector(".returned-chip")!.textContent).toContain('"d"');
  });

  it("slicing selects the start, leaves out the stop", () => {
    const step = demo("py-string-slices").steps.find((s) => s.slice)!;
    render(<CollectionsView step={step} />);
    expect([0, 1, 2, 3, 4].map(stateOf)).toEqual(["idle", "selected", "selected", "selected", "idle"]);
    expect(screen.getByText("start")).toBeTruthy();
    expect(screen.getByText("stop")).toBeTruthy();
    expect(screen.getByText(/from index 1 \(start: included\) up to index 4 \(stop: left out\)/)).toBeTruthy();
  });

  it("negative indexes highlight the right item", () => {
    const step = demo("py-string-slices").steps.find((s) => s.element?.index === -1)!;
    render(<CollectionsView step={step} />);
    expect(stateOf(5)).toBe("active");
  });

  it("dict lookups and updates glow on the key's row", () => {
    const steps = demo("py-dict-update").steps;
    render(<CollectionsView step={steps.find((s) => s.element?.key === "apples")!} />);
    expect(document.querySelector("tr[data-state=active] th")!.textContent).toBe('"apples"');
    cleanup();
    render(<CollectionsView step={steps.find((s) => s.mutation?.key === "pears")!} />);
    expect(document.querySelector("tr[data-state=changed]")!.textContent).toContain("was 0");
  });

  it("set membership shows the real result", () => {
    render(<CollectionsView step={demo("py-set-membership").steps.find((s) => s.membership)!} />);
    expect(screen.getByText("✓ True")).toBeTruthy();
    expect(screen.getByText(/no guaranteed order/)).toBeTruthy();
  });
});

describe("expression tree", () => {
  const steps = demo("py-precedence").steps;
  it("works out 3 * 2 before the +, and hides the result until the end", () => {
    render(<CalculationView calc={steps[1]!.calc!} vars={{}} />);
    expect(document.querySelectorAll(".expr-op[data-on]")).toHaveLength(1);
    expect(document.querySelector(".expr-op[data-on]")!.textContent).toContain("*");
    expect(document.querySelector(".calc-result")!.textContent).toContain("?");
    cleanup();
    render(<CalculationView calc={steps[2]!.calc!} vars={{}} />);
    expect(document.querySelector(".expr-op[data-on]")!.textContent).toContain("+");
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
    const frames = [...document.querySelectorAll(".stack-frame")];
    expect(frames.map((f) => f.querySelector(".font-mono")!.textContent)).toEqual(["add_one()", "double()", "main program"]);
    expect(frames[0]!.hasAttribute("data-on")).toBe(true);
    expect(screen.getByText(/waiting for add_one\(n\)/)).toBeTruthy();
    expect(screen.getByText("new call, running")).toBeTruthy();
    cleanup();
    render(<CallStackView step={steps[inner + 1]!} previous={steps[inner]} />);
    expect(screen.getByText(/add_one\(\) finished/)).toBeTruthy();
    expect(document.querySelectorAll(".stack-frame")).toHaveLength(2);
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
    expect(document.querySelectorAll(".loop-for [data-on]")).toHaveLength(0);
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
