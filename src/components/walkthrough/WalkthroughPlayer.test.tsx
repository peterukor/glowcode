// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Walkthrough } from "@/types/trace";
import { FunctionView } from "@/visualizations/FunctionView";
import { WalkthroughPlayer } from "./WalkthroughPlayer";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const button = (name: string | RegExp) => screen.getByRole("button", { name }) as HTMLButtonElement;
const next = () => button("Next step");
const int = (value: number) => ({ type: "int" as const, value });
const calc = (phase: "calculate" | "assign") => ({
  target: "count",
  parts: [{ code: "count", value: "3" }, { code: "+" }, { code: "2" }],
  result: "5",
  phase,
});

const walkthrough: Walkthrough = {
  id: "py-test-count",
  title: "Count",
  language: "python",
  visualizations: ["variables"],
  code: "count = 3\ncount = count + 2\nprint(count)",
  steps: [
    { line: 1, vars: { count: int(3) }, note: "N1: count refers to 3." },
    {
      line: 2,
      vars: { count: int(3) },
      calc: calc("calculate"),
      note: "N2: work out 3 + 2.",
      checkpoint: {
        prompt: "What will count refer to after line 2?",
        choices: [
          { id: "5", text: "`5`" },
          { id: "3", text: "`3`", feedback: "3 is the value right now." },
        ],
        answer: "5",
        explanation: "3 + 2 is 5.",
      },
    },
    { line: 2, vars: { count: int(5) }, calc: calc("assign"), note: "N3: count refers to 5." },
    { line: 3, vars: { count: int(5) }, output: ["5"], note: "N4: printed 5." },
  ],
};

const varValues = () => [...document.querySelectorAll(".var-box")].map((el) => el.textContent);

describe("predictions inside a walkthrough", () => {
  it("pauses before the step and doesn't show what happens next", () => {
    render(<WalkthroughPlayer walkthrough={walkthrough} />);
    expect(screen.getByText("N1: count refers to 3.")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "What will count refer to after line 2?" })).toBeTruthy();
    expect(next().disabled).toBe(true);

    // Nothing from the next step leaks: no calculation, no new value, no next note.
    expect(screen.queryByText("N2: work out 3 + 2.")).toBeNull();
    expect(screen.queryByRole("group", { name: /Assignment/ })).toBeNull();
    expect(varValues()).toEqual(["countint3"]);
  });

  it("gives feedback on a wrong prediction and keeps the step hidden", () => {
    render(<WalkthroughPlayer walkthrough={walkthrough} />);
    expect(button("Check prediction").disabled).toBe(true);
    fireEvent.click(screen.getByRole("radio", { name: "3" }));
    fireEvent.click(button("Check prediction"));

    expect(screen.getByText("3 is the value right now.")).toBeTruthy();
    expect(screen.queryByText("3 + 2 is 5.")).toBeNull();
    expect(screen.queryByText("N2: work out 3 + 2.")).toBeNull();
    expect(next().disabled).toBe(true);

    fireEvent.click(button(/Try again/));
    expect((screen.getByRole("radio", { name: /3/ }) as HTMLInputElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole("radio", { name: "5" }));
    fireEvent.click(button("Check prediction"));
    expect(screen.getByText(/That's right/)).toBeTruthy();

    fireEvent.click(button("Reveal next step"));
    expect(screen.getByText("N2: work out 3 + 2.")).toBeTruthy();
    expect(screen.getByText("You got there after another try.")).toBeTruthy();
    expect(screen.getByText("3 + 2 is 5.")).toBeTruthy();
  });

  it("can be skipped deliberately, so nobody gets stuck", () => {
    render(<WalkthroughPlayer walkthrough={walkthrough} />);
    fireEvent.click(button("Skip and reveal the next step"));
    expect(screen.getByText("N2: work out 3 + 2.")).toBeTruthy();
    expect(screen.getByText("You skipped the prediction.")).toBeTruthy();
    expect(next().disabled).toBe(false);
  });

  it("remembers the answer when stepping back and forth, and Reset starts over", () => {
    render(<WalkthroughPlayer walkthrough={walkthrough} />);
    fireEvent.click(screen.getByRole("radio", { name: "5" }));
    fireEvent.click(button("Check prediction"));
    fireEvent.click(button("Reveal next step"));

    fireEvent.click(button("Previous step"));
    expect(screen.getByText("N1: count refers to 3.")).toBeTruthy();
    expect(screen.queryByRole("heading", { name: /What will count refer to/ })).toBeNull();
    expect(next().disabled).toBe(false);

    fireEvent.click(next());
    expect(screen.getByText("You predicted this correctly.")).toBeTruthy();

    fireEvent.click(button("Reset"));
    expect(screen.getByText("N1: count refers to 3.")).toBeTruthy();
    expect(screen.getByRole("heading", { name: /What will count refer to/ })).toBeTruthy();
    expect((screen.getByRole("radio", { name: "3" }) as HTMLInputElement).disabled).toBe(false);
  });

  it("moves keyboard focus to the question instead of skipping it", () => {
    render(<WalkthroughPlayer walkthrough={walkthrough} />);
    fireEvent.keyDown(screen.getByText("N1: count refers to 3."), { key: "ArrowRight" });
    expect(document.activeElement).toBe(screen.getByRole("heading", { name: /What will count refer to/ }));
    expect(screen.queryByText("N2: work out 3 + 2.")).toBeNull();
  });

  it("stops autoplay at a prediction", () => {
    vi.useFakeTimers();
    render(<WalkthroughPlayer walkthrough={{ ...walkthrough, steps: [walkthrough.steps[0]!, ...walkthrough.steps] }} />);
    fireEvent.click(button(/Play/));
    act(() => vi.advanceTimersByTime(10_000));
    expect(screen.getAllByText("N1: count refers to 3.").length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: /What will count refer to/ })).toBeTruthy();
    expect(screen.queryByText("N2: work out 3 + 2.")).toBeNull();
  });
});

describe("execution events", () => {
  it("shows calculation and assignment as two events on the same line", () => {
    render(<WalkthroughPlayer walkthrough={{ ...walkthrough, steps: walkthrough.steps.map((s) => ({ ...s, checkpoint: undefined })) }} />);
    fireEvent.click(next());
    expect(screen.getByText("First: work out the right side")).toBeTruthy();
    expect(screen.getByText("result, not stored yet")).toBeTruthy();
    expect(varValues()).toEqual(["countint3"]); // the old value, until the assignment

    fireEvent.click(next());
    expect(screen.getByText("Then: store the result")).toBeTruthy();
    expect(screen.getByText(/same line, next step/)).toBeTruthy();
    expect(varValues()).toEqual(["countint5"]);
  });

  it("marks lines that run again inside a loop", () => {
    const loop: Walkthrough = {
      id: "py-test-loop",
      title: "Loop",
      language: "python",
      visualizations: ["loop"],
      loopItems: [1, 2],
      code: "for n in [1, 2]:\n    print(n)",
      steps: [
        { line: 1, vars: { n: int(1) }, loopIndex: 0, note: "Lap 1." },
        { line: 2, vars: { n: int(1) }, loopIndex: 0, output: ["1"], note: "Print 1." },
        { line: 1, vars: { n: int(2) }, loopIndex: 1, output: ["1"], note: "Lap 2." },
        { line: 2, vars: { n: int(2) }, loopIndex: 1, output: ["1", "2"], note: "Print 2." },
        { line: 1, vars: { n: int(2) }, loopIndex: 2, output: ["1", "2"], note: "No items left." },
      ],
    };
    render(<WalkthroughPlayer walkthrough={loop} />);
    fireEvent.click(next());
    fireEvent.click(next());
    expect(screen.getByText(/running again/)).toBeTruthy();
    expect(screen.getByText("Lap 2 of 2, using 2.")).toBeTruthy();
    fireEvent.click(next());
    fireEvent.click(next());
    expect(screen.getByText(/running again \(3rd time\)/)).toBeTruthy();
    expect(screen.getByText("No items left: loop ends")).toBeTruthy();
  });
});

describe("FunctionView", () => {
  const len = { name: "len", args: ['"cat"'], returns: "3", assignTo: "length" };

  it("keeps the returned value hidden until the call has produced it", () => {
    render(<FunctionView call={{ ...len, phase: "call" }} />);
    expect(screen.getByText('"cat"')).toBeTruthy();
    expect(screen.queryByText("3")).toBeNull();
    expect(screen.getByText("?")).toBeTruthy();
  });

  it("shows a returned value without any printed output", () => {
    render(<FunctionView call={{ ...len, phase: "result" }} />);
    expect(screen.getByText("Returns")).toBeTruthy();
    expect(screen.getByText("3")).toBeTruthy();
    expect(screen.queryByText("Prints")).toBeNull();
  });

  it("keeps printing, returning and changing an object in separate slots", () => {
    render(<FunctionView call={{ name: "print", args: ['"Hello"'], prints: ["Hello"], returns: "None", phase: "result" }} />);
    expect(screen.getByText("Prints")).toBeTruthy();
    expect(screen.getByText("Hello")).toBeTruthy();
    expect(screen.getByText("None")).toBeTruthy();
    cleanup();

    render(<FunctionView call={{ name: "append", receiver: "items", args: ['"apple"'], changes: '["apple"]', returns: "None", phase: "result" }} />);
    expect(screen.getByText("items.append()")).toBeTruthy();
    expect(screen.getByText("Changes")).toBeTruthy();
    expect(screen.getByText('["apple"]')).toBeTruthy();
  });

  it("shows where a returned value is stored", () => {
    render(<FunctionView call={{ ...len, phase: "assign" }} />);
    expect(screen.getByText("now refers to the returned value")).toBeTruthy();
  });
});
