# Lesson Authoring Guide

How to add a lesson to Glowcode. This file covers the mechanics; for what makes a lesson
good, read [`TEACHING_GUIDELINES.md`](./TEACHING_GUIDELINES.md). Lessons are TypeScript data.
You never write a component, a route or a page to add one.

Only the site owner adds content. Content lives in the repository and ships with the app.

## 1. Where to create a lesson file

```
src/courses/<course-id>/
  course.ts                              the course and its chapter list
  chapters/<chapter-id>/
    chapter.ts                           the chapter and its lesson list
    lessons/<lesson-id>.ts               one file per lesson
```

1. Create `lessons/<lesson-id>.ts` exporting a `Lesson` (see the example below).
2. Import it in the chapter's `chapter.ts` and add it to `lessons`. Array order is display order.
3. For a new chapter, create `chapter.ts` and add the chapter to the course's `chapters`.

Courses are independent. A lesson can be added to any course, in any order, without touching
other courses. Nothing enforces prerequisites between them.

## 2. Assigning stable ids

Ids are lowercase words joined by dashes: `why-variables-exist`, `predict-score`. They appear
in URLs and in students' saved progress, so **never change an id once a lesson is published**.
Rename the title freely; keep the id.

| What | Unique within | Example |
| --- | --- | --- |
| course, chapter | the app / its course | `python-fundamentals`, `variables` |
| lesson | its course | `why-variables-exist` |
| section | its lesson (also the page anchor `#id`) | `changing` |
| activity (`question`, `reflect`, `practice`) | its lesson | `debug-name-case` |
| walkthrough | the whole app | `py-birthday` |
| choice | its question | `case` |

Prefix activity ids with what they are (`predict-`, `debug-`, `reflect-`, `practice-`). Prefix
walkthrough ids with the language (`py-`, `java-`).

## 3. Defining sections

A lesson is a list of sections, and each section is a titled list of blocks:

```ts
{ id: "changing", title: "Changing a variable", blocks: [ /* … */ ] }
```

Sections follow the teaching journey (problem, concept, example, execution, practice,
debugging) but don't need to match it one to one. Most lessons have four to eight. The first is
usually the problem, with the id `why`.

## 4. Paragraphs and lists

```ts
{ type: "text", text: "A [variable](ref:concept.variable) is a name that refers to a value." }
{ type: "list", ordered: true, items: ["Work out the right side.", "Make the name refer to it."] }
```

Text uses a tiny inline markup: `` `code` ``, `**bold**` and `[label](ref:reference.id)`.
Keep paragraphs to four sentences or fewer.

Callouts are for the occasional aside, at most one or two per section:

```ts
{ type: "callout", tone: "careful", title: "age or \"age\"?", text: "…" }
```

Tones: `real-world`, `execution`, `mindset`, `tip`, `careful`, `other-languages`. Untitled
callouts get a label from their tone ("How Python runs this", "Think like a programmer").

Figures are static illustrations. Introduce them in the text and always caption them:

```ts
{ type: "figure", caption: "…", figure: { kind: "names", bindings: [{ name: "age", value: { type: "int", value: 14 }, previous: { type: "int", value: 13 } }] } }
{ type: "figure", caption: "…", figure: { kind: "sequence", steps: ["Read line 1", "Run it", "Move to line 2"] } }
```

`names` draws names pointing at values (with an optional faded previous value), `sequence`
draws ordered steps, and `variables` reuses the walkthrough's variable boxes.

## 5. Code examples

```ts
{
  type: "code",
  language: "python",
  code: `age = 13
print(age + 1)`,
  output: ["14"],          // printed output only, line by line
  highlightLines: [2],     // the line the text talks about
  caption: "Using `age` doesn't change it.",
}
```

Code is read-only: there is no editor and nothing runs. `output` must be exactly what the code
prints when run. Never put a function's return value in `output` (see the guidelines on output
versus return values).

## 6. Associating a walkthrough

Add `walkthrough` to a code block to show a "Walk through code" button that expands the
step-by-step player in place. Without one, no button appears.

Define the walkthrough above the lesson and reuse its `code` in the block, so the two can't
drift apart (validation also checks they match):

```ts
const birthday: Walkthrough = { id: "py-birthday", title: "…", language: "python", visualizations: ["variables"], code: `…`, steps: [ … ] };
// …
{ type: "code", language: "python", code: birthday.code, output: ["13", "14"], walkthrough: birthday }
```

Each step records the **state after** that step:

- `line`: the 1-indexed line running. A line can take several steps (`age = age + 1` takes
  two: working out the right side, then the assignment).
- `vars`: every variable after the step. `highlight` names the one that changed.
- `output`: everything printed **so far**, not just this step.
- `evaluation`: optional stages of an expression, like `["age + 1", "13 + 1", "14"]`.
- `returned`: optional value a function handed back, drawn apart from printed output.
- `note`: one or two short sentences on what happened.

Check every step by hand against a real run. The player shows exactly what you write.

## 7. Prediction and debugging activities

```ts
{
  type: "question",
  id: "predict-score",
  variant: "predict",                 // or "debug"
  prompt: "What does this program print?",
  code: `score = 10
score = score + 5
print(score)`,
  choices: [
    { id: "10", text: "`10`", feedback: "That was the value before line 2. What does line 2 do?" },
    { id: "15", text: "`15`" },
  ],
  answer: "15",
  hint: "Work out the right side of line 2 first.",
  explanation: "Line 2 works out 10 + 5 first, then `score` refers to 15.",
}
```

- `feedback` on a wrong choice explains the misunderstanding without giving the answer. The
  student can then try again; a "Show the answer" option appears after the first wrong try.
- `explanation` is shown when the student gets it right or reveals it. Explain **why**.
- For debug questions, put Python's real error message in `errorOutput`.

For an open question with no options, use a `reflect` block. The student thinks it through,
then compares with your explanation:

```ts
{ type: "reflect", id: "reflect-use-before-create", prompt: "Why doesn't Python find the variable?", code: `print(score)
score = 10`, answer: "…" }
```

## 8. Practice activities

```ts
{
  type: "practice",
  id: "practice-player-level",
  context: "A game needs to remember a player's level.",       // optional background
  prompt: "Create `level` set to 1, increase it by 1, then print it.",
  checklist: ["`level` is increased using its old value."],     // for self-checking
  hints: ["Use the old value on the right side."],             // shown one at a time
  solution: `level = 1
level = level + 1
print(level)`,
  solutionNote: "Why the solution works.",
  alternatives: [{ note: "Another valid approach, and when to prefer it.", code: "…" }],
}
```

Students solve practice on paper or in their own editor. Glowcode doesn't run or check their
code, so never write a prompt that implies it will. The sample solution sits behind a short
"have you tried it?" step.

## 9. Linking to reference entries

Reference entries live in `src/references/registry.ts`, with ids like
`concept.variable`, `python.builtins.print` and `python.types.str`.

- Link inline, the first time a term appears: `[string](ref:python.types.str)`.
- List the entries worth looking up in the lesson's `references` array. They appear under
  "Look it up" at the end of the lesson.
- If an entry doesn't exist yet, add one to the registry (id, title, category, a one or two
  sentence summary). The full manual pages arrive later and reuse the same ids.

## 10. Publishing or drafting a lesson

| `status` | Students see it? | Can open it? |
| --- | --- | --- |
| `draft` | no | no, not even by URL |
| `coming-soon` | yes, marked "Soon" | no |
| `published` | yes | yes |

Start with `draft`. Switch to `published` after you've reviewed it against the checklist in
the teaching guidelines. A course that isn't `published` hides all its lessons.

## 11. Validating the lesson

```
bun run test        # includes validateCourses: ids, references, answers, walkthroughs
bun run typecheck   # the lesson matches the content types
bun run lint
bun run dev         # read it in the browser, on a narrow window too
```

`validateCourses` (in `src/courses/queries.ts`) fails the test run on duplicate or badly
formed ids, unknown reference ids, an `answer` that isn't one of the choices, duplicate choice
ids, highlighted lines that don't exist, walkthrough code that differs from the code shown, and
walkthrough steps on lines that don't exist. It can't check that your explanations are right.
Run the code yourself.

## A complete example

A short, realistic lesson using most block types. It would live at
`src/courses/python-fundamentals/chapters/<chapter>/lessons/joining-text.ts`.

```ts
import type { Lesson } from "@/courses/types";
import type { Walkthrough } from "@/types/trace";

const greetingWalkthrough: Walkthrough = {
  id: "py-join-greeting", // unique across the whole app
  title: "Joining two strings",
  language: "python",
  visualizations: ["variables"],
  code: `first = "Ada"
greeting = "Hi, " + first
print(greeting)`,
  steps: [
    { line: 1, vars: { first: { type: "str", value: "Ada" } }, highlight: "first", note: "first now refers to the text Ada." },
    {
      line: 2,
      vars: { first: { type: "str", value: "Ada" }, greeting: { type: "str", value: "Hi, Ada" } },
      evaluation: ['"Hi, " + first', '"Hi, " + "Ada"', '"Hi, Ada"'],
      highlight: "greeting",
      note: "Right side first: look up first, join the two strings, then make greeting refer to the result.",
    },
    {
      line: 3,
      vars: { first: { type: "str", value: "Ada" }, greeting: { type: "str", value: "Hi, Ada" } },
      output: ["Hi, Ada"],
      note: "print() shows the value greeting refers to.",
    },
  ],
};

export const joiningText: Lesson = {
  id: "joining-text",
  title: "Joining Text",
  description: "How to build a new string out of smaller pieces of text.",
  status: "draft", // switch to "published" once reviewed
  objectives: ["Join two strings with `+`.", "Predict the result when a name and a string are mixed."],
  references: ["python.types.str", "python.operators.addition"],
  sections: [
    {
      id: "why",
      title: "A greeting for every player",
      blocks: [
        { type: "text", text: "A game greets each player by name. It can't store a separate greeting for every possible name, so it builds one from two pieces." },
      ],
    },
    {
      id: "joining",
      title: "Joining strings with +",
      blocks: [
        { type: "text", text: "With two [strings](ref:python.types.str), [`+`](ref:python.operators.addition) joins them into one new string." },
        {
          type: "code",
          language: "python",
          code: greetingWalkthrough.code,
          output: ["Hi, Ada"],
          highlightLines: [2],
          caption: "The space after the comma is part of the first string. Without it you'd get `Hi,Ada`.",
          walkthrough: greetingWalkthrough,
        },
        {
          type: "question",
          id: "predict-quoted-name",
          variant: "predict",
          prompt: "What does this print?",
          code: `first = "Ada"
print("Hi, " + "first")`,
          choices: [
            { id: "value", text: "`Hi, Ada`", feedback: "Look at the quotes around `first` on line 2. Is it a name or text?" },
            { id: "text", text: "`Hi, first`" },
          ],
          answer: "text",
          explanation: "With quotes, `\"first\"` is a string containing the word first. Python never looks up the variable, so it joins `Hi, ` and `first`.",
        },
      ],
    },
    {
      id: "practice",
      title: "Practice",
      blocks: [
        {
          type: "practice",
          id: "practice-welcome",
          prompt: "Create a variable `city` and print `Welcome to ` followed by the city, using `+`.",
          checklist: ["`city` refers to some text in quotes.", "The message is built with `+`, not typed out in full."],
          hints: ["Don't forget the space at the end of `\"Welcome to \"`."],
          solution: `city = "Lagos"
print("Welcome to " + city)`,
          solutionNote: "Python joins the two strings first, then print() shows the result: `Welcome to Lagos`.",
        },
      ],
    },
  ],
};
```

## Lesson patterns

Most lessons fit one of four patterns. They all use the same blocks, the same page and the same
route. A pattern is a starting shape, not a template to fill in; mix them when the topic needs
it.

### Concept lesson

Introduces what something is and why it matters. *Example: Why Do Variables Exist?*

1. A realistic problem the concept solves (`why`).
2. The concept in plain words, often with a figure.
3. The smallest code that uses it, with output.
4. A prediction question on the trickiest part.
5. A short practice task.

### Code behavior lesson

Teaches what a particular piece of code does, step by step. *Example: a lesson on `for` loops.*

1. A short program and its printed output.
2. A walkthrough, with the steps where something changes called out in the text.
3. An `execution` callout or a few sentences on the rule behind the behavior.
4. A prediction question on a small variation of the program.
5. A `reflect` prompt: "what would change if…?"

### Debugging lesson

Teaches students to recognize and explain mistakes. *Example: a lesson on reading error
messages.*

1. Working code next to a broken version.
2. The real error message, and how to read it (last line first, then the line number).
3. Two or three debug questions, each with a different realistic bug and `errorOutput`.
4. A `reflect` prompt asking the student to explain a bug in their own words.

### Problem-solving lesson

Presents a scenario and guides students toward a solution. *Example: building a simple score
tracker.*

1. The scenario and what the finished program should do.
2. Breaking the problem into steps, as a list or a `sequence` figure.
3. Each step solved with a small code example, building on the last.
4. A practice task with a checklist, progressive hints and an alternative solution.
