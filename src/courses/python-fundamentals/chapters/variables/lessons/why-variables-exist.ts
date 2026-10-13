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
      note: "age has no quotes, so it's a name. Python looks up the value age refers to, and print() shows it: 13.",
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
    { line: 2, vars: { age: int(13) }, output: ["13"], note: "Print the value age refers to right now: 13." },
    {
      line: 3,
      vars: { age: int(13) },
      evaluation: ["age + 1", "13 + 1", "14"],
      output: ["13"],
      note: "Line 3, right side first. Python looks up age (still 13) and adds 1. The result is a new value, 14. age hasn't changed yet.",
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
  description: "How a program remembers information, and what Python does when you write name = value.",
  status: "published",
  objectives: [
    "Explain why programs need a way to remember values.",
    "Describe the two steps Python takes for an assignment like `age = 13`.",
    "Predict what a variable refers to after it's been reassigned.",
    "Spot and fix the most common variable mistakes.",
  ],
  references: [
    "concept.variable",
    "python.operators.assignment",
    "python.operators.addition",
    "python.types.int",
    "python.types.str",
    "python.errors.NameError",
  ],
  sections: [
    {
      id: "why",
      title: "A program that needs to remember",
      blocks: [
        {
          type: "text",
          text: "You're building the sign-up page for a games website. A new player types in their age: 13.",
        },
        {
          type: "text",
          text: "The site needs that number again and again. It decides which games the player can see, shows the age on their profile, and wishes them a happy birthday next year.",
        },
        {
          type: "text",
          text: "Python runs one instruction at a time, though. Once the instruction that read the age has finished, how does the program hold on to 13 for later? It needs a way to **remember** a value and find it again. That's what variables are for.",
        },
      ],
    },
    {
      id: "what-is-a-variable",
      title: "Names that refer to values",
      blocks: [
        {
          type: "text",
          text: "A [variable](ref:concept.variable) is a name that refers to a value. You choose the name. Python remembers which value the name refers to, and whenever your code uses the name, Python uses that value.",
        },
        {
          type: "figure",
          caption: "Two variables. Each name points to the value it refers to. The type label shows what kind of value it is: a whole number (`int`) or text (`str`).",
          figure: {
            kind: "names",
            bindings: [
              { name: "age", value: int(13) },
              { name: "player", value: str("Ada") },
            ],
          },
        },
        {
          type: "callout",
          tone: "real-world",
          title: "Like a name tag",
          text: "A variable works like a name tag stuck on a value. The tag lets you find the value later. You can move the tag to a different value, and the value it used to be on doesn't get a label any more.",
        },
      ],
    },
    {
      id: "creating",
      title: "Creating a variable",
      blocks: [
        {
          type: "text",
          text: "You create a variable with an **assignment**: a name, the `=` sign, and a value.",
        },
        {
          type: "code",
          language: "python",
          code: assignWalkthrough.code,
          output: ["13"],
          highlightLines: [1],
          caption: "Line 1 is the assignment. Line 2 uses the variable.",
          walkthrough: assignWalkthrough,
        },
        {
          type: "text",
          text: "The `=` sign is the [assignment operator](ref:python.operators.assignment). Python always handles an assignment in two steps:",
        },
        {
          type: "list",
          ordered: true,
          items: ["Work out the value on the **right** side.", "Make the name on the **left** refer to that value."],
        },
        {
          type: "text",
          text: "So read `age = 13` as \"set age to 13\". In maths, `=` says two things are equal. In Python, it's an instruction to do something.",
        },
      ],
    },
    {
      id: "reading",
      title: "Using a variable",
      blocks: [
        {
          type: "text",
          text: "Once a variable exists, you can use its name anywhere you'd use the value. Python looks up the value at the moment the line runs.",
        },
        {
          type: "code",
          language: "python",
          code: `age = 13
print(age + 1)
print(age)`,
          output: ["14", "13"],
          highlightLines: [2],
          caption: "Line 2 uses `age` to work out a new value. It doesn't change what `age` refers to.",
        },
        {
          type: "callout",
          tone: "careful",
          title: "age or \"age\"?",
          text: "`print(age)` prints `13`: without quotes, `age` is a name, so Python looks up its value. `print(\"age\")` prints the word `age`: with quotes, it's a string, and Python uses the text as it is.",
        },
      ],
    },
    {
      id: "changing",
      title: "Changing a variable",
      blocks: [
        {
          type: "text",
          text: "A year later the player has a birthday. The program doesn't need a second variable. It can make the same name refer to a new value.",
        },
        {
          type: "code",
          language: "python",
          code: birthdayWalkthrough.code,
          output: ["13", "14"],
          highlightLines: [3],
          caption: "Walk through this one. Line 3 happens in two steps.",
          walkthrough: birthdayWalkthrough,
        },
        {
          type: "text",
          text: "In maths, `age = age + 1` is impossible. In Python it's normal, because of the two steps. First Python works out `age + 1` using the value `age` refers to **now**: 13 + 1 is 14. Then it makes `age` refer to 14.",
        },
        {
          type: "figure",
          caption: "After line 3, `age` refers to 14. Nothing refers to 13 any more, so Python can throw it away.",
          figure: { kind: "names", bindings: [{ name: "age", value: int(14), previous: int(13) }] },
        },
        {
          type: "callout",
          tone: "other-languages",
          title: "In Java",
          text: "Java asks you to say what type a variable holds when you create it, like `int age = 13;`. After that, `age` can only refer to whole numbers. Python doesn't ask, though keeping one kind of value per name still makes code easier to follow.",
        },
      ],
    },
    {
      id: "mistakes",
      title: "Common mistakes",
      blocks: [
        {
          type: "text",
          text: "These four slips cause most early variable bugs. Each one makes Python stop with an error or print something you didn't expect.",
        },
        {
          type: "list",
          items: [
            "**Using a name before creating it.** Python runs from the top, so the assignment has to come first.",
            "**Changing a capital letter.** `age` and `Age` are different names. Python stops with a [NameError](ref:python.errors.NameError).",
            "**Putting quotes around a name.** `print(\"age\")` prints the word, not the value.",
            "**Writing it backwards.** `13 = age` is an error. The name always goes on the left.",
          ],
        },
        {
          type: "question",
          id: "debug-name-case",
          variant: "debug",
          prompt: "This program stopped with an error. What's the problem?",
          code: `age = 13
print(Age)`,
          errorOutput: `Traceback (most recent call last):
  File "main.py", line 2, in <module>
    print(Age)
NameError: name 'Age' is not defined. Did you mean: 'age'?`,
          choices: [
            { id: "case", text: "Names are case-sensitive: `Age` and `age` are different names" },
            {
              id: "quotes",
              text: "`Age` needs quotes around it",
              feedback:
                "With quotes, Python would print the word Age instead of the number 13. The program wants the value. Read the last line of the error again.",
            },
            {
              id: "numbers",
              text: "`print()` can't show numbers",
              feedback: "`print()` shows numbers fine. The error is about a name. Which name, and does it match the one on line 1?",
            },
          ],
          answer: "case",
          explanation:
            "Line 1 created `age` (lowercase). Line 2 asked for `Age`, and nothing with that exact name exists, so Python stops with a NameError and suggests the name you probably meant. The fix is `print(age)`.",
        },
        {
          type: "reflect",
          id: "reflect-use-before-create",
          prompt: "This program also stops with a NameError, on line 1. The variable is created right there on line 2. Why doesn't Python find it?",
          code: `print(score)
score = 10`,
          answer:
            "When Python runs line 1, it hasn't reached line 2 yet, so the name `score` doesn't exist. Python doesn't look ahead. A variable only exists from the moment its assignment runs, so assign first and use it after.",
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
          text: "Before you check an answer, say what each variable refers to after every line. When your prediction is wrong, you've found the exact idea worth looking at again.",
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
            {
              id: "10",
              text: "`10`",
              feedback: "That was the value before line 2. Line 2 is an assignment too. What does `score` refer to after it runs?",
            },
            { id: "15", text: "`15`" },
            {
              id: "text",
              text: "`score + 5`",
              feedback: "There are no quotes on line 3, so Python prints a value, not text. Work out what `score` refers to by then.",
            },
            {
              id: "error",
              text: "An error, because `score` can't use itself",
              feedback:
                "It can. Remember the two steps: Python works out the right side first, while `score` still refers to its old value.",
            },
          ],
          answer: "15",
          hint: "Line 2: work out the right side using the value `score` refers to before the line runs.",
          explanation:
            "Line 2 works out the right side first, using the current value: 10 + 5 is 15. Then `score` refers to 15, and line 3 prints it.",
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
          context: "A game needs to remember a player's name and level, and the level goes up as they play.",
          prompt: "Create a variable `player` that refers to a name and a variable `level` set to `1`. The player levels up, so increase `level` by 1. Then print both.",
          checklist: [
            "`player` refers to some text, in quotes.",
            "`level` starts at `1` and is increased using its old value.",
            "The program prints the name and then `2`.",
          ],
          hints: [
            "Text needs quotes. Numbers don't.",
            "To level up, use the old value on the right side of an assignment.",
            "The level-up line is `level = level + 1`.",
          ],
          solution: `player = "Ada"
level = 1
level = level + 1
print(player)
print(level)`,
          solutionNote:
            "Line 3 works out `level + 1` while `level` still refers to 1, then moves `level` to 2. The prints come last, so they show the values after the level-up.",
          alternatives: [
            {
              code: `player = "Ada"
level = 1
level = 2
print(player)
print(level)`,
              note: "This prints the same thing, but it only works because you already know the level is 1. `level = level + 1` works for any starting level, which is what a real game needs.",
            },
          ],
        },
      ],
    },
  ],
};
