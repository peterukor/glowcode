import type { Lesson } from "@/courses/types";
import type { Walkthrough } from "@/types/trace";

const traceReady: Walkthrough = {
  id: "py-trace-ready",
  title: "Tracing three statements",
  language: "python",
  visualizations: ["function"],
  code: `print("Ready")
print(10 + 5)
print("Done")`,
  steps: [
    {
      line: 1,
      vars: {},
      output: ["Ready"],
      call: { name: "print", args: ['"Ready"'], prints: ["Ready"], phase: "result" },
      note: "Line 1 runs: print() shows Ready. That statement is finished, so the next one is line 2.",
    },
    {
      line: 2,
      vars: {},
      output: ["Ready"],
      evaluation: ["10 + 5", "15"],
      call: { name: "print", args: ["15"], prints: ["15"], phase: "call" },
      note: "Before print() can run, Python has to know what to give it. 10 + 5 is an expression, so Python works it out first: 15. Only the result, 15, goes into print().",
      checkpoint: {
        prompt: "`Ready` is on the screen and line 2, `print(10 + 5)`, is next. What will line 2 add to the output?",
        choices: [
          {
            id: "expression",
            text: "`10 + 5`",
            feedback: "That's what `print(\"10 + 5\")` would show, with quotes. Here there are no quotes, so is `10 + 5` text, or a sum for Python to work out?",
          },
          { id: "result", text: "`15`" },
          {
            id: "joined",
            text: "`Ready15` on one line",
            feedback: "Each `print()` call starts a new line of output, so line 2's output goes under `Ready`.",
          },
        ],
        answer: "result",
        explanation: "With no quotes, `10 + 5` is an expression. Python works out its value, `15`, before it calls `print()`, so `print()` is given `15` and never sees the `+`.",
      },
    },
    {
      line: 2,
      vars: {},
      output: ["Ready", "15"],
      call: { name: "print", args: ["15"], prints: ["15"], phase: "result" },
      note: "print() shows 15 on a new line under Ready. Line 2 is finished; line 3 is next.",
    },
    {
      line: 3,
      vars: {},
      output: ["Ready", "15", "Done"],
      call: { name: "print", args: ['"Done"'], prints: ["Done"], phase: "result" },
      note: "Line 3 prints Done. There are no more statements, so the program ends. The output is in exactly the order the statements ran.",
    },
  ],
};

/**
 * Chapter 1, lesson 5: tracing. A routine for following a program without guessing, and the
 * first expression (evaluated before print() receives it). Operators get their own chapter.
 */
export const readingCodeStepByStep: Lesson = {
  id: "reading-code-step-by-step",
  title: "Reading Code Step by Step",
  description: "Trace a program one statement at a time, and see Python work out a value before printing it.",
  status: "published",
  objectives: [
    "Follow a short program one statement at a time instead of guessing.",
    "Say which statement runs next and what it will add to the output.",
    "Explain that Python works out an expression's value before giving it to `print()`.",
    "Explain why a program's output appears in the order it does.",
  ],
  references: ["concept.expression", "concept.statement", "python.builtins.print", "python.types.int"],
  sections: [
    {
      id: "dont-guess",
      title: "Don't guess: trace",
      blocks: [
        {
          type: "text",
          text: "Glancing at a short program and guessing what it prints works, until it doesn't. A missed quote or a line in an unexpected place, and the guess is wrong. Programmers avoid this by **tracing**: following the program exactly the way Python would, one statement at a time.",
        },
        {
          type: "text",
          text: "Tracing is a routine you can use on any program, however long:",
        },
        {
          type: "list",
          ordered: true,
          items: [
            "**Find the next statement.** At the start, that's line 1.",
            "**Predict** what it does and what it adds to the output, before you look.",
            "**Check** your prediction against what really happens.",
            "**Continue** to the next statement, and repeat until there are none left.",
          ],
        },
      ],
    },
    {
      id: "trace-it",
      title: "Trace a program",
      blocks: [
        {
          type: "text",
          text: "Use the routine on this program. The walkthrough stops on line 2 and asks for your prediction before it shows you.",
        },
        {
          type: "code",
          language: "python",
          code: traceReady.code,
          caption: "Predict each line before you press Next.",
          walkthrough: traceReady,
        },
      ],
    },
    {
      id: "work-out-first",
      title: "Python works out the value first",
      blocks: [
        {
          type: "text",
          text: "`10 + 5` is an [expression](ref:concept.expression): a piece of code that Python can work out to get a single value. Working it out is called **evaluating** it. `10 + 5` evaluates to `15`.",
        },
        {
          type: "text",
          text: "When an expression sits inside `print()`'s parentheses, Python evaluates it **first** and then calls `print()` with the result. So `print()` receives the integer `15`. It never sees `10 + 5`.",
        },
        {
          type: "callout",
          tone: "execution",
          text: "Compare this with `print(\"10 + 5\")` from the last lesson. With quotes, `\"10 + 5\"` is a string, and the value of a string is just its characters, so `10 + 5` is printed as it is. The quotes change what Python does.",
        },
        {
          type: "text",
          text: "There's much more to expressions, such as other kinds of arithmetic and the order Python works them out in. That's a whole chapter later on. For now, the rule is: **work out the value, then use it**.",
        },
        {
          type: "question",
          id: "predict-second-line",
          variant: "predict",
          prompt: "Trace this program. What is the **second** line of output?",
          code: `print("Start")
print(2 + 3)
print("2 + 3")`,
          choices: [
            {
              id: "text",
              text: "The text `2 + 3`",
              feedback: "That's line 3's output. Line 2 has no quotes around `2 + 3`. What does Python do with an expression before printing it?",
            },
            { id: "five", text: "The number `5`" },
            {
              id: "start",
              text: "`Start`",
              feedback: "`Start` is the first line of output, from line 1. Which statement runs second?",
            },
          ],
          answer: "five",
          hint: "Line 1 gives the first line of output. Find the second statement, then check for quotes.",
          explanation:
            "Line 1 prints `Start`. Line 2 is an expression with no quotes, so Python evaluates `2 + 3` to `5` and prints `5`. Line 3 is a string, so it prints `2 + 3` exactly. The full output is `Start`, `5`, `2 + 3`.",
        },
        {
          type: "question",
          id: "predict-next-statement",
          variant: "predict",
          prompt: "Python has just finished running line 2 of this program. What happens next?",
          code: `print("One")
print("Two")
print(1 + 2)
print("Four")`,
          choices: [
            {
              id: "four",
              text: "Line 4 runs and prints `Four`",
              feedback: "Python never skips a statement in a program like this, even one that contains a calculation. Which line comes straight after line 2?",
            },
            { id: "three", text: "Line 3 runs: Python works out `1 + 2`, then prints `3`" },
            {
              id: "print-sum",
              text: "Line 3 runs and prints `1 + 2`",
              feedback: "Right line. But there are no quotes around `1 + 2`, so what does `print()` actually receive?",
            },
          ],
          answer: "three",
          explanation:
            "Statements run in order, so line 3 is next. It contains the expression `1 + 2`, which Python evaluates to `3` before calling `print()`. Then line 4 runs.",
        },
      ],
    },
    {
      id: "why-this-order",
      title: "Why the output is in this order",
      blocks: [
        {
          type: "reflect",
          id: "reflect-output-order",
          prompt: "In the walkthrough, `Ready` appeared before `15`, even though line 2 had a calculation to do. Explain why the output came out in the order `Ready`, `15`, `Done`.",
          answer:
            "Python runs one statement at a time, from the top, and finishes each before starting the next. Line 1 printed `Ready` and was done. Only then did line 2 start: Python evaluated `10 + 5` to `15` and printed it. Line 3 came last. The calculation happened inside line 2, so it couldn't change the order of the lines around it.",
        },
      ],
    },
    {
      id: "your-turn",
      title: "Your turn",
      blocks: [
        {
          type: "practice",
          id: "practice-receipt",
          context: "A shop's till prints a short receipt: a heading, the total, then a thank-you. The till should do the adding up, not the person writing the program.",
          prompt: "Write a program that prints `Total:`, then the result of `7 + 8` (let Python work it out), then `Thanks!`.",
          checklist: [
            "Use three `print()` statements.",
            "Put quotes around the two pieces of text.",
            "Write `7 + 8` without quotes, so Python evaluates it. Don't type the answer yourself.",
          ],
          hints: [
            "Line 2 of the walkthrough is the pattern you need.",
            "If your output shows `7 + 8` instead of a number, check for quotes around the expression.",
          ],
          solution: `print("Total:")
print(7 + 8)
print("Thanks!")`,
          solutionNote:
            "Trace it to check: line 1 prints `Total:`, line 2 evaluates `7 + 8` to `15` and prints it, line 3 prints `Thanks!`. Writing `print(15)` gives the same output, but then a person did the sum, not the program.",
        },
      ],
    },
    {
      id: "key-ideas",
      title: "Key ideas",
      blocks: [
        {
          type: "list",
          items: [
            "Tracing means following the program as Python does: find the next statement, predict, check, continue.",
            "An **expression** like `10 + 5` is code that works out to a value. Python **evaluates** it before calling `print()`.",
            "In quotes, `\"10 + 5\"` is a string and is printed as it is. Without quotes, it's an expression and its value is printed.",
            "Each statement finishes before the next starts, so the output is in the same order as the statements.",
          ],
        },
      ],
    },
  ],
};
