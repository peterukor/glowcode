import type { Lesson } from "@/courses/types";
import type { CalcEvent, Walkthrough } from "@/types/trace";
import { buildSteps, py } from "@/walkthrough/build";

const tenCalc = (phase: CalcEvent["phase"]): CalcEvent => ({ target: "score", parts: [{ code: "10" }], result: "10", phase });

const scoreAssignment: Walkthrough = {
  id: "py-score-assignment",
  title: "score = 10",
  language: "python",
  visualizations: ["variables"],
  code: `score = 10
print(score)`,
  steps: buildSteps([
    { line: 1, calc: tenCalc("calculate"), note: "Right side first: the value is 10. The name score doesn't exist yet." },
    { line: 1, set: { score: py.int(10) }, highlight: "score", calc: tenCalc("assign"), note: "Then the left side: Python creates the name score and makes it refer to 10." },
    { line: 2, print: ["10"], note: "score has no quotes, so Python looks up its value and print() shows 10." },
  ]),
};

/** Chapter 2, lesson 3: what `=` does, and the rules for names. */
export const creatingVariables: Lesson = {
  id: "creating-variables",
  title: "Creating Variables with Assignment",
  description: "What Python does when it runs name = value, why = isn't equality, and how to choose names Python accepts.",
  status: "published",
  objectives: [
    "Identify the name, the `=` and the value in an assignment.",
    "Explain why `=` in Python is an instruction, not a statement that two things are equal.",
    "Decide whether a variable name is valid, and fix one that isn't.",
    "Choose names that say what the value means.",
  ],
  references: ["python.operators.assignment", "concept.variable", "python.errors.SyntaxError"],
  sections: [
    {
      id: "why",
      title: "You choose the name",
      blocks: [
        {
          type: "text",
          text: "Every variable you create needs a name, and you choose it. Good names make a program read almost like a sentence; poor ones make it a puzzle. But Python has a few firm rules about what counts as a name, and breaking one stops the program before it runs. This lesson covers how assignment works and what those rules are.",
        },
      ],
    },
    {
      id: "assignment",
      title: "What score = 10 does",
      blocks: [
        {
          type: "code",
          language: "python",
          code: scoreAssignment.code,
          output: ["10"],
          caption: "Walk through it: the value comes first, then the name.",
          walkthrough: scoreAssignment,
        },
        {
          type: "list",
          items: [
            "`score` is the **name**. It always goes on the left.",
            "`=` is the [assignment operator](ref:python.operators.assignment). It tells Python to make the name on the left refer to a value.",
            "`10` is the **value**: whatever is on the right, worked out first.",
          ],
        },
        {
          type: "text",
          text: "So Python handles every assignment in the same two steps: work out the right side, then make the name on the left refer to the result. If the name doesn't exist yet, this creates it.",
        },
      ],
    },
    {
      id: "not-equality",
      title: "= is not \"equals\"",
      blocks: [
        {
          type: "text",
          text: "In maths, `x = 5` states a fact: x and 5 are equal, both ways round. In Python, `score = 10` is an **instruction**: \"make `score` refer to 10.\" It has a direction, from right to left, so you can't swap the sides.",
        },
        {
          type: "callout",
          tone: "tip",
          text: "Read `score = 10` aloud as \"score is set to 10\" or \"score gets 10\", never \"score equals 10\". Python checks whether two things are equal with a different operator, `==`, which you'll meet in Chapter 4.",
        },
        {
          type: "question",
          id: "debug-backwards-assignment",
          variant: "debug",
          prompt: "A student wanted `score` to refer to 10 and wrote it the maths way round. Why does Python reject it?",
          code: `10 = score`,
          errorOutput: `  File "main.py", line 1
    10 = score
    ^^
SyntaxError: cannot assign to literal here. Maybe you meant '==' instead of '='?`,
          choices: [
            {
              id: "undefined",
              text: "`score` hasn't been created yet",
              feedback: "That would be a NameError when the line runs. This is a SyntaxError: Python refused the line before running anything. Look at what's on the left of `=`.",
            },
            { id: "left", text: "The name must be on the left of `=`; you can't make `10` refer to something" },
            {
              id: "spaces",
              text: "There shouldn't be spaces around `=`",
              feedback: "Spaces around `=` are optional and recommended. The arrows point at the `10`.",
            },
          ],
          answer: "left",
          explanation:
            "`=` makes the name on its left refer to the value on its right. `10` is a value, not a name, so Python can't make it refer to anything. The fix is `score = 10`.",
        },
      ],
    },
    {
      id: "naming-rules",
      title: "Rules for names",
      blocks: [
        {
          type: "list",
          items: [
            "Use only **letters, digits and underscores** (`_`). No spaces, hyphens or other symbols.",
            "Don't **start with a digit**: `player2` is fine, `2player` isn't.",
            "Names are **case-sensitive**: `score`, `Score` and `SCORE` are three different names.",
            "Don't use Python's **keywords**, words the language reserves for itself, such as `if`, `for`, `class`, `True` and `None`.",
          ],
        },
        {
          type: "text",
          text: "Breaking one of these rules is a [SyntaxError](ref:python.errors.SyntaxError): Python can't read the program, so none of it runs.",
        },
        {
          type: "question",
          id: "predict-valid-name",
          variant: "predict",
          prompt: "Which of these is a valid variable name?",
          choices: [
            {
              id: "digit",
              text: "`2nd_player`",
              feedback: "Digits are allowed, but not as the first character. Python reads a leading digit as the start of a number.",
            },
            {
              id: "hyphen",
              text: "`second-player`",
              feedback: "Python reads `-` as minus, so this looks like `second` minus `player`. Use an underscore instead.",
            },
            { id: "valid", text: "`second_player`" },
            {
              id: "keyword",
              text: "`class`",
              feedback: "`class` is one of Python's keywords; it already means something in the language, so it can't be a name.",
            },
          ],
          answer: "valid",
          hint: "Check each one against the four rules: allowed characters, first character, keywords.",
          explanation: "`second_player` uses only letters and an underscore, doesn't start with a digit and isn't a keyword.",
        },
        {
          type: "question",
          id: "debug-name-with-space",
          variant: "debug",
          prompt: "Why does Python reject this line?",
          code: `my score = 10`,
          errorOutput: `  File "main.py", line 1
    my score = 10
       ^^^^^
SyntaxError: invalid syntax`,
          choices: [
            { id: "space", text: "A name can't contain a space; Python sees two names, `my` and `score`" },
            {
              id: "keyword",
              text: "`score` is a keyword",
              feedback: "`score` isn't a keyword; you've used it as a name all lesson. Why might Python be confused about where the name ends?",
            },
            {
              id: "value",
              text: "`10` should be in quotes",
              feedback: "`10` without quotes is a perfectly good int. The arrows point earlier in the line.",
            },
          ],
          answer: "space",
          explanation: "A space ends a name. Python reads `my`, then a second name `score` straight after it, which isn't valid code. Use `my_score` instead.",
        },
      ],
    },
    {
      id: "good-names",
      title: "Names that explain themselves",
      blocks: [
        {
          type: "text",
          text: "Python accepts `x = 9.99`, but a reader has to guess what `x` means. `price = 9.99` says it. Choose names that describe the value, and join words with underscores: `total_price`, `player_name`, `is_ready`. This style, called **snake_case**, is the convention Python programmers use for variables.",
        },
      ],
    },
    {
      id: "practice",
      title: "Your turn",
      blocks: [
        {
          type: "practice",
          id: "practice-fix-names",
          context: "A classmate's program won't run, and its names don't say much either.",
          prompt: "Rewrite these three lines with valid, descriptive snake_case names, then print all three variables: `1st name = \"Ada\"`, `Class = \"6B\"`, `x = 12`. The third one is the student's age.",
          checklist: [
            "No name starts with a digit or contains a space.",
            "Each name says what its value means.",
            "Words are joined with underscores.",
          ],
          hints: ["`Class` with a capital C is actually allowed, but it's easy to confuse with the keyword `class`.", "Something like `first_name`, `class_name` and `age` works."],
          solution: `first_name = "Ada"
class_name = "6B"
age = 12

print(first_name)
print(class_name)
print(age)`,
          solutionNote:
            "`1st name` broke two rules (a leading digit and a space). `Class` was technically valid but confusing next to the keyword `class`, and `x` gave no clue that it was an age.",
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
            "`name = value`: Python works out the value, then makes the name refer to it.",
            "`=` is an instruction with a direction, not \"equals\". The name always goes on the left.",
            "Names use letters, digits and underscores, can't start with a digit, can't be keywords, and are case-sensitive.",
            "Descriptive snake_case names like `total_price` make programs easier to read.",
          ],
        },
      ],
    },
  ],
};
