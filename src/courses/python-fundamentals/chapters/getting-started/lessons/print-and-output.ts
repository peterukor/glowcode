import type { Lesson } from "@/courses/types";
import type { Walkthrough } from "@/types/trace";

const printValues: Walkthrough = {
  id: "py-print-values",
  title: "Printing text and numbers",
  language: "python",
  // The function view keeps "Returns" and "Prints" in separate boxes, which is the point of
  // this lesson: print() shows a value; what it hands back is None.
  visualizations: ["function"],
  code: `print("Hello")
print(42)
print("42")`,
  steps: [
    {
      line: 1,
      vars: {},
      output: [],
      call: { name: "print", args: ['"Hello"'], returns: "None", prints: ["Hello"], phase: "call" },
      note: "Line 1 calls print() with the string \"Hello\" as its input. The two boxes underneath are still empty: print() hasn't run yet.",
    },
    {
      line: 1,
      vars: {},
      output: ["Hello"],
      call: { name: "print", args: ['"Hello"'], returns: "None", prints: ["Hello"], phase: "result" },
      note: "print() shows Hello on the screen. It also hands back a value, None, which is Python's way of saying \"nothing useful\". Showing and handing back are different things.",
    },
    {
      line: 2,
      vars: {},
      output: ["Hello", "42"],
      call: { name: "print", args: ["42"], returns: "None", prints: ["42"], phase: "result" },
      note: "Line 2 gives print() the number 42. There are no quotes, so this is an integer, a whole number. print() shows it as 42.",
    },
    {
      line: 3,
      vars: {},
      output: ["Hello", "42", "42"],
      call: { name: "print", args: ['"42"'], returns: "None", prints: ["42"], phase: "result" },
      note: "Line 3 gives print() the string \"42\": the characters 4 and 2. It looks exactly like line 2's output, but Python was handed a different kind of value.",
      checkpoint: {
        prompt: "Line 2 printed the integer `42`. Line 3 gives `print()` the string `\"42\"`. What does the output show after line 3?",
        choices: [
          {
            id: "quotes",
            text: 'A new line showing `"42"`, with quotes',
            feedback: "The quotes make `\"42\"` a string, but `print()` never shows the quotes around a string. What's left?",
          },
          { id: "same", text: "A new line showing `42`, the same as line 2" },
          {
            id: "replace",
            text: "Only one `42`: line 3 replaces line 2's output",
            feedback: "Output only ever builds up. Each `print()` adds a new line underneath what's already there.",
          },
        ],
        answer: "same",
        explanation: "The printed output looks the same, `42`, but the values were different: an integer on line 2 and a string on line 3. You can't tell them apart from the output alone; you can from the code.",
      },
    },
  ],
};

/**
 * Chapter 1, lesson 4: printing numbers as well as text, int versus str, output order,
 * printing versus returning, and the two classic mistakes (missing quotes, missing parenthesis).
 */
export const printAndOutput: Lesson = {
  id: "print-and-output",
  title: "Understanding print() and Output",
  description: "Print text and numbers, tell a string from an integer, and fix missing quotes or parentheses.",
  status: "published",
  objectives: [
    "Print text and whole numbers with `print()`.",
    "Explain why `42` and `\"42\"` print the same but are different kinds of value.",
    "Explain that `print()` shows a value on the screen; it doesn't store it or hand it back.",
    "Recognise and fix a missing quote or a missing parenthesis from the error message.",
  ],
  references: ["python.builtins.print", "python.types.str", "python.types.int", "concept.return-value", "python.errors.NameError", "python.errors.SyntaxError"],
  sections: [
    {
      id: "scoreboard",
      title: "Words and numbers",
      blocks: [
        {
          type: "text",
          text: "Think of a game's scoreboard. It shows words, like **Level** and **Score**, and numbers, like **3** and **1500**. Programs show both all the time, and `print()` handles both. But to Python, words and numbers are different kinds of value, even when they look identical on the screen.",
        },
        {
          type: "code",
          language: "python",
          code: printValues.code,
          caption: "Three calls to print(). Watch what goes in and what comes out of each one.",
          walkthrough: printValues,
        },
        {
          type: "text",
          text: "Each `print()` call adds a new line of output under the last one, in the order the statements run. Nothing printed earlier changes or disappears.",
        },
      ],
    },
    {
      id: "strings-and-integers",
      title: "Same look, different value",
      blocks: [
        {
          type: "text",
          text: "Every value in Python has a **type**, which says what kind of value it is. You've met two:",
        },
        {
          type: "list",
          items: [
            "`\"42\"` is a [string](ref:python.types.str) (type `str`): text. It's the character 4 followed by the character 2, just like `\"Hello\"` is H, e, l, l, o.",
            "`42` is an [integer](ref:python.types.int) (type `int`): a whole number. You write it without quotes, and Python can do arithmetic with it.",
          ],
        },
        {
          type: "text",
          text: "The quotes decide it. Anything in quotes is a string, even if it's made of digits. That's why the quotes matter so much: they change what Python does with the value, as this program shows.",
        },
        {
          type: "question",
          id: "predict-quoted-sum",
          variant: "predict",
          prompt: "What does this program print?",
          code: `print("10 + 5")`,
          choices: [
            {
              id: "sum",
              text: "`15`",
              feedback: "Look at the quotes. Everything between them is text, so is Python being asked to do a sum, or to show some characters?",
            },
            { id: "text", text: "`10 + 5`" },
            {
              id: "quoted",
              text: '`"10 + 5"`',
              feedback: "The quotes make this a string, but `print()` doesn't show a string's quotes.",
            },
          ],
          answer: "text",
          hint: "Is `10 + 5` inside quotes or not?",
          explanation:
            "Because `10 + 5` is inside quotes, it's a string: just the characters 1, 0, space, +, space, 5. Python shows them exactly as they are. In the next lesson you'll see what happens without the quotes.",
        },
      ],
    },
    {
      id: "showing-not-keeping",
      title: "print() shows; it doesn't keep",
      blocks: [
        {
          type: "text",
          text: "It's easy to think `print()` saves its value somewhere. It doesn't. It puts text on the screen for a person to read, and that's all. The program can't look at the screen later to get the value back.",
        },
        {
          type: "text",
          text: "In the walkthrough, the function diagram had two separate boxes. **Prints** is what appeared on the screen. **Returns** is the value a function hands back to the program, called its [return value](ref:concept.return-value). For `print()`, that value is always `None`, Python's value for \"nothing here\".",
        },
        {
          type: "callout",
          tone: "mindset",
          title: "Shown is not stored",
          text: "If a program needs to remember a value and use it again, it has to store it, which is what variables are for in the next chapter. Printing a value only shows it.",
        },
        {
          type: "question",
          id: "predict-print-keeps",
          variant: "predict",
          prompt: "A student writes `print(1500)` on line 1 and hopes Python will remember the score for later. What does line 1 actually do?",
          choices: [
            {
              id: "stores",
              text: "It shows `1500` and saves it so later lines can use it",
              feedback: "Nothing in `print(1500)` gives the value a name or a place to live. What did the **Returns** box show for every `print()` call?",
            },
            { id: "shows", text: "It shows `1500` on the screen, and nothing is kept for later lines" },
            {
              id: "returns",
              text: "It hands `1500` back to the program",
              feedback: "`print()` shows its input, but the value it hands back is `None`, not the number it printed.",
            },
          ],
          answer: "shows",
          explanation:
            "`print()` only displays its input. The value it hands back is `None`, so nothing about `1500` is kept. To keep a value, a program stores it in a variable, which is the next chapter.",
        },
      ],
    },
    {
      id: "common-mistakes",
      title: "Two common mistakes",
      blocks: [
        {
          type: "text",
          text: "Most first errors come from a missing quote or a missing parenthesis. The error messages look alarming, but each one points at the problem. Start with the last line.",
        },
        {
          type: "question",
          id: "debug-missing-quotes",
          variant: "debug",
          prompt: "This program was meant to print `Hello`. What went wrong?",
          code: `print(Hello)`,
          errorOutput: `Traceback (most recent call last):
  File "main.py", line 1, in <module>
    print(Hello)
          ^^^^^
NameError: name 'Hello' is not defined`,
          choices: [
            {
              id: "print",
              text: "`print` is spelled wrongly",
              feedback: "`print` is spelled correctly here. The arrows `^^^^^` sit under a different word. Which one?",
            },
            { id: "quotes", text: "`Hello` has no quotes, so Python treats it as a name instead of text" },
            {
              id: "capital",
              text: "`Hello` must start with a lowercase letter",
              feedback: "Capital letters are fine inside text. The problem is how Python knows `Hello` is text at all.",
            },
          ],
          answer: "quotes",
          hint: "How does Python know where a piece of text starts and ends?",
          explanation:
            "Without quotes, Python reads `Hello` as a **name**, like `print`, and looks for something called `Hello`. There isn't one, so it stops with a [NameError](ref:python.errors.NameError). Writing `print(\"Hello\")` makes it a string.",
        },
        {
          type: "question",
          id: "debug-missing-parenthesis",
          variant: "debug",
          prompt: "This program didn't print anything. What's wrong?",
          code: `print("Hello"`,
          errorOutput: `  File "main.py", line 1
    print("Hello"
         ^
SyntaxError: '(' was never closed`,
          choices: [
            {
              id: "quotes",
              text: "The string needs single quotes",
              feedback: "Double quotes are fine, and both of them are there. The arrow points at a different symbol.",
            },
            {
              id: "name",
              text: "Python doesn't know the name `print`",
              feedback: "This is a `SyntaxError`, not a `NameError`. Python stopped before it looked up any names. Read the last line again.",
            },
            { id: "paren", text: "The opening `(` has no matching `)`" },
          ],
          answer: "paren",
          explanation:
            "Every `(` needs a matching `)`. This is a [SyntaxError](ref:python.errors.SyntaxError): the code breaks Python's writing rules, so Python can't understand it and runs **nothing**, not even part of it. Adding `)` at the end fixes it.",
        },
      ],
    },
    {
      id: "your-turn",
      title: "Your turn",
      blocks: [
        {
          type: "practice",
          id: "practice-scoreboard",
          context: "A game's end screen shows the player's level and score, each label on its own line followed by its number.",
          prompt: "Write a program that prints these four lines: `Level`, `3`, `Score`, `1500`. Print the labels as strings and the numbers as integers.",
          checklist: [
            "Use four `print()` statements, one per line of output.",
            "Put quotes around the labels.",
            "Leave the quotes off the numbers, so they're integers.",
          ],
          hints: ["Line 2 of the walkthrough printed an integer: `print(42)`.", "Your program starts with `print(\"Level\")` and then `print(3)`."],
          solution: `print("Level")
print(3)
print("Score")
print(1500)`,
          solutionNote:
            "`print(\"3\")` would show exactly the same output, which is why you can't judge a value's type from the screen. In the code, the numbers have no quotes, so they're integers the program could do arithmetic with.",
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
            "`print()` can show strings (text in quotes) and integers (whole numbers, no quotes).",
            "`42` and `\"42\"` print the same, but one is an `int` and the other is a `str`. The quotes decide.",
            "`print()` shows a value on the screen. It doesn't store it, and the value it hands back is `None`.",
            "No quotes around text gives a `NameError`. A missing `)` gives a `SyntaxError`, and then nothing runs at all.",
          ],
        },
      ],
    },
  ],
};
