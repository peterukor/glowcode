import type { Lesson } from "@/courses/types";
import type { PyValue } from "@/types/python";
import type { Walkthrough } from "@/types/trace";

const int = (value: number): PyValue => ({ type: "int", value });
const str = (value: string): PyValue => ({ type: "str", value });

const assignWalkthrough: Walkthrough = {
  id: "py-age-assignment",
  title: "Creating a variable",
  language: "python",
  visualizations: ["variables"],
  code: `age = 13
print(age)`,
  steps: [
    {
      line: 1,
      vars: { age: int(13) },
      highlight: "age",
      note: "Right side first: the value is 13. Then Python makes the name age refer to it.",
    },
    {
      line: 2,
      vars: { age: int(13) },
      output: ["13"],
      note: "age has no quotes, so it's a name. Python looks up what age refers to and prints that value: 13.",
    },
  ],
};

const birthdayWalkthrough: Walkthrough = {
  id: "py-birthday",
  title: "Changing a variable",
  language: "python",
  visualizations: ["variables"],
  code: `age = 13
print(age)
age = age + 1
print(age)`,
  steps: [
    { line: 1, vars: { age: int(13) }, highlight: "age", note: "age now refers to 13." },
    { line: 2, vars: { age: int(13) }, output: ["13"], note: "Print the current value: 13." },
    {
      line: 3,
      vars: { age: int(13) },
      evaluation: ["age + 1", "13 + 1", "14"],
      output: ["13"],
      note: "Line 3, right side first. Python looks up age (still 13), then adds 1. The result is a brand-new value: 14.",
    },
    {
      line: 3,
      vars: { age: int(14) },
      highlight: "age",
      output: ["13"],
      note: "Now the assignment: the name age moves to the new value, 14. Same line, second step.",
    },
    { line: 4, vars: { age: int(14) }, output: ["13", "14"], note: "Print again. Same name, new value: 14." },
  ],
};

export const whyVariablesExist: Lesson = {
  id: "why-variables-exist",
  title: "Why Do Variables Exist?",
  description: "How a program remembers information, and how Python assignment works.",
  status: "published",
  objectives: [
    "Explain why programs need a way to remember values.",
    "Create a variable with assignment and describe the two steps Python takes.",
    "Update a variable using its old value, like `age = age + 1`.",
  ],
  references: ["concept.variable", "python.operators.assignment", "python.types.int", "python.types.str"],
  sections: [
    {
      id: "why",
      title: "A website that needs to remember",
      blocks: [
        {
          type: "text",
          text: "Imagine you're building the sign-up page for a games website. A new player types in their age: 13.",
        },
        {
          type: "text",
          text: "The site needs that number again and again: to decide which games the player can see, to show it on their profile, and to wish them a happy birthday next year.",
        },
        {
          type: "text",
          text: "But a program runs one instruction at a time. Once the instruction that read the age has finished, how does the program hold on to 13 for later? It needs a way to **remember** values. That's exactly what variables are for.",
        },
      ],
    },
    {
      id: "what-is-a-variable",
      title: "What is a variable?",
      blocks: [
        {
          type: "text",
          text: "A [variable](ref:concept.variable) is a name that refers to a value. You choose the name, and Python keeps track of which value the name currently refers to. Whenever your code uses the name, Python swaps in that value.",
        },
        {
          type: "figure",
          caption: "Glowcode draws variables as labeled boxes: the name on top, the value below, colored by its type.",
          figure: { kind: "variables", vars: { age: int(13), name: str("Ada") } },
        },
      ],
    },
    {
      id: "creating",
      title: "Creating a variable",
      blocks: [
        {
          type: "code",
          language: "python",
          code: assignWalkthrough.code,
          output: ["13"],
          walkthrough: assignWalkthrough,
        },
        {
          type: "text",
          text: "The `=` sign is the [assignment operator](ref:python.operators.assignment). Python handles an assignment in two steps:",
        },
        {
          type: "list",
          ordered: true,
          items: ["Work out the value on the **right** side.", "Make the name on the **left** refer to that value."],
        },
        {
          type: "text",
          text: "So read `age = 13` as \"set age to 13\", not \"age equals 13\". It's an instruction, not a statement of fact.",
        },
        {
          type: "callout",
          tone: "careful",
          title: "age vs \"age\"",
          text: "`print(age)` prints `13`: without quotes, `age` is a name, so Python looks up its value. `print(\"age\")` prints the word `age`: with quotes, it's just text.",
        },
      ],
    },
    {
      id: "changing",
      title: "Changing a variable",
      blocks: [
        {
          type: "text",
          text: "A year goes by and the player has a birthday. The program doesn't need a new variable; it can give the same name a new value.",
        },
        {
          type: "code",
          language: "python",
          code: birthdayWalkthrough.code,
          output: ["13", "14"],
          caption: "Walk through this one: line 3 happens in two steps.",
          walkthrough: birthdayWalkthrough,
        },
        {
          type: "text",
          text: "In math, `age = age + 1` would be impossible. In Python it's normal, because of the two steps: first work out `age + 1` using the **old** value (13 + 1 is 14), then make `age` refer to the result. The old value is simply no longer used.",
        },
      ],
    },
    {
      id: "python-names",
      title: "Python's way: names can change type",
      blocks: [
        {
          type: "text",
          text: "In Python, a name isn't tied to one kind of value. The same name can refer to a whole number ([int](ref:python.types.int)) and later to text ([str](ref:python.types.str)):",
        },
        {
          type: "code",
          language: "python",
          code: `age = 13
age = "thirteen"`,
          caption: "Allowed, but usually confusing. Keeping one kind of value per name makes code easier to read.",
        },
        {
          type: "callout",
          tone: "other-languages",
          title: "In Java",
          text: "Java asks you to declare a variable's type when you create it, like `int age = 13;`. After that, Java won't let `age` hold text. You'll meet this in the Java course; for now, Python's way is all you need.",
        },
      ],
    },
    {
      id: "check",
      title: "Check your understanding",
      blocks: [
        {
          type: "callout",
          tone: "mindset",
          title: "Predict first",
          text: "Before checking an answer, say what each variable holds after every line. When your prediction is wrong, you've found exactly the thing worth learning.",
        },
        {
          type: "question",
          id: "predict-score",
          variant: "predict",
          prompt: "What does this program print?",
          code: `score = 10
score = score + 5
print(score)`,
          choices: [
            { id: "10", text: "`10`" },
            { id: "15", text: "`15`" },
            { id: "text", text: "`score + 5`" },
            { id: "error", text: "An error, because `score` can't use itself" },
          ],
          answer: "15",
          explanation:
            "Line 2 works out the right side first, using the old value: 10 + 5 is 15. Then `score` refers to 15, and that's what gets printed.",
        },
        {
          type: "question",
          id: "debug-name-case",
          variant: "debug",
          prompt: "This program crashes with `NameError: name 'Age' is not defined`. Why?",
          code: `age = 13
print(Age)`,
          choices: [
            { id: "case", text: "Names are case-sensitive: `Age` and `age` are different names" },
            { id: "quotes", text: "`Age` needs quotes around it" },
            { id: "numbers", text: "`print()` can't show numbers" },
          ],
          answer: "case",
          explanation:
            "The program created `age` (lowercase) but asked for `Age`. To Python those are completely different names, and nothing called `Age` exists. Adding quotes wouldn't fix it either: it would print the word Age instead of 13.",
        },
      ],
    },
    {
      id: "practice",
      title: "Practice",
      blocks: [
        {
          type: "practice",
          id: "practice-player-level",
          prompt:
            "A game needs to remember a player's name and level. Create a variable `player` holding a name, and a variable `level` set to `1`. Then the player levels up: increase `level` by 1. Finally, print both variables.",
          hints: ["Text needs quotes; numbers don't.", "To level up, use the old value on the right side: `level = level + 1`."],
          solution: `player = "Ada"
level = 1
level = level + 1
print(player)
print(level)`,
          solutionNote: "This prints `Ada` and then `2`. Any name works for the player, as long as it's inside quotes.",
        },
      ],
    },
  ],
};
