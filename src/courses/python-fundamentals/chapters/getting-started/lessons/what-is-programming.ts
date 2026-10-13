import type { Lesson } from "@/courses/types";
import type { Walkthrough } from "@/types/trace";

const helloWalkthrough: Walkthrough = {
  id: "py-hello-program",
  title: "Your first program",
  language: "python",
  // No variables or decisions here: the diagram shows each print() call and what it prints.
  visualizations: ["function"],
  code: `print("Hello!")
print("I am a Python program.")`,
  steps: [
    {
      line: 1,
      vars: {},
      output: ["Hello!"],
      call: { name: "print", args: ['"Hello!"'], prints: ["Hello!"], phase: "result" },
      note: "Python starts at the top. Line 1 gives the string \"Hello!\" to print(), which shows Hello! on the screen.",
    },
    {
      line: 2,
      vars: {},
      output: ["Hello!", "I am a Python program."],
      call: { name: "print", args: ['"I am a Python program."'], prints: ["I am a Python program."], phase: "result" },
      note: "Line 1 is finished, so Python moves to line 2 and prints the second message under the first.",
    },
  ],
};

export const whatIsProgramming: Lesson = {
  id: "what-is-programming",
  title: "What Is Programming?",
  description: "What a program is, why people write them, and how Python follows your instructions.",
  status: "published",
  objectives: [
    "Explain what a program is in your own words.",
    "Describe how Python runs code: one line at a time, from top to bottom.",
    "Read a short program and predict exactly what it prints.",
    "Use an error message to find a simple mistake.",
  ],
  references: [
    "concept.program",
    "concept.programming-language",
    "concept.interpreter",
    "python.builtins.print",
    "python.types.str",
    "python.errors.NameError",
  ],
  sections: [
    {
      id: "why",
      title: "Jobs worth handing over",
      blocks: [
        {
          type: "text",
          text: "Your teacher has 30 test papers to mark. For each one, she adds up the points, works out a percentage and writes a grade. The thinking is easy. Doing it 30 times without a single slip is the hard part.",
        },
        {
          type: "text",
          text: "Jobs like this are perfect for a computer. Once someone has written down the exact steps, a computer can follow them for 30 papers or 30,000, in a fraction of a second, and it never loses concentration halfway through.",
        },
        {
          type: "text",
          text: "Writing those steps down is **programming**. Every app on your phone, every game and every website started as someone writing steps like these.",
        },
      ],
    },
    {
      id: "what-is-a-program",
      title: "What is a program?",
      blocks: [
        {
          type: "text",
          text: "A [program](ref:concept.program) is a list of instructions for a computer. The computer carries them out in the order they're written, exactly as written. It can't guess what you meant, and it won't skip a step that looks silly.",
        },
        {
          type: "callout",
          tone: "real-world",
          title: "Like a recipe",
          text: "A recipe lists steps in order: crack the eggs, whisk them, then cook them. A computer is a cook who never improvises. If the recipe says to cook the eggs before cracking them, it tries exactly that.",
        },
        {
          type: "text",
          text: "You'll write your instructions in Python, a [programming language](ref:concept.programming-language) designed to be readable by people and precise enough for a computer. Another program, the Python [interpreter](ref:concept.interpreter), reads your code and carries it out:",
        },
        {
          type: "figure",
          caption: "Python works through your program one instruction at a time and finishes each one before starting the next.",
          figure: {
            kind: "sequence",
            steps: [
              "You write instructions in a `.py` file",
              "Python reads the **first** line and carries it out",
              "Python moves to the next line",
              "When the last line is done, the program ends",
            ],
          },
        },
      ],
    },
    {
      id: "first-program",
      title: "Your first Python program",
      blocks: [
        {
          type: "text",
          text: "Here is a complete Python program. It has two instructions, one per line.",
        },
        {
          type: "code",
          language: "python",
          code: helloWalkthrough.code,
          output: ["Hello!", "I am a Python program."],
          caption: "Two instructions, two lines of printed output, in the same order.",
          walkthrough: helloWalkthrough,
        },
        {
          type: "text",
          text: "[`print()`](ref:python.builtins.print) is a **function** that comes built into Python. A function is a named job you can ask Python to do. You ask by writing its name followed by parentheses, and whatever you put inside the parentheses is what `print()` shows on the screen.",
        },
        {
          type: "text",
          text: "The text inside the quotes is called a [string](ref:python.types.str). The quotes tell Python where the text starts and ends. They aren't part of the text, so they don't appear in the output.",
        },
        {
          type: "callout",
          tone: "execution",
          text: "When Python reaches line 1, it finds the string `\"Hello!\"`, hands it to `print()`, and `print()` writes `Hello!` on the screen. Only then does Python look at line 2.",
        },
      ],
    },
    {
      id: "order-matters",
      title: "Order matters",
      blocks: [
        {
          type: "text",
          text: "Because Python always runs from the top, the order of your lines is the order things happen. Try predicting before you check.",
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
              feedback: "Python finishes one instruction before it starts the next, so the two lines can't happen together.",
            },
          ],
          answer: "shoes",
          hint: "Ignore what the words mean. Which line is at the top?",
          explanation:
            "Python runs line 1, then line 2, so the shoes line comes first. The program is wrong for real life, and Python can't tell. It does what the code says, which means getting the order right is your job.",
        },
        {
          type: "reflect",
          id: "reflect-exact-instructions",
          prompt: "A friend would understand \"put on your shoes and socks\" and do it in the right order. Why can't Python do the same?",
          answer:
            "Your friend knows how feet, socks and shoes work, and fills in the missing details without noticing. Python knows nothing about the world. It only knows the instructions it was given, in the order it was given them. That's why programmers write steps that are complete and in the right order, with nothing left for the computer to guess.",
        },
      ],
    },
    {
      id: "think-like-a-programmer",
      title: "When something goes wrong",
      blocks: [
        {
          type: "callout",
          tone: "mindset",
          title: "Be the computer",
          text: "Write instructions for making a glass of water for a robot that knows nothing. \"Get water\" is too vague: from where, and in what? You'll end up writing steps like \"pick up a glass\" and \"turn on the tap\". Being that exact is most of programming.",
        },
        {
          type: "text",
          text: "Because Python needs everything exact, small slips stop a program. When that happens, Python prints an **error message** that names the problem. Programmers read the **last line** of the message first, because that's where the problem is described.",
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
              feedback:
                "Python doesn't use semicolons to end lines. The error message points to a specific name. Which one?",
            },
          ],
          answer: "case",
          explanation:
            "Python is **case-sensitive**, so `print` and `Print` are two different names. Python has a built-in called `print` and nothing called `Print`, so it stops with a [NameError](ref:python.errors.NameError). The last line of the message named the exact word, and even suggested the fix.",
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
          hints: [
            "Your first program printed two lines with two `print()` instructions. This one needs three.",
            "The first line of your program is `print(\"Wake up\")`.",
          ],
          solution: `print("Wake up")
print("Brush teeth")
print("Eat breakfast")`,
          solutionNote:
            "Python runs the three lines from the top, so the steps appear in the same order you wrote them. Swap two lines and the printed order swaps too.",
        },
      ],
    },
  ],
};
