import type { Lesson } from "@/courses/types";
import type { Walkthrough } from "@/types/trace";

const helloWalkthrough: Walkthrough = {
  id: "py-hello-program",
  title: "Your first program",
  language: "python",
  // No variables or decisions here: the walkthrough shows just the code and the console.
  visualizations: [],
  code: `print("Hello!")
print("I am a Python program.")`,
  steps: [
    { line: 1, vars: {}, output: ["Hello!"], note: "Python starts at the top. Line 1 calls print(), which shows Hello! in the console." },
    {
      line: 2,
      vars: {},
      output: ["Hello!", "I am a Python program."],
      note: "Only after line 1 is finished does Python move to line 2. One instruction at a time, top to bottom.",
    },
  ],
};

export const whatIsProgramming: Lesson = {
  id: "what-is-programming",
  title: "What Is Programming?",
  description: "What a program is, why people write them, and how a computer follows instructions.",
  status: "published",
  objectives: [
    "Explain what a program is in your own words.",
    "Describe how Python runs code: one line at a time, from top to bottom.",
    "Read a two-line program and predict exactly what it prints.",
  ],
  references: ["concept.program", "python.builtins.print", "python.types.str"],
  sections: [
    {
      id: "why",
      title: "Why learn to program?",
      blocks: [
        {
          type: "text",
          text: "A game that remembers your high score. A map that finds the fastest way home. A website that greets you by name. Each of these is a program that someone wrote.",
        },
        {
          type: "text",
          text: "**Programming** is how you get a computer to do a job for you. Once the instructions are written, the computer can repeat that job thousands of times, very fast, without getting tired or bored.",
        },
      ],
    },
    {
      id: "what-is-a-program",
      title: "What is a program?",
      blocks: [
        {
          type: "text",
          text: "A [program](ref:concept.program) is a list of instructions for a computer. Computers are extremely fast and extremely obedient, but they don't guess what you meant. They do exactly what the instructions say, in the order they're written.",
        },
        {
          type: "callout",
          tone: "real-world",
          title: "Like a recipe",
          text: "A recipe lists steps in order: crack the eggs, then whisk them, then cook them. A computer is like a cook who never improvises. If the recipe says to cook the eggs before cracking them, it will try exactly that.",
        },
        {
          type: "text",
          text: "Deep down, a computer only understands very simple instructions made of numbers. A **programming language** like Python lets people write instructions that humans can read too. A program called the **Python interpreter** reads your code and carries it out, one instruction at a time.",
        },
      ],
    },
    {
      id: "first-program",
      title: "Your first Python program",
      blocks: [
        {
          type: "code",
          language: "python",
          code: helloWalkthrough.code,
          output: ["Hello!", "I am a Python program."],
          caption: "Two instructions, so two lines of output.",
          walkthrough: helloWalkthrough,
        },
        {
          type: "text",
          text: "[`print()`](ref:python.builtins.print) is a built-in Python function that shows text in the console. You don't need to know how it works inside yet, only what it does: whatever you put between its parentheses appears on the screen.",
        },
        {
          type: "text",
          text: "The text inside the quotes is called a [string](ref:python.types.str). The quotes tell Python \"this is text, use it exactly as written\". They don't appear in the output.",
        },
      ],
    },
    {
      id: "order-matters",
      title: "Order matters",
      blocks: [
        {
          type: "text",
          text: "Python always starts at the top and runs one line at a time. It finishes each line completely before moving to the next one.",
        },
        {
          type: "question",
          id: "predict-socks",
          variant: "predict",
          prompt: "What does the console show **first**?",
          code: `print("Put on your socks")
print("Put on your shoes")`,
          choices: [
            { id: "socks", text: "`Put on your socks`" },
            { id: "shoes", text: "`Put on your shoes`" },
            { id: "both", text: "Both lines at the same moment" },
          ],
          answer: "socks",
          explanation:
            "Python runs line 1, then line 2. If you swapped the two lines, it would print the shoes line first, and it wouldn't notice that's silly. A computer does what the code says, not what you meant.",
        },
      ],
    },
    {
      id: "think-like-a-programmer",
      title: "Think like a programmer",
      blocks: [
        {
          type: "text",
          text: "Programmers spend more time thinking than typing. Before writing code, they make sure they understand the problem and break it into small, exact steps.",
        },
        {
          type: "callout",
          tone: "mindset",
          title: "Try it: be the computer",
          text: "Write instructions for making a glass of water, as if for a robot that knows nothing. \"Get water\" is too vague: from where? In what? You'll find yourself writing steps like \"pick up a glass\" and \"turn on the tap\". Being that precise is most of programming.",
        },
        {
          type: "question",
          id: "debug-capital-print",
          variant: "debug",
          prompt: "This program crashes with `NameError: name 'Print' is not defined`. What's wrong?",
          code: `Print("Hello!")`,
          choices: [
            { id: "case", text: "`Print` should be lowercase: `print`" },
            { id: "quotes", text: "The text needs single quotes instead of double quotes" },
            { id: "semicolon", text: "The line needs a semicolon at the end" },
          ],
          answer: "case",
          explanation:
            "Python is **case-sensitive**: `print` and `Print` are two different names. Python only has a built-in called `print`, so `Print` means nothing to it. Notice how the error message named the exact word it didn't recognize. Reading errors carefully is a programmer's superpower.",
        },
      ],
    },
  ],
};
