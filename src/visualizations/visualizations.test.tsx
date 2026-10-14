// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { WalkthroughPlayer } from "@/components/walkthrough/WalkthroughPlayer";
import { getExample } from "@/data/examples";
import type { CalcEvent, Walkthrough } from "@/types/trace";
import { py } from "@/walkthrough/build";
import { CalculationView } from "./CalculationView";
import { ConditionalFlow } from "./conditional/ConditionalFlow";
import { FunctionView } from "./FunctionView";
import { VariablesPanel } from "./VariableBox";
import { WhileLoopView } from "./WhileLoopView";

afterEach(cleanup);

const on = (selector: string) => [...document.querySelectorAll(`${selector}[data-on]`)].map((el) => el.textContent);
const calc = (phase: CalcEvent["phase"]): CalcEvent => ({
  target: "count",
  parts: [{ code: "count", value: "3" }, { code: "+" }, { code: "2" }],
  result: "5",
  phase,
});

describe("CalculationView", () => {
  it("reading: the value being read glows, and the result isn't shown yet", () => {
    render(<CalculationView calc={calc("read")} vars={{ count: py.int(3) }} />);
    expect(on(".calc-operand")).toEqual(["reading count3"]);
    expect(on(".calc-op")).toEqual([]);
    expect(document.querySelector(".calc-result")!.textContent).toBe("result?");
    expect(screen.getByText("still refers to")).toBeTruthy();
  });

  it("calculating: operands, operator and result glow; the name keeps its old value", () => {
    render(<CalculationView calc={calc("calculate")} vars={{ count: py.int(3) }} />);
    expect(on(".calc-operand")).toEqual(["count3", "2"]);
    expect(on(".calc-op")).toEqual(["+"]);
    expect(document.querySelector(".calc-result")!.textContent).toBe("result, not stored yet5");
    expect(document.querySelector(".calc-target")!.textContent).toContain("→ 3");
  });

  it("assigning: the result and the name glow, the operation doesn't", () => {
    render(<CalculationView calc={calc("assign")} vars={{ count: py.int(5) }} />);
    expect(on(".calc-op")).toEqual([]);
    expect(on(".calc-target")[0]).toContain("now refers to");
    expect(document.querySelector(".calc-target")!.textContent).toContain("→ 5");
  });
});

describe("VariablesPanel", () => {
  it("draws names that refer to values, and marks reading and changes in words", () => {
    render(<VariablesPanel vars={{ count: py.int(5), word: py.str("hi") }} previous={{ count: py.int(3), word: py.str("hi") }} reading={["word"]} />);
    const [count, word] = screen.getAllByRole("listitem");
    expect(count!.textContent).toContain("changed");
    expect(count!.textContent).toContain("was 3");
    expect(word!.textContent).toContain("reading");
    expect(screen.getByText(/count refers to 5, changed from 3/)).toBeTruthy();
  });

  it("doesn't mark anything when nothing changed", () => {
    render(<VariablesPanel vars={{ count: py.int(3) }} previous={{ count: py.int(3) }} />);
    expect(document.querySelector(".binding")!.getAttribute("data-state")).toBe("idle");
  });
});

describe("WhileLoopView", () => {
  const shape = { condition: "count <= 3", body: ["print(count)", "count += 1"] };

  it("shows the whole loop before it runs, with no results", () => {
    render(<WhileLoopView shape={shape} />);
    expect(screen.getByText("print(count)")).toBeTruthy();
    expect(screen.getByText("(the program ends)")).toBeTruthy();
    expect(document.querySelectorAll("[data-on]")).toHaveLength(0);
    expect(screen.queryByText(/True$|False$/)).toBeNull();
  });

  it("glows the condition and the True path while checking", () => {
    render(<WhileLoopView shape={shape} trace={{ checks: 2, at: "check", result: true }} />);
    expect(screen.getByText("check 2")).toBeTruthy();
    expect(screen.getByText(/✓ True/)).toBeTruthy();
    expect(on(".viz-edge")).toEqual(["↓ True: run the body"]);
  });

  it("leaves through the False path, with the body skipped", () => {
    render(<WhileLoopView shape={shape} trace={{ checks: 4, at: "exit", result: false }} />);
    expect(document.querySelector(".loop-exit")!.hasAttribute("data-on")).toBe(true);
    expect(document.querySelector(".loop-body")!.hasAttribute("data-skipped")).toBe(true);
    expect(on(".viz-edge")).toEqual(["↓ False: leave the loop"]);
  });
});

describe("ConditionalFlow", () => {
  const ifElse = getExample("if-else");
  const looks = () => Object.fromEntries([...document.querySelectorAll(".flow-block")].map((b) => [b.textContent, b.getAttribute("data-look")]));

  it("shows the whole decision before it's made, with nothing evaluated", () => {
    render(<ConditionalFlow chain={ifElse.ifChain!} trace={ifElse.steps[0]!.ifChain} />);
    expect(document.querySelector(".flow-condition")!.getAttribute("data-look")).toBe("idle");
    expect(looks()).toEqual({ 'print("Adult")': "idle", 'print("Minor")': "idle", "# done": "idle" });
  });

  it("lights the taken branch and dims the skipped one", () => {
    render(<ConditionalFlow chain={ifElse.ifChain!} trace={ifElse.steps.at(-1)!.ifChain} />);
    expect(document.querySelector(".flow-condition")!.getAttribute("data-look")).toBe("false");
    expect(looks()).toEqual({ 'print("Adult")': "dim", 'print("Minor")': "lit", "# done": "idle" });
  });
});

describe("FunctionView", () => {
  it("shows a mutating method: the original list, the change, and None", () => {
    const lists = getExample("lists");
    render(<FunctionView call={lists.steps.find((s) => s.call?.phase === "result")!.call!} />);
    expect(screen.getByText(/= \['apple', 'kiwi'\]/)).toBeTruthy();
    expect(screen.getByText("['apple', 'kiwi', 'mango']")).toBeTruthy();
    expect(screen.getByText("None")).toBeTruthy();
    expect(screen.queryByText("Prints")).toBeNull();
  });
});

describe("WalkthroughPlayer keeps code and diagram in sync", () => {
  const plain = (w: Walkthrough): Walkthrough => ({ ...w, steps: w.steps.map((s) => ({ ...s, checkpoint: undefined })) });
  const next = () => fireEvent.click(screen.getByRole("button", { name: "Next step" }));
  const prev = () => fireEvent.click(screen.getByRole("button", { name: "Previous step" }));
  const activeLine = () => document.querySelector(".bg-code-active")?.textContent?.trim().charAt(0);
  const diagram = () => document.querySelector(".loop-while")!.outerHTML;

  it("highlights the line and the diagram part of the same event", () => {
    render(<WalkthroughPlayer walkthrough={plain(getExample("while"))} />);
    next(); // line 3, first check
    expect(screen.getByText(/Running line 3/)).toBeTruthy();
    expect(document.querySelector(".loop-condition")!.hasAttribute("data-on")).toBe(true);
    next(); // line 4, the body
    expect(screen.getByText(/Running line 4/)).toBeTruthy();
    expect(document.querySelector(".loop-body")!.hasAttribute("data-on")).toBe(true);
    expect(activeLine()).toBe("4");
  });

  it("restores exactly the same picture when stepping back", () => {
    render(<WalkthroughPlayer walkthrough={plain(getExample("while"))} />);
    next();
    next();
    const atTwo = diagram();
    next();
    next();
    next();
    prev();
    prev();
    prev();
    expect(diagram()).toBe(atTwo);
  });

  it("shows printed output only from the event that prints it", () => {
    render(<WalkthroughPlayer walkthrough={plain(getExample("while"))} />);
    next(); // check 1
    expect(screen.getByText("No output yet…")).toBeTruthy();
    next(); // print(count)
    expect(screen.queryByText("No output yet…")).toBeNull();
    prev();
    expect(screen.getByText("No output yet…")).toBeTruthy();
  });

  it("Reset returns to the first event", () => {
    render(<WalkthroughPlayer walkthrough={plain(getExample("reassign"))} />);
    next();
    next();
    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(screen.getByText("count now refers to 3.")).toBeTruthy();
    expect(screen.queryByRole("group", { name: /Assignment/ })).toBeNull();
  });
});
