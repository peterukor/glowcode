import type { Lesson } from "@/courses/types";
import type { Walkthrough } from "@/types/trace";
import { buildSteps, py } from "@/walkthrough/build";

const readVariables: Walkthrough = {
  id: "py-read-variables",
  title: "Looking up two variables",
  language: "python",
  visualizations: ["variables"],
  code: `name = "Ada"
age = 18

print(name)
print(age)`,
  steps: buildSteps([
    { line: 1, set: { name: py.str("Ada") }, highlight: "name", note: "name now refers to the string \"Ada\"." },
    { line: 2, set: { age: py.int(18) }, highlight: "age", note: "age now refers to the int 18. Two names, two values." },
    {
      line: 4,
      print: ["Ada"],
      note: "print(name): no quotes, so Python looks up name and finds \"Ada\". print() shows Ada. name itself doesn't change.",
    },
    { line: 5, print: ["18"], note: "print(age): Python looks up age and finds 18. Looking a value up never changes it." },
  ]),
};

/**
 * Chapter 2, lesson 4: reading a variable's current value. debug-name-case and
 * reflect-use-before-create come from the Phase 3 variables lesson (ids kept).
 */
export const usingVariables: Lesson = {
  id: "using-variables",
  title: "Using Variables in Programs",
  description: "How Python looks up a variable's value, why quotes change everything, and what a NameError means.",
  status: "published",
  objectives: [
    "Explain what Python does when a line uses a variable's name.",
    "Tell the difference between `print(name)` and `print(\"name\")`.",
    "Use variables in calculations and in `print()` with other values.",
    "Fix a NameError caused by a misspelled name or a name used too early.",
  ],
  references: ["concept.variable", "python.builtins.print", "python.errors.NameError"],
  sections: [
    {
      id: "why",
      title: "A name is only useful if you use it",
      blocks: [
        {
          type: "text",
          text: "Creating a variable is only half the job. The point is to use it later: print it, calculate with it, combine it with other values. Each time a line uses a variable's name, Python has to work out which value you mean.",
        },
      ],
    },
    {
      id: "looking-up",
      title: "Python looks up the value",
      blocks: [
        {
          type: "code",
          language: "python",
          code: readVariables.code,
          output: ["Ada", "18"],
          caption: "Walk through it and watch which value each name refers to when it's used.",
          walkthrough: readVariables,
        },
        {
          type: "text",
          text: "When a line uses a name without quotes, Python **looks it up**: it finds the value the name refers to right now and uses that value in its place. `print(name)` runs exactly as if you'd written `print(\"Ada\")`. Looking a value up never changes it.",
        },
        {
          type: "question",
          id: "predict-name-vs-text",
          variant: "predict",
          prompt: "What does line 2 print?",
          code: `name = "Ada"
print("name")
print(name)`,
          choices: [
            {
              id: "ada",
              text: "`Ada`",
              feedback: "That's what line 3 prints. Look carefully at line 2: what's around `name` there?",
            },
            { id: "word", text: "`name`" },
            {
              id: "quoted",
              text: "`\"name\"`",
              feedback: "The quotes make a string, but `print()` never shows a string's quotes.",
            },
          ],
          answer: "word",
          hint: "Quotes make a string. A string is printed exactly as it's written.",
          explanation:
            "On line 2, `\"name\"` is in quotes, so it's just the four letters n-a-m-e, and Python prints them. On line 3, `name` has no quotes, so Python looks it up and prints `Ada`.",
        },
      ],
    },
    {
      id: "in-expressions",
      title: "Variables in calculations and sentences",
      blocks: [
        {
          type: "text",
          text: "A variable can go anywhere its value could. In a calculation, Python looks up the value and uses it. Using a variable this way doesn't change what it refers to:",
        },
        {
          type: "code",
          language: "python",
          code: `age = 18
print(age + 1)
print(age)`,
          output: ["19", "18"],
          highlightLines: [2],
          caption: "Line 2 works out `18 + 1` and prints 19. `age` still refers to 18.",
        },
        {
          type: "text",
          text: "With commas, `print()` can mix variables and text into one line of output:",
        },
        {
          type: "code",
          language: "python",
          code: `name = "Ada"
age = 18
print(name, "is", age)`,
          output: ["Ada is 18"],
        },
      ],
    },
    {
      id: "name-errors",
      title: "When Python can't find a name",
      blocks: [
        {
          type: "text",
          text: "If a line uses a name that doesn't exist, Python can't look it up, so it stops with a [NameError](ref:python.errors.NameError). The last line of the message names the missing name, and often suggests the one you meant.",
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
          ^^^
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
          type: "question",
          id: "debug-misspelled-variable",
          variant: "debug",
          prompt: "A typo slipped in. Which change fixes the program?",
          code: `score = 10
print(scroe)`,
          errorOutput: `Traceback (most recent call last):
  File "main.py", line 2, in <module>
    print(scroe)
          ^^^^^
NameError: name 'scroe' is not defined. Did you mean: 'score'?`,
          choices: [
            {
              id: "create",
              text: "Add `scroe = 10` before line 2",
              feedback: "That would run, but now the program has two names for one idea, and the typo is still there. What did the programmer mean to write?",
            },
            { id: "fix", text: "Change `scroe` on line 2 to `score`" },
            {
              id: "quotes",
              text: "Write `print(\"scroe\")`",
              feedback: "That prints the word scroe instead of the score's value. The program should print 10.",
            },
          ],
          answer: "fix",
          explanation: "The name was created as `score` but used as `scroe`. Python treats them as unrelated names. Spelling it the same both times fixes it, and Python's \"Did you mean\" pointed straight at it.",
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
      id: "practice",
      title: "Your turn",
      blocks: [
        {
          type: "practice",
          id: "practice-profile-card",
          context: "A profile page shows a few facts about a player, and works out their age next year.",
          prompt: "Create variables `player` (a name), `age` (a whole number) and `city` (text). Print three lines: the player's name and city in one sentence, their age, and their age next year using `age + 1`.",
          checklist: [
            "Each fact is assigned once, before it's used.",
            "The `print()` lines use the names without quotes.",
            "The age next year is calculated, not typed in.",
          ],
          hints: ["`print(player, \"lives in\", city)` makes a sentence from three values.", "Use `print(\"Next year:\", age + 1)` for the last line."],
          solution: `player = "Ada"
age = 18
city = "Accra"

print(player, "lives in", city)
print("Age:", age)
print("Next year:", age + 1)`,
          solutionNote: "Every use of a name is a lookup. `age + 1` uses 18 to work out 19 for printing; `age` itself still refers to 18 afterwards.",
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
            "A name without quotes is looked up: Python uses the value it refers to right now.",
            "`print(name)` prints the value; `print(\"name\")` prints the word.",
            "Using a variable in a calculation doesn't change it.",
            "A **NameError** means Python can't find the name: check the spelling, the capitals, and that it was assigned first.",
          ],
        },
      ],
    },
  ],
};
