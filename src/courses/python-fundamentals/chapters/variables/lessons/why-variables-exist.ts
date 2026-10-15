import type { Lesson } from "@/courses/types";
import type { Walkthrough } from "@/types/trace";
import { buildSteps, py } from "@/walkthrough/build";

const welcomeName: Walkthrough = {
  id: "py-welcome-name",
  title: "One name, used three times",
  language: "python",
  visualizations: ["variables"],
  code: `name = "Ada"

print("Welcome,", name)
print(name, "your score is ready.")
print("Good luck,", name)`,
  steps: buildSteps([
    {
      line: 1,
      set: { name: py.str("Ada") },
      highlight: "name",
      note: "Python makes the string \"Ada\", then makes the name name refer to it. Nothing is printed yet.",
    },
    {
      line: 3,
      print: ["Welcome, Ada"],
      note: "name has no quotes, so Python looks up what it refers to: \"Ada\". print() shows its two values with a space between them.",
    },
    {
      line: 4,
      print: ["Ada your score is ready."],
      note: "Python looks up name again and gets the same value. print() shows \"Ada\", a space, then the text.",
      checkpoint: {
        prompt: "Line 3 printed `Welcome, Ada`. What will line 4, `print(name, \"your score is ready.\")`, add to the output?",
        choices: [
          { id: "value", text: "`Ada your score is ready.`" },
          {
            id: "word",
            text: "`name your score is ready.`",
            feedback: "`name` has no quotes around it here. Does Python print it as a word, or look up the value it refers to?",
          },
          {
            id: "comma",
            text: "`Ada, your score is ready.`",
            feedback: "The comma in the code separates the two values given to `print()`. Look at line 3's output: did its comma appear on screen?",
          },
        ],
        answer: "value",
        explanation: "Without quotes, `name` is looked up: `\"Ada\"`. The comma only separates the two values in the code; `print()` puts a space between them.",
      },
    },
    { line: 5, print: ["Good luck, Ada"], note: "A third use of the same name. If line 1 said \"Grace\", all three lines would say Grace." },
  ]),
};

/**
 * Chapter 2, lesson 1 (Phase 3's "Why Do Variables Exist?", rewritten in Phase 7; id kept).
 * Its other activities moved to the lessons that now teach them: debug-name-case and
 * reflect-use-before-create to "Using Variables", predict-score, reflect-earlier-print and
 * practice-player-level to "Reassignment".
 */
export const whyVariablesExist: Lesson = {
  id: "why-variables-exist",
  title: "Why Do We Need Variables?",
  description: "Give a value a name once, then use the name wherever the value is needed.",
  status: "published",
  objectives: [
    "Explain the problem that repeating the same value causes.",
    "Describe a variable as a name that refers to a value.",
    "Read a program that uses a variable and say what each line prints.",
    "Change a program's behaviour by changing one assignment.",
  ],
  references: ["concept.variable", "python.operators.assignment", "python.builtins.print", "python.types.str"],
  sections: [
    {
      id: "why",
      title: "The same name, three times",
      blocks: [
        {
          type: "text",
          text: "Here's a short program that greets a player called Ada:",
        },
        {
          type: "code",
          language: "python",
          code: `print("Welcome, Ada!")
print("Ada, your score is ready.")
print("Good luck, Ada!")`,
          output: ["Welcome, Ada!", "Ada, your score is ready.", "Good luck, Ada!"],
        },
        {
          type: "text",
          text: "It works. Now a different player, Grace, signs in. You'd have to find and change `Ada` in three places, and if you miss one, Grace is told \"Good luck, Ada!\". A real game mentions the player's name dozens of times. Copying the same value everywhere makes every change slow and easy to get wrong.",
        },
        {
          type: "text",
          text: "What the program needs is a way to write the player's name **once** and refer to it everywhere else.",
        },
      ],
    },
    {
      id: "give-it-a-name",
      title: "Give the value a name",
      blocks: [
        {
          type: "code",
          language: "python",
          code: welcomeName.code,
          caption: "Walk through it: watch the name being created, then looked up on each line.",
          walkthrough: welcomeName,
        },
        {
          type: "list",
          items: [
            "**Line 1** creates a [variable](ref:concept.variable): the name `name` now refers to the string `\"Ada\"`. Nothing appears on the screen.",
            "**Lines 3–5** use the name without quotes. Each time, Python looks up the value `name` refers to and uses that.",
            "`print()` can be given several values separated by commas. It shows them in order, with a space between each one, so you don't type the space yourself.",
          ],
        },
        {
          type: "text",
          text: "To greet Grace instead, you change line 1 to `name = \"Grace\"` and nothing else. The value lives in one place, so it can only be wrong in one place.",
        },
      ],
    },
    {
      id: "names-and-values",
      title: "Names that refer to values",
      blocks: [
        {
          type: "text",
          text: "A **variable** is a name that refers to a value. You choose the name; Python remembers which value it refers to. The value isn't stored *inside* the name. The name points to it, and Python follows that link whenever the name is used.",
        },
        {
          type: "figure",
          caption: "After line 1: the name `name` refers to the string `\"Ada\"`.",
          figure: { kind: "names", bindings: [{ name: "name", value: py.str("Ada") }] },
        },
        {
          type: "callout",
          tone: "real-world",
          title: "Like a name tag",
          text: "A variable works like a name tag stuck on a value. The tag lets you find the value later, and it can be moved to a different value. You'll see that happen in lesson 5.",
        },
        {
          type: "question",
          id: "predict-change-name",
          variant: "predict",
          prompt: "Only line 1 has changed. What is the **first** line this program prints?",
          code: `name = "Grace"

print("Welcome,", name)
print(name, "your score is ready.")
print("Good luck,", name)`,
          choices: [
            {
              id: "ada",
              text: "`Welcome, Ada`",
              feedback: "Line 3 doesn't contain `Ada` any more; it contains `name`. What does `name` refer to in this version?",
            },
            { id: "grace", text: "`Welcome, Grace`" },
            {
              id: "word",
              text: "`Welcome, name`",
              feedback: "`name` isn't in quotes on line 3, so Python treats it as a name and looks up its value.",
            },
          ],
          answer: "grace",
          explanation:
            "Line 3 doesn't say who to welcome; it says \"whatever `name` refers to\". Line 1 now makes `name` refer to `\"Grace\"`, so every line that uses the name greets Grace.",
        },
      ],
    },
    {
      id: "practice",
      title: "Your turn",
      blocks: [
        {
          type: "practice",
          id: "practice-city-postcard",
          context: "A travel app prints three lines about the city you're visiting. The city should be written only once.",
          prompt: "Create a variable `city` that refers to `\"Lagos\"`. Then print three lines that each use `city`: a welcome, a weather line and a goodbye.",
          checklist: [
            "`\"Lagos\"` appears once, on the assignment line.",
            "Each `print()` uses `city` without quotes.",
            "Changing the first line to another city changes all three printed lines.",
          ],
          hints: ["Start with `city = \"Lagos\"`.", "Give `print()` two values, like `print(\"Welcome to\", city)`."],
          solution: `city = "Lagos"

print("Welcome to", city)
print("It's sunny in", city)
print("Goodbye from", city)`,
          solutionNote:
            "Try changing line 1 to `\"Nairobi\"`: all three lines change, and you only edited one place. That's the job a variable does.",
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
            "Repeating the same value in many places makes changes slow and mistakes likely.",
            "A **variable** is a name that refers to a value. `name = \"Ada\"` creates one.",
            "Using the name without quotes makes Python look up its value at that moment.",
            "`print()` can show several values separated by commas, with a space between each.",
          ],
        },
      ],
    },
  ],
};
