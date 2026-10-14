import type { Lesson } from "@/courses/types";
import type { Walkthrough } from "@/types/trace";

const threeMessages: Walkthrough = {
  id: "py-three-messages",
  title: "Three statements, in order",
  language: "python",
  // Only code and printed output: the point is which line runs and when its output appears.
  visualizations: [],
  code: `print("Hello")
print("Welcome")
print("Let's learn Python")`,
  steps: [
    {
      line: 1,
      vars: {},
      output: ["Hello"],
      note: "Python starts with the first statement, on line 1. It runs it completely: Hello appears in the printed output.",
    },
    {
      line: 2,
      vars: {},
      output: ["Hello", "Welcome"],
      note: "Line 1 is finished, so Python moves to line 2. Welcome appears on a new line, under Hello. Nothing printed earlier disappears.",
      checkpoint: {
        prompt: "Line 1 has finished and `Hello` is on the screen. What does the printed output show once line 2 has run?",
        choices: [
          { id: "both", text: "`Hello`, with `Welcome` on the line below it" },
          {
            id: "replace",
            text: "Only `Welcome`: it replaces `Hello`",
            feedback: "Output builds up as the program runs. Does anything in line 2 ask Python to remove what's already been printed?",
          },
          {
            id: "all",
            text: "All three messages",
            feedback: "Python runs one statement at a time. After line 2, has line 3 had its turn yet?",
          },
        ],
        answer: "both",
        explanation: "Each statement adds its output underneath what's already there. After line 2, the screen shows `Hello` and then `Welcome`. Line 3 hasn't run yet.",
      },
    },
    {
      line: 3,
      vars: {},
      output: ["Hello", "Welcome", "Let's learn Python"],
      note: "Line 3 is the last statement. After it runs there's nothing left to do, so the program ends.",
    },
  ],
};

/**
 * Chapter 1, lesson 2: running (execution), statements, order, and code versus output.
 * print() is used but explained properly in lesson 3; here it only needs to "show text".
 */
export const howComputersFollowInstructions: Lesson = {
  id: "how-computers-follow-instructions",
  title: "How Does a Computer Follow Instructions?",
  description: "What running a program means, why order matters, and how code differs from what it prints.",
  status: "published",
  objectives: [
    "Explain what it means to run, or execute, a program.",
    "Identify the statements in a short program and the order Python runs them.",
    "Predict when each line of printed output appears.",
    "Tell code apart from the output it produces.",
  ],
  references: ["concept.statement", "concept.interpreter", "concept.program"],
  sections: [
    {
      id: "running",
      title: "Instructions do nothing until they run",
      blocks: [
        {
          type: "text",
          text: "A recipe on a page never baked a cake. Something only happens when someone follows it, one step after another. Code is the same: a program saved in a file just sits there until the computer carries it out.",
        },
        {
          type: "text",
          text: "Carrying out a program is called **running** it, or **executing** it. When you run a Python program, the [interpreter](ref:concept.interpreter) starts at the top and carries out the instructions one at a time. That process is **execution**.",
        },
        {
          type: "text",
          text: "Each complete instruction in Python is a [statement](ref:concept.statement). In the programs in this chapter, every line is one statement. Here are three. Each one uses `print()` to show a message on the screen; the next lesson looks at exactly how `print()` works.",
        },
        {
          type: "code",
          language: "python",
          code: threeMessages.code,
          caption: "Walk through it: watch which line is running and when each message appears.",
          walkthrough: threeMessages,
        },
        {
          type: "callout",
          tone: "execution",
          text: "Python finishes one statement completely before it starts the next. Statement 2 never begins while statement 1 is still running, so their output can't get mixed up or swap places.",
        },
      ],
    },
    {
      id: "order",
      title: "Order matters",
      blocks: [
        {
          type: "text",
          text: "Because Python works from the top, the order of your statements is the order things happen. Python has no idea what your messages mean, so it can't rearrange them into an order that makes more sense.",
        },
        {
          type: "question",
          id: "predict-socks",
          variant: "predict",
          prompt: "What does this program print **first**?",
          code: `print("Put on your shoes")
print("Put on your socks")`,
          choices: [
            {
              id: "socks",
              text: "`Put on your socks`",
              feedback:
                "That's the sensible order for a person, but Python doesn't know anything about shoes or socks. Which line does it run first?",
            },
            { id: "shoes", text: "`Put on your shoes`" },
            {
              id: "both",
              text: "Both lines at the same moment",
              feedback: "Python finishes one statement before it starts the next, so the two lines can't happen together.",
            },
          ],
          answer: "shoes",
          hint: "Ignore what the words mean. Which line is at the top?",
          explanation:
            "Python runs line 1, then line 2, so the shoes line comes first. The program is wrong for real life, and Python can't tell. It does what the code says, which means getting the order right is your job.",
        },
      ],
    },
    {
      id: "code-and-output",
      title: "Code is not output",
      blocks: [
        {
          type: "text",
          text: "The **code** is what you write. The **output** is what appears on the screen when the code runs. In Glowcode, code appears in the dark editor panel, and anything the program shows appears under **Printed output**.",
        },
        {
          type: "text",
          text: "They look related but they aren't the same. The output never includes the word `print`, the parentheses or the quotes. Those are instructions to Python, not part of the message.",
        },
        {
          type: "question",
          id: "predict-code-vs-output",
          variant: "predict",
          prompt: "What appears on the screen when this one-line program runs?",
          code: `print("Welcome")`,
          choices: [
            {
              id: "code",
              text: '`print("Welcome")`',
              feedback: "That's the code itself. When it runs, does Python show the instruction, or carry it out?",
            },
            {
              id: "quotes",
              text: '`"Welcome"`',
              feedback: "The quotes tell Python where the message starts and ends. Are they part of the message?",
            },
            { id: "text", text: "`Welcome`" },
          ],
          answer: "text",
          explanation:
            "`print()` carries out its job: it shows the message itself. The quotes only mark where the message starts and ends, so they aren't shown, and neither is the word `print`.",
        },
      ],
    },
    {
      id: "not-always-in-order",
      title: "Top to bottom, for now",
      blocks: [
        {
          type: "text",
          text: "Every program in this chapter runs straight down, top to bottom. Real programs don't always. Later you'll write code that makes **decisions** (running some lines and skipping others), code that **repeats** lines, and code that jumps to a named set of instructions and comes back.",
        },
        {
          type: "text",
          text: "What stays true in every case: Python runs **one statement at a time**, and it always knows exactly which one is next. Reading code well means following that same path yourself, which is what lesson 5 practices.",
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
            "Running a program is called **execution**. Python carries out one statement at a time and finishes it before the next.",
            "In simple programs, statements run from top to bottom, so their order is the order things happen.",
            "Printed output builds up line by line, in the order the statements run.",
            "The code is the instructions; the output is what they show. Quotes and `print` don't appear in the output.",
          ],
        },
      ],
    },
  ],
};
