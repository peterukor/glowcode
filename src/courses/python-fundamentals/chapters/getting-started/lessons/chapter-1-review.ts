import type { Lesson } from "@/courses/types";

/**
 * Chapter 1, lesson 6: review. No new ideas and no walkthrough; every activity asks the
 * student to use what they learned on a program they haven't seen.
 *
 * "Arrange the instructions" uses a multiple-choice question over possible orders, because
 * there's no drag-and-drop activity yet (see LESSON_AUTHORING.md, "Future activity types").
 */
export const chapterOneReview: Lesson = {
  id: "chapter-1-review",
  title: "Chapter Review & Practice",
  description: "Predict, trace, explain and debug short programs using everything from this chapter.",
  status: "published",
  objectives: [
    "Predict the output of a short program by tracing it.",
    "Tell which statement runs next, and what code prints compared with what it is.",
    "Find and fix a misspelled name and a syntax error from their error messages.",
    "Write a short program that prints text and a calculated number in the right order.",
  ],
  references: ["concept.program", "concept.statement", "concept.expression", "python.builtins.print", "python.errors.NameError", "python.errors.SyntaxError"],
  sections: [
    {
      id: "how-to-use",
      title: "Before you start",
      blocks: [
        {
          type: "text",
          text: "Each activity uses a program you haven't seen. Trace it rather than guessing: find the next statement, predict, check, continue. If an answer surprises you, the feedback explains the idea behind it, and you can try again.",
        },
      ],
    },
    {
      id: "predict-and-trace",
      title: "Predict and trace",
      blocks: [
        {
          type: "question",
          id: "review-last-line",
          variant: "predict",
          prompt: "What is the **last** line this program prints?",
          code: `print("Score")
print(4 + 6)
print("4 + 6")
print(10)`,
          choices: [
            {
              id: "sum-text",
              text: "The text `4 + 6`",
              feedback: "That's line 3's output. Is line 3 the last statement in the program?",
            },
            { id: "ten", text: "The number `10`" },
            {
              id: "score",
              text: "`Score`",
              feedback: "Python runs from the top, so the first statement's output is printed first, not last.",
            },
          ],
          answer: "ten",
          hint: "The last line of output comes from the last statement that runs.",
          explanation:
            "The output is `Score`, `10`, `4 + 6`, `10`. Line 2 evaluates `4 + 6`, so it prints `10`; line 3 is a string, so it prints `4 + 6` as it is; line 4 prints the integer `10`. Two lines print `10` for different reasons.",
        },
        {
          type: "question",
          id: "review-next-line",
          variant: "predict",
          prompt: "Python has just printed `B`. Which line of the code runs next?",
          code: `print("A")
print("B")
print("C")
print("D")`,
          choices: [
            {
              id: "line2",
              text: "Line 2 again",
              feedback: "A statement in a program like this runs once. After line 2 finishes, Python moves on.",
            },
            { id: "line3", text: "Line 3" },
            {
              id: "line4",
              text: "Line 4, the last one",
              feedback: "Python doesn't jump ahead. Each statement gets its turn in order.",
            },
          ],
          answer: "line3",
          explanation: "`B` comes from line 2, so line 2 has just finished. In a straight-down program like this, the next statement is the one below it: line 3, which prints `C`.",
        },
        {
          type: "question",
          id: "review-code-vs-output",
          variant: "predict",
          prompt: "Careful: this one prints some code. What appears on the screen?",
          code: `print('print("Hi")')`,
          choices: [
            {
              id: "hi",
              text: "`Hi`",
              feedback: "That would happen if the inner `print(\"Hi\")` ran. But it's inside the single quotes. Is it code here, or text?",
            },
            { id: "code", text: '`print("Hi")`' },
            {
              id: "whole",
              text: "`print('print(\"Hi\")')`",
              feedback: "That's the whole program. The outer `print` and its single quotes are instructions, not part of the output.",
            },
          ],
          answer: "code",
          hint: "Find the outer quotes first. Everything between them is one string.",
          explanation:
            "The single quotes make `print(\"Hi\")` a string: text that happens to look like code. The outer `print()` shows that text, so the output is `print(\"Hi\")`. The inner one never runs.",
        },
      ],
    },
    {
      id: "explain",
      title: "Explain a program",
      blocks: [
        {
          type: "code",
          language: "python",
          code: `print("Tickets")
print(3 + 2)
print("Enjoy the show")`,
          caption: "Read it first. The output is hidden on purpose: work it out as part of your explanation.",
        },
        {
          type: "reflect",
          id: "review-explain-program",
          prompt: "In your own words, explain what this program does when it runs, statement by statement, and what the printed output is.",
          answer:
            "Python runs the three statements in order. Line 1 calls `print()` with the string `\"Tickets\"`, so `Tickets` appears. Line 2 has an expression, `3 + 2`; Python evaluates it to `5` and then prints `5`. Line 3 prints `Enjoy the show`. The output is those three lines in that order, and nothing is stored for later.",
        },
      ],
    },
    {
      id: "find-the-error",
      title: "Find the error",
      blocks: [
        {
          type: "question",
          id: "review-debug-misspelled",
          variant: "debug",
          prompt: "This program printed `Good morning` and then stopped with an error. Why did line 1 work, and what's wrong?",
          code: `print("Good morning")
prnt("Time for school")
print("Bye")`,
          errorOutput: `Traceback (most recent call last):
  File "main.py", line 2, in <module>
    prnt("Time for school")
    ^^^^
NameError: name 'prnt' is not defined. Did you mean: 'print'?`,
          choices: [
            { id: "spelling", text: "Line 1 ran before Python reached the problem. Line 2 misspells `print` as `prnt`." },
            {
              id: "all-lines",
              text: "Every line is wrong, but Python only reports the first",
              feedback: "Line 1 printed `Good morning`, so line 1 ran successfully. Which line does the error message name?",
            },
            {
              id: "line3",
              text: "Line 3 is wrong, because `Bye` never appeared",
              feedback: "`Bye` didn't appear because the program stopped before line 3. Check the line number in the error.",
            },
          ],
          answer: "spelling",
          explanation:
            "Python runs statements in order, so line 1 finished and printed before line 2 started. On line 2 it looked for a name `prnt`, found nothing, and stopped with a `NameError`. Line 3 never ran. Fixing the spelling makes all three lines print.",
        },
        {
          type: "question",
          id: "review-debug-syntax",
          variant: "debug",
          prompt: "This program printed **nothing at all**, not even `Ready` from line 1. What's wrong?",
          code: `print("Ready")
print("Set)
print("Go")`,
          errorOutput: `  File "main.py", line 2
    print("Set)
          ^
SyntaxError: unterminated string literal (detected at line 2)`,
          choices: [
            {
              id: "line1",
              text: "Line 1 is wrong, because `Ready` didn't print",
              feedback: "Line 1 is correct. The error names line 2. Think about why a problem on line 2 could stop line 1 too.",
            },
            { id: "quote", text: "Line 2's string has no closing quote, and a syntax error stops Python before it runs anything" },
            {
              id: "name",
              text: "Python doesn't recognise the name `Set`",
              feedback: "That would be a `NameError`, after line 1 had printed. This is a `SyntaxError`. What does that mean for the whole program?",
            },
          ],
          answer: "quote",
          explanation:
            "Python checks that the whole program follows its writing rules before it runs any of it. Line 2 opens a string and never closes it, so Python reports a [SyntaxError](ref:python.errors.SyntaxError) and runs nothing. Adding the missing `\"` after `Set` fixes it.",
        },
      ],
    },
    {
      id: "put-in-order",
      title: "Put it in order",
      blocks: [
        {
          type: "text",
          text: "A program should print a countdown: `3`, then `2`, then `1`, then `Go!`. These four statements are in the wrong order:",
        },
        {
          type: "list",
          items: ["**A:** `print(\"Go!\")`", "**B:** `print(2)`", "**C:** `print(3)`", "**D:** `print(1)`"],
        },
        {
          type: "question",
          id: "review-order-countdown",
          variant: "predict",
          prompt: "Which order of statements, from top to bottom, prints the countdown correctly?",
          choices: [
            {
              id: "abcd",
              text: "A, B, C, D",
              feedback: "That's the order they're listed in, which would print `Go!` first. The output follows the order of the statements, so what must come first?",
            },
            {
              id: "dbca",
              text: "D, B, C, A",
              feedback: "That prints `1`, `2`, `3`, `Go!`: counting up. Which statement prints `3`?",
            },
            { id: "cbda", text: "C, B, D, A" },
          ],
          answer: "cbda",
          explanation:
            "Output appears in the order the statements run, so the statements must be in the order you want to see: C prints `3`, B prints `2`, D prints `1`, and A prints `Go!` last.",
        },
      ],
    },
    {
      id: "practice",
      title: "Practice",
      blocks: [
        {
          type: "practice",
          id: "practice-morning-routine",
          context: "A robot helper needs a program that announces its morning routine, one step per line.",
          prompt: "Write a program that prints these three steps, in this order: `Wake up`, `Brush teeth`, `Eat breakfast`.",
          checklist: ["Use one `print()` per step.", "Put each step's text inside quotes.", "Print the steps in the order given."],
          hints: ["Each step is one statement, and statements run from the top.", "The first line of your program is `print(\"Wake up\")`."],
          solution: `print("Wake up")
print("Brush teeth")
print("Eat breakfast")`,
          solutionNote:
            "Python runs the three lines from the top, so the steps appear in the same order you wrote them. Swap two lines and the printed order swaps too.",
        },
        {
          type: "practice",
          id: "practice-party-plan",
          context: "You're planning a party with 4 tables of 6 guests each, and want a program to announce it.",
          prompt: "Write a program that prints `Party plan`, then the number of guests worked out by Python from `4 * 6`, then `See you there!`. (In Python, `*` means multiply.)",
          checklist: [
            "Three `print()` statements, in that order.",
            "Quotes around the two pieces of text.",
            "`4 * 6` without quotes, so Python evaluates it to `24`.",
            "Before checking the solution, trace your program and write down the output you expect.",
          ],
          hints: ["This works like the receipt program in the last lesson, with `*` instead of `+`.", "The middle line is `print(4 * 6)`."],
          solution: `print("Party plan")
print(4 * 6)
print("See you there!")`,
          solutionNote:
            "Line 2 is an expression, so Python works out `24` before calling `print()`. If you wrote `print(\"4 * 6\")`, you'd see `4 * 6` instead, because the quotes make it a string.",
        },
      ],
    },
    {
      id: "key-ideas",
      title: "Chapter 1 in one list",
      blocks: [
        {
          type: "list",
          items: [
            "A **program** is a list of exact instructions. Python runs its **statements** one at a time, finishing each before the next.",
            "`print()` is a built-in function that shows a value on the screen. Output is shown, not stored.",
            "Strings are text in quotes; integers are whole numbers without quotes. `\"42\"` and `42` print the same but aren't the same.",
            "An **expression** like `4 * 6` is evaluated first, and then its value is used.",
            "A `NameError` stops the program at that line, after earlier lines have run. A `SyntaxError` stops it before anything runs.",
            "Next chapter: variables, so a program can remember values and use them again.",
          ],
        },
      ],
    },
  ],
};
