// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getCourse } from "@/courses/registry";
import { publishedLessons } from "@/courses/queries";
import type { CodeBlock, Lesson, PracticeBlock, QuestionBlock, ReflectBlock } from "@/courses/types";
import { ReferenceLink } from "@/references/ReferenceLink";
import type { Walkthrough } from "@/types/trace";
import { CodeExample } from "./CodeExample";
import { LessonBody } from "./LessonBody";
import { PracticeActivity } from "./PracticeActivity";
import { QuestionActivity } from "./QuestionActivity";
import { ReflectActivity } from "./ReflectActivity";

afterEach(cleanup);

const button = (name: string | RegExp) => screen.getByRole("button", { name }) as HTMLButtonElement;
const noButton = (name: string | RegExp) => expect(screen.queryByRole("button", { name })).toBeNull();
const shown = (text: string) => expect(screen.getAllByText(text).length).toBeGreaterThan(0);

const fixtureLesson: Lesson = {
  id: "fixture",
  title: "Fixture",
  description: "",
  status: "published",
  objectives: [],
  sections: [
    {
      id: "intro",
      title: "Every block",
      blocks: [
        { type: "text", text: "A **variable** is a [name](ref:concept.variable) like `age`." },
        { type: "list", ordered: true, items: ["Right side first.", "Then the name."] },
        { type: "callout", tone: "execution", text: "Python works out the right side first." },
        { type: "callout", tone: "careful", title: "age or \"age\"?", text: "Quotes make text." },
        {
          type: "figure",
          caption: "A name refers to a value.",
          figure: { kind: "names", bindings: [{ name: "age", value: { type: "int", value: 14 }, previous: { type: "int", value: 13 } }] },
        },
        { type: "figure", caption: "Python reads from the top.", figure: { kind: "sequence", steps: ["Read line 1", "Run it"] } },
        { type: "code", language: "python", code: "age = 13\nprint(age)", output: ["13"], highlightLines: [2], caption: "Line 2 prints." },
      ],
    },
  ],
};

describe("LessonBody", () => {
  it("renders every kind of content block", () => {
    render(<LessonBody lesson={fixtureLesson} handlers={{ onActivity: () => {} }} />);

    expect(screen.getByRole("heading", { level: 2, name: "Every block" })).toBeTruthy();
    expect(screen.getByText("variable").tagName).toBe("STRONG");
    expect(screen.getByText("age", { selector: "code" })).toBeTruthy();
    expect(screen.getAllByRole("listitem").map((li) => li.textContent)).toContain("Right side first.");

    // Untitled callouts are labelled by their tone; titled ones by their title.
    expect(screen.getByRole("complementary", { name: "How Python runs this" })).toBeTruthy();
    expect(screen.getByRole("complementary", { name: 'age or "age"?' })).toBeTruthy();

    // Figures describe themselves to screen readers and keep their caption.
    expect(screen.getByText(/age refers to 14; it used to refer to 13/)).toBeTruthy();
    expect(screen.getByText("A name refers to a value.")).toBeTruthy();
    expect(screen.getByText("Read line 1")).toBeTruthy();

    // Code: language label, marked line, printed output and caption.
    expect(screen.getByText("Python")).toBeTruthy();
    expect(screen.getByText("(highlighted)")).toBeTruthy();
    const output = screen.getByRole("group", { name: "Printed output" });
    expect(within(output).getByText("13")).toBeTruthy();
    expect(screen.getByText("Line 2 prints.")).toBeTruthy();
  });

  it("renders every published lesson without errors", () => {
    for (const { lesson } of publishedLessons(getCourse("python-fundamentals")!)) {
      const { unmount } = render(<LessonBody lesson={lesson} handlers={{ onActivity: () => {} }} />);
      for (const section of lesson.sections) {
        expect(screen.getByRole("heading", { level: 2, name: section.title })).toBeTruthy();
      }
      unmount();
    }
  });
});

describe("ReferenceLink", () => {
  it("shows a short definition and toggles it on click", () => {
    render(<ReferenceLink id="python.builtins.print" label="print()" code />);
    const term = button("print()");
    expect(screen.getByRole("tooltip").textContent).toMatch(/Shows values as text/);
    expect(term.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(term);
    expect(term.getAttribute("aria-expanded")).toBe("true");
    fireEvent.keyDown(term, { key: "Escape" });
    expect(term.getAttribute("aria-expanded")).toBe("false");
  });

  it("falls back to plain text for an unknown id", () => {
    render(<ReferenceLink id="python.nope" label="nope" />);
    expect(screen.getByText("nope")).toBeTruthy();
    noButton("nope");
  });
});

const question: QuestionBlock = {
  type: "question",
  id: "predict-score",
  variant: "predict",
  prompt: "What does this print?",
  code: "score = 10\nscore = score + 5\nprint(score)",
  choices: [
    { id: "10", text: "`10`", feedback: "That was the value before line 2." },
    { id: "15", text: "`15`" },
    { id: "error", text: "An error" },
  ],
  answer: "15",
  hint: "Right side first.",
  explanation: "10 + 5 is 15.",
};

describe("QuestionActivity", () => {
  it("asks for an answer before revealing anything", () => {
    render(<QuestionActivity block={question} onAttempt={() => {}} />);
    expect(button("Check answer").disabled).toBe(true);
    noButton("Show the answer");
    expect(screen.queryByText("10 + 5 is 15.")).toBeNull();
  });

  it("gives feedback on a wrong answer, then lets the student try again", () => {
    const onAttempt = vi.fn();
    render(<QuestionActivity block={question} onAttempt={onAttempt} />);

    fireEvent.click(screen.getByRole("radio", { name: "10" }));
    fireEvent.click(button("Check answer"));

    expect(onAttempt).toHaveBeenCalledWith("predict-score");
    expect(screen.getByText("That was the value before line 2.")).toBeTruthy();
    expect(screen.queryByText("10 + 5 is 15.")).toBeNull(); // the answer isn't given away

    fireEvent.click(button(/Try again/));
    const ruledOut = screen.getByRole("radio", { name: /10/ }) as HTMLInputElement;
    expect(ruledOut.disabled).toBe(true);

    fireEvent.click(screen.getByRole("radio", { name: "15" }));
    fireEvent.click(button("Check answer"));
    expect(screen.getByText("Yes, that's it!")).toBeTruthy();
    expect(screen.getByText("10 + 5 is 15.")).toBeTruthy();
  });

  it("uses general feedback for a wrong choice without its own", () => {
    render(<QuestionActivity block={question} onAttempt={() => {}} />);
    fireEvent.click(screen.getByRole("radio", { name: "An error" }));
    fireEvent.click(button("Check answer"));
    expect(screen.getByText(/Go back through the code one line at a time/)).toBeTruthy();
  });

  it("can reveal the answer after a wrong try, and offers a hint", () => {
    render(<QuestionActivity block={question} onAttempt={() => {}} />);
    fireEvent.click(button(/Hint/));
    expect(screen.getByText("Right side first.")).toBeTruthy();

    fireEvent.click(screen.getByRole("radio", { name: "An error" }));
    fireEvent.click(button("Check answer"));
    fireEvent.click(button("Show the answer"));
    expect(screen.getByText("Here's the answer.")).toBeTruthy();
    expect(screen.getByText("10 + 5 is 15.")).toBeTruthy();
  });

  it("shows the error Python printed for debug questions, and no hint button without a hint", () => {
    render(
      <QuestionActivity
        block={{ ...question, variant: "debug", hint: undefined, errorOutput: "NameError: name 'Age' is not defined" }}
        onAttempt={() => {}}
      />,
    );
    expect(screen.getByText("Find the bug")).toBeTruthy();
    expect(within(screen.getByRole("group", { name: "What Python printed" })).getByText(/NameError/)).toBeTruthy();
    noButton(/Hint/);
  });
});

const practice: PracticeBlock = {
  type: "practice",
  id: "practice-level",
  context: "A game remembers a level.",
  prompt: "Increase `level` by 1.",
  checklist: ["Uses the old value."],
  hints: ["First hint.", "Second hint."],
  solution: "level = 1\nlevel = level + 1",
  solutionNote: "It uses the old value.",
  alternatives: [{ note: "You could write 2 directly." }],
};

describe("PracticeActivity", () => {
  it("never claims to check the student's code", () => {
    render(<PracticeActivity block={practice} onAttempt={() => {}} />);
    expect(screen.getByText("A game remembers a level.")).toBeTruthy();
    expect(screen.getByText("Uses the old value.")).toBeTruthy();
    expect(screen.getByText(/doesn't run or check your code/)).toBeTruthy();
  });

  it("reveals hints one at a time", () => {
    const onAttempt = vi.fn();
    render(<PracticeActivity block={practice} onAttempt={onAttempt} />);
    fireEvent.click(button(/Show a hint/));
    expect(screen.getByText("First hint.")).toBeTruthy();
    expect(screen.queryByText("Second hint.")).toBeNull();
    fireEvent.click(button(/Show another hint/));
    expect(screen.getByText("Second hint.")).toBeTruthy();
    noButton(/Show another hint/);
    expect(onAttempt).toHaveBeenCalledWith("practice-level");
  });

  it("asks the student to try before showing the solution", () => {
    render(<PracticeActivity block={practice} onAttempt={() => {}} />);
    fireEvent.click(button("Show a sample solution"));
    expect(screen.getByText("Have you given it a real try?")).toBeTruthy();
    expect(screen.queryByText("Why this works")).toBeNull();

    fireEvent.click(button("I'll keep trying"));
    expect(screen.queryByText("Have you given it a real try?")).toBeNull();

    fireEvent.click(button("Show a sample solution"));
    fireEvent.click(button("Show the sample solution"));
    expect(screen.getByText("Why this works")).toBeTruthy();
    expect(screen.getByText("It uses the old value.")).toBeTruthy();
    expect(screen.getByText("You could write 2 directly.")).toBeTruthy();
  });

  it("leaves out optional parts that aren't provided", () => {
    render(<PracticeActivity block={{ type: "practice", id: "p", prompt: "Print hi.", solution: 'print("hi")' }} onAttempt={() => {}} />);
    noButton(/hint/i);
    expect(screen.queryByText("Your solution should:")).toBeNull();
  });
});

describe("ReflectActivity", () => {
  const reflect: ReflectBlock = { type: "reflect", id: "reflect-order", prompt: "Why?", answer: "Python runs from the top." };

  it("keeps the explanation hidden until the student asks for it", () => {
    const onAttempt = vi.fn();
    render(<ReflectActivity block={reflect} onAttempt={onAttempt} />);
    const answer = screen.getByText("Python runs from the top.").closest("div")!;
    expect(answer.hidden).toBe(true);

    fireEvent.click(button("Compare with an explanation"));
    expect(answer.hidden).toBe(false);
    expect(onAttempt).toHaveBeenCalledTimes(1);

    fireEvent.click(button("Hide the explanation"));
    fireEvent.click(button("Compare with an explanation"));
    expect(onAttempt).toHaveBeenCalledTimes(1);
  });
});

describe("CodeExample", () => {
  const code = "age = 13\nprint(age)";
  const walkthrough: Walkthrough = {
    id: "py-test",
    title: "Creating a variable",
    language: "python",
    visualizations: ["variables"],
    code,
    steps: [
      { line: 1, vars: { age: { type: "int", value: 13 } }, note: "age refers to 13." },
      { line: 2, vars: { age: { type: "int", value: 13 } }, output: ["13"], note: "Print it." },
    ],
  };
  const block: CodeBlock = { type: "code", language: "python", code, output: ["13"] };

  it("shows no walkthrough button when there is no walkthrough", () => {
    render(<CodeExample block={block} onActivity={() => {}} />);
    noButton(/Walk through code/);
  });

  it("opens the walkthrough in place and returns to the snippet on close", () => {
    const onActivity = vi.fn();
    render(<CodeExample block={{ ...block, walkthrough }} onActivity={onActivity} />);

    fireEvent.click(button(/Walk through code/));
    expect(onActivity).toHaveBeenCalledWith("walkthrough-py-test");
    const heading = screen.getByRole("heading", { name: "Creating a variable" });
    expect(document.activeElement).toBe(heading);
    shown("age refers to 13.");

    fireEvent.click(button("Next step"));
    shown("Print it.");
    fireEvent.click(button("Previous step"));
    shown("age refers to 13.");

    fireEvent.click(button(/Close/));
    expect(screen.queryByRole("heading", { name: "Creating a variable" })).toBeNull();
    expect(document.activeElement).toBe(button(/Walk through code/));
  });
});
