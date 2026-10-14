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

A chapter can be in the course outline before it has lessons. Give it `status: "planned"` and
`lessons: []`: the contents list shows it greyed out with a "Planned" tag and no link. Use
`"in-progress"` while some lessons are open and more are coming, and `"complete"` (the default)
when it's done. The validator rejects a planned chapter with lessons and any other chapter
without them, so never add a placeholder lesson to make a chapter appear. Python Fundamentals
keeps its planned chapters in `chapters/planned.ts`; see
[`COURSE_OUTLINE.md`](./COURSE_OUTLINE.md) for the outline and how to start the next chapter.

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

**Moving content between lessons.** Keep the ids when you move an activity or walkthrough to
another lesson (Phase 6 moved `predict-socks`, `debug-capital-print` and others out of
`what-is-programming`). Progress saves completed lessons by lesson id and the last activity as
a `{ lessonId, activityId }` pair. If that activity has left the lesson, "Continue" simply
opens the lesson at the top (`resumeTarget` checks with `resumableIdsIn`), so no migration is
needed. Never reuse an old id for different content.

## 3. Defining sections

A lesson is a list of sections, and each section is a titled list of blocks:

```ts
{ id: "changing", title: "Changing a variable", blocks: [ /* … */ ] }
```

Sections follow the teaching journey (problem, concept, example, execution, practice,
debugging) but don't need to match it one to one. Most lessons have four to eight. The first is
usually the problem, with the id `why`.

The last section is the recap: id `key-ideas`, title "Key ideas", and a single `list` block of
three to six short items. Nothing else goes in it.

```ts
{ id: "key-ideas", title: "Key ideas", blocks: [{ type: "list", items: ["…", "…", "…"] }] }
```

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

Leave `output` out when the block's walkthrough asks for a prediction (a step with a
`checkpoint`): otherwise the answer is printed above the question. The walkthrough shows the
output at the right step, and `check:python` still checks every step against Python. Leave it
out too when the student is meant to work the output out, as in an "explain this program"
reflection; say so in the caption.

## 6. Associating a walkthrough

Add `walkthrough` to a code block to show a "Walk through code" button that expands the
step-by-step player in place. Without one, no button appears.

The full guide to writing walkthroughs (events, variable states, every diagram, predictions,
validation, and the `buildSteps` helper that saves repeating state) is
[`VISUALIZATION_AUTHORING.md`](./VISUALIZATION_AUTHORING.md). The essentials follow.

Define the walkthrough above the lesson and reuse its `code` in the block, so the two can't
drift apart (validation also checks they match):

```ts
const birthday: Walkthrough = { id: "py-birthday", title: "…", language: "python", visualizations: ["variables"], code: `…`, steps: [ … ] };
// …
{ type: "code", language: "python", code: birthday.code, output: ["13", "14"], walkthrough: birthday }
```

Each step is one **execution event** and records the **state after** it:

- `line`: the 1-indexed line running. A line can take several steps (`age = age + 1` takes
  two: working out the right side, then the assignment), and a loop revisits the same line.
- `vars`: every variable after the step. `highlight` names the one that changed.
- `output`: everything printed **so far**, not just this step.
- `note`: one or two short sentences on what happened.

Optional extras draw more detail. Use them where they help the lesson, not on every step.

**`calc`** splits an assignment that calculates something into events on the same line:
an optional `"read"` (look up the values), `"calculate"` and `"assign"`. Until the assign
step, `vars` still holds the old value:

```ts
{ line: 3, vars: { age: int(13) }, calc: { target: "age", parts: [{ code: "age", value: "13" }, { code: "+" }, { code: "1" }], result: "14", phase: "calculate" }, note: "…" },
{ line: 3, vars: { age: int(14) }, calc: { target: "age", parts: [/* same */], result: "14", phase: "assign" }, note: "…" },
```

**`call`** draws a function call as inputs → function → what comes out. Returned values,
printed output and changes to an object are separate slots; leave out the ones that don't
apply (or that the lesson isn't ready for, like `print()` returning `None` in a first lesson).
Phases: `call` (arguments go in), `run` (the body runs), `result` (outputs appear),
`assign` (the returned value is stored in `assignTo`). Results show as `?` until `result`.

```ts
{ line: 2, vars: { word: str("cat") }, call: { name: "len", args: ['"cat"'], returns: "3", assignTo: "length", phase: "result" }, note: "…" }
{ line: 3, vars: { … }, output: ["3"], call: { name: "print", args: ["3"], prints: ["3"], phase: "result" }, note: "…" }
{ … call: { name: "append", receiver: "items", args: ['"apple"'], changes: '["apple"]', returns: "None", phase: "result" } }
```

For the `function` view, list `"function"` in `visualizations`. For `for` loops, set
`forLoop` on the walkthrough (the iterable and the body) and on each step (`next`, `assign`,
`body`, `exit`); for `while` loops, `whileLoop`. For if/elif/else, set `ifChain` on the
walkthrough and on each step. Lists, tuples, dicts and sets go in the `collections` view
(mark indexes, slices, changes and `in` tests on the step), and functions that call
functions in the `stack` view. Before writing one from scratch, look for a ready-made
walkthrough: the playground examples in `src/data/examples.ts` and the Python visualization
demos in `src/data/pythonVisuals.ts` (shared lists, precedence, list changes, every kind of
`for` loop, strings, dicts, sets, nested calls, the call stack) can be reused as they are when
your code block matches. `VISUALIZATION_AUTHORING.md` covers every field.

**`checkpoint`** asks for a prediction **before** a step is shown. The player stops on the
previous step and Next waits until the student answers (or chooses to skip):

```ts
{
  line: 3,
  vars: { age: int(13) },
  calc: { /* … */ phase: "calculate" },
  note: "Right side first…",
  checkpoint: {
    prompt: "Line 3 is `age = age + 1`. What does Python do **first**?",
    choices: [
      { id: "calculate", text: "Works out `age + 1`, using the value `age` refers to now" },
      { id: "store", text: "Makes `age` refer to 14 straight away", feedback: "Python can't store a value it hasn't worked out yet…" },
    ],
    answer: "calculate",
    explanation: "Right side first. Python looks up `age` (13)…",
  },
}
```

- Put a checkpoint on the step whose result is worth predicting: a reassignment, the branch an
  `if` takes, what a function gives back. One or two per walkthrough is plenty.
- The prompt can only use what the student can already see. Don't mention values from the
  step being predicted.
- Wrong choices get `feedback` about the misunderstanding, as in lesson questions. The
  `explanation` appears with the revealed step whatever the student chose.
- The first step can't have a checkpoint (there's nothing before it to pause on).
- Mention the prediction in the code block's caption so students know to open the walkthrough.

Check every step by hand, then run `bun run check:python` (see section 11). The player shows
exactly what you write.

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

The manual's entries live in `src/references/entries/` (`concepts.ts`, `python.ts`), with ids
like `concept.variable`, `python.builtins.print`, `python.types.str` and
`python.types.str.upper`.

- Link inline, the first time a term appears: `[string](ref:python.types.str)`. Students can
  hover, focus or tap it for a one-line explanation and open the full page with "See more".
- List the entries worth looking up in the lesson's `references` array. They appear under
  "Look it up" at the end of the lesson.
- Code examples link recognised built-ins, keywords and methods automatically, but only when
  the snippet makes the meaning certain. You don't mark anything up in code.
- `bun run test` fails if a lesson links to an id that doesn't exist.

### Adding a reference entry

Add an object to the right file. No page, route or menu changes are needed: the navigation,
search and page are built from the data.

```ts
{
  id: "python.types.str.lower",          // methods live under their type
  scope: "python",
  category: "method",
  parent: "python.types.str",
  title: "str.lower()",
  summary: "Gives back a copy of the string in lowercase. The original doesn't change.",
  aliases: ["lower", "lower()"],
  keywords: ["lowercase", "small letters", "string lowercase"],   // what students might type
  explanation: ["`lower()` is a [method](ref:concept.method) of strings…"],
  syntax: "text.lower()",
  accepts: "Nothing goes inside the parentheses.",
  returns: "A new string in lowercase.",   // callables must state all three
  prints: "Nothing.",
  changes: "Nothing. The original string stays as it was.",
  examples: [{ code: `word = "CAT"\nprint(word.lower())`, output: ["cat"] }],
  mistakes: [{ title: "Expecting the string to change", explanation: "…", code: `…`, output: ["…"] }],
  related: ["python.types.str", "python.types.str.upper", "concept.mutability"],
}
```

- Only `id`, `scope`, `category`, `title`, `summary` and `explanation` are required. A concept
  has no parameters; leave out what doesn't apply.
- The summary is one or two plain sentences with no links: it appears in popups and search
  results.
- Every function and method must say what it **returns**, **prints** and **changes**, even when
  the answer is "Nothing." That's how the manual keeps the three apart.
- `aliases` and `keywords` feed search. Add the words a beginner would type, including words
  from error messages ("not defined").
- Choose `related` entries by hand: the ones that help understand this one.
- Examples are checked against real Python by `bun run check:python`. For `input()`, give
  `input: ["Ada"]` and include the typed text in `output` as it appears on screen. A mistake
  states its `error` (the last line Python prints) or `output`; mark an infinite loop with
  `neverEnds: true`.
- To show a call diagram, add `call` to an example (the same `CallEvent` walkthroughs use). To
  embed a walkthrough, pass an existing curated one (`walkthrough: getExample("len")`) whose
  code is exactly the example's code. Don't write a walkthrough just for the manual.

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
bun run test          # includes validateCourses: ids, references, answers, walkthroughs
bun run check:python  # runs every example in real Python and compares the results
bun run typecheck     # the lesson matches the content types
bun run lint
bun run dev           # read it in the browser, on a narrow window too
```

`validateCourses` (in `src/courses/queries.ts`) fails the test run on duplicate or badly
formed ids, unknown reference ids, an `answer` that isn't one of the choices, duplicate choice
ids, highlighted lines that don't exist, walkthrough code that differs from the code shown, and
walkthrough problems (steps on lines that don't exist, printed output that disappears between
steps, predictions without a right answer).

`check:python` (in `scripts/check-python.ts`, also run by CI) runs your code in `python3` and
fails if a code block's `output`, a walkthrough's steps (replayed event by event, including
inside functions), final output or variables, a debug
question's `errorOutput`, or a predict question's answer doesn't match what Python actually
does. Neither check can tell whether your explanations are right; that part is your job.

## Activity formats that don't exist yet

Use an existing block and note the improvement rather than building a new activity type inside a
content phase:

- **Put these lines in order.** List the shuffled lines with a letter each (A, B, C…) in a
  `list` block, then ask a `predict` question whose choices are orders ("C, B, D, A"),
  each wrong order with feedback. A drag-to-reorder block is a candidate for roadmap phase 7.
- **What runs next?** A `predict` question with the code and "Python has just finished line 2"
  in the prompt works well; inside a walkthrough, a checkpoint does the same job.

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

### Chapter review lesson

Checks the chapter by asking students to use it on programs they haven't seen. *Example:
Chapter Review & Practice (`chapter-1-review`).*

1. One short paragraph on how to approach it (trace, don't guess). No new teaching.
2. Predict questions that combine ideas from different lessons, including at least one with a
   twist (code that prints code, two lines that print the same thing for different reasons).
3. An "explain this program" `reflect` prompt with the code shown above it and no output.
4. A debug question for each kind of error the chapter covered, with real `errorOutput`.
5. Practice tasks that combine the chapter's skills. No walkthrough: the review applies what
   the walkthroughs taught.

### Problem-solving lesson

Presents a scenario and guides students toward a solution. *Example: building a simple score
tracker.*

1. The scenario and what the finished program should do.
2. Breaking the problem into steps, as a list or a `sequence` figure.
3. Each step solved with a small code example, building on the last.
4. A practice task with a checklist, progressive hints and an alternative solution.
