import type { Lesson } from "@/courses/types";
import type { Walkthrough } from "@/types/trace";

/**
 * Same id as the Phase 3 "Your first program" walkthrough, so a student's saved
 * "last activity" still points at a walkthrough that exists.
 */
const helloWorld: Walkthrough = {
  id: "py-hello-program",
  title: "Hello, world!",
  language: "python",
  // One call, two events: the string goes in, then print() shows it. print's return value
  // (None) is left out on purpose; lesson 4 introduces it.
  visualizations: ["function"],
  code: `print("Hello, world!")`,
  steps: [
    {
      line: 1,
      vars: {},
      output: [],
      call: { name: "print", args: ['"Hello, world!"'], phase: "call" },
      note: "Python reads line 1. It sees the name print, then parentheses, so it asks print() to do its job. The string \"Hello, world!\" goes in as the input. Nothing is on the screen yet.",
    },
    {
      line: 1,
      vars: {},
      output: ["Hello, world!"],
      call: { name: "print", args: ['"Hello, world!"'], prints: ["Hello, world!"], phase: "result" },
      note: "print() shows the text on the screen. The quotes were only there to mark where the text starts and ends, so they aren't printed. That was the last line, so the program ends.",
      checkpoint: {
        prompt: "`print()` has been given the string `\"Hello, world!\"`, which has a comma and a space in it. What appears in the printed output?",
        choices: [
          { id: "exact", text: "`Hello, world!` on one line" },
          {
            id: "two-lines",
            text: "`Hello,` on one line and `world!` on the next",
            feedback: "The comma is inside the quotes, so it's just a character in the text. How many strings does `print()` have here?",
          },
          {
            id: "tidied",
            text: "`Hello,world!`, without the space",
            feedback: "Python doesn't tidy your text. Everything between the quotes is part of the string, spaces included.",
          },
        ],
        answer: "exact",
        explanation: "Everything between the quotes is one string, and `print()` shows it exactly: the comma, the space and the `!` included. Only the quotes themselves aren't printed.",
      },
    },
  ],
};

/**
 * Chapter 1, lesson 3: the first real Python syntax. What print is (a function, explained
 * lightly), what the parentheses and quotes do, and where output appears.
 */
export const firstPythonProgram: Lesson = {
  id: "first-python-program",
  title: "Your First Python Program",
  description: "Write and read a one-line Python program, and know what each part of it does.",
  status: "published",
  objectives: [
    "Read a one-line Python program and say what each part does.",
    "Explain what the parentheses and the quotes in `print(\"Hello, world!\")` are for.",
    "Describe what happens, step by step, when the program runs and where its output appears.",
    "Fix a program that spells `print` wrongly, using the error message.",
  ],
  references: ["python.builtins.print", "concept.function", "python.types.str", "python.errors.NameError"],
  sections: [
    {
      id: "a-tradition",
      title: "A one-line program",
      blocks: [
        {
          type: "text",
          text: "For decades, programmers learning a new language have started the same way: make the computer say **Hello, world!** It's the smallest program that proves everything works, because you write some code, run it, and see a result.",
        },
        {
          type: "text",
          text: "In Python, the whole program is one line. Step through it and watch what happens:",
        },
        {
          type: "code",
          language: "python",
          code: helloWorld.code,
          caption: "One statement. Walk through it to see exactly what it prints.",
          walkthrough: helloWorld,
        },
      ],
    },
    {
      id: "the-parts",
      title: "What each part does",
      blocks: [
        {
          type: "text",
          text: "That one line has three parts, and each one has a job.",
        },
        {
          type: "list",
          items: [
            "`print` is the name of a [function](ref:concept.function). A function is a job that has a name. Python comes with [`print()`](ref:python.builtins.print) built in, and its job is to show something on the screen.",
            "The **parentheses** `( )` after the name tell Python to do that job now. Doing a function's job is called **calling** the function. Whatever goes between the parentheses is the input you give it.",
            "The **quotes** `\" \"` mark a piece of text. A piece of text in quotes is called a [string](ref:python.types.str). The quotes show Python where the text starts and stops, and they aren't part of the text itself.",
          ],
        },
        {
          type: "callout",
          tone: "execution",
          title: "When the program runs",
          text: "Python reads the line and finds the name `print` followed by parentheses, so it calls the `print()` function. It hands over the string `\"Hello, world!\"`. `print()` shows the text on the screen, and the program ends because there are no more lines.",
        },
        {
          type: "text",
          text: "What appears on the screen is called **output**. In Glowcode you'll see it under **Printed output**; on your own computer it appears in a window called a terminal. Output is for the person using the program. The program itself can't read it back later.",
        },
        {
          type: "question",
          id: "predict-single-quotes",
          variant: "predict",
          prompt: "This program uses single quotes instead of double quotes. What does it print?",
          code: `print('Hi there')`,
          choices: [
            {
              id: "quoted",
              text: "`'Hi there'`",
              feedback: "Single quotes do the same job as double quotes: they mark where the text starts and stops. Does `print()` show those marks?",
            },
            { id: "text", text: "`Hi there`" },
            {
              id: "error",
              text: "An error, because Python needs double quotes",
              feedback: "Python accepts either kind of quote, as long as the text starts and ends with the same kind.",
            },
          ],
          answer: "text",
          hint: "Think about what the quotes are for in the first place.",
          explanation:
            "Python treats `'Hi there'` and `\"Hi there\"` as the same string. Either way, the quotes only mark the edges of the text, so `print()` shows `Hi there`.",
        },
      ],
    },
    {
      id: "exact-spelling",
      title: "Python needs exact spelling",
      blocks: [
        {
          type: "text",
          text: "Python matches names exactly, including capital letters. When a name is wrong, Python can't guess what you meant. It stops and prints an **error message**. Read the **last line** of an error first: that's where Python says what went wrong.",
        },
        {
          type: "question",
          id: "debug-capital-print",
          variant: "debug",
          prompt: "This program stopped with an error instead of printing. What's wrong with the code?",
          code: `Print("Hello!")`,
          errorOutput: `Traceback (most recent call last):
  File "main.py", line 1, in <module>
    Print("Hello!")
    ^^^^^
NameError: name 'Print' is not defined. Did you mean: 'print'?`,
          choices: [
            { id: "case", text: "`Print` should be lowercase: `print`" },
            {
              id: "quotes",
              text: "The text needs single quotes instead of double quotes",
              feedback:
                "Python accepts single or double quotes around text, so the quotes are fine. Look at the last line of the error: which word does it complain about?",
            },
            {
              id: "semicolon",
              text: "The line needs a semicolon at the end",
              feedback: "Python doesn't use semicolons to end lines. The error message points to a specific name. Which one?",
            },
          ],
          answer: "case",
          explanation:
            "Python is **case-sensitive**, so `print` and `Print` are two different names. Python has a built-in function called `print` and nothing called `Print`, so it stops with a [NameError](ref:python.errors.NameError). The last line of the message named the exact word, and even suggested the fix.",
        },
      ],
    },
    {
      id: "your-turn",
      title: "Your turn",
      blocks: [
        {
          type: "practice",
          id: "practice-own-greeting",
          context: "A program that introduces itself is a classic first project.",
          prompt: "Write a one-line program that prints exactly this: `Hi, I'm Glow!`",
          checklist: [
            "Use `print` in lowercase, followed by parentheses.",
            "Put the text inside quotes, inside the parentheses.",
            "Check the output matches exactly, including the comma, the apostrophe and the `!`.",
          ],
          hints: [
            "Start from `print(\"Hello, world!\")` and change the text inside the quotes.",
            "The text contains an apostrophe (`'`). Which kind of quotes around it won't get confused by that?",
          ],
          solution: `print("Hi, I'm Glow!")`,
          solutionNote:
            "Double quotes are the safe choice here. With single quotes, Python would think the string ended at the apostrophe in `I'm`, and the rest of the line would be a syntax error.",
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
            "`print()` is a built-in **function**: a named job. Writing its name with parentheses **calls** it.",
            "The input goes between the parentheses. Text in quotes is a **string**; the quotes mark its edges and aren't printed.",
            "What `print()` shows on the screen is **output**, for the person running the program.",
            "Python is case-sensitive. A misspelled name stops the program with an error; read the last line first.",
          ],
        },
      ],
    },
  ],
};
