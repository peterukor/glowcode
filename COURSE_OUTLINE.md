# Python Fundamentals: Course Outline

Status: Chapters 1 and 2 complete; Chapters 3–10 planned.
Last updated: 2026-10-15 (Phase 7).

This file records what the Python Fundamentals course covers, what's written, and how to add
the next chapter. [`PRODUCT_ROADMAP.md`](./PRODUCT_ROADMAP.md) stays the source of truth for
sequencing: a change to the chapter order is proposed there first and logged with a date, then
reflected here.

## The outline

| # | Chapter | Chapter id | Status |
| --- | --- | --- | --- |
| 1 | Getting Started with Programming | `getting-started` | complete (6 lessons) |
| 2 | Variables, Values & Data Types | `variables` | complete (8 lessons) |
| 3 | Operators & Expressions | `operators-expressions` | planned |
| 4 | Making Decisions with Conditionals | `conditionals` | planned |
| 5 | Repetition with Loops | `loops` | planned |
| 6 | Strings | `strings` | planned |
| 7 | Lists & Collections | `lists-collections` | planned |
| 8 | Functions | `functions` | planned |
| 9 | Errors & Debugging | `errors-debugging` | planned |
| 10 | Putting It Together | `putting-it-together` | planned |

Each chapter only uses ideas from the chapters before it. Where a later idea has to appear
early, it's used lightly and named as coming later: Chapter 1 shows `10 + 5` being evaluated
before `print()` gets it, and says that operators are Chapter 3; it shows `print()`'s return
value `None` in the function diagram, and says that writing functions is Chapter 8.

Students can open any published lesson in any order. Nothing is locked.

## How planned chapters appear

A chapter has a `status` (`src/courses/types.ts`):

- `complete`: every lesson it's meant to have is written. The default.
- `in-progress`: some lessons are open. The contents list says more are on the way.
- `planned`: in the outline, with **no lessons**. The contents list shows its number, title and
  a "Planned" tag, with no link. The validator rejects a planned chapter that has lessons and a
  non-planned chapter that has none, so placeholder lessons can't slip in.

Planned chapters live together in `src/courses/python-fundamentals/chapters/planned.ts`. The
course card on the dashboard shows "2 of 10 chapters available · 8 planned".

## Chapter 1: Getting Started with Programming

Goal: a student who has never programmed can explain what a program is, trace a short
`print()` program one statement at a time, tell code from output and a string from an integer,
and fix the two most common first errors.

| # | Lesson id | Title | Teaches | Walkthrough |
| --- | --- | --- | --- | --- |
| 1 | `what-is-programming` | What Is Programming? | programs, instructions, programmers, programming languages, syntax, code vs. what it makes the computer do | none (no code yet) |
| 2 | `how-computers-follow-instructions` | How Does a Computer Follow Instructions? | execution, statements, top-to-bottom order (and that later programs branch, repeat and call functions), code vs. output | `py-three-messages` (code + output only) |
| 3 | `first-python-program` | Your First Python Program | `print("Hello, world!")`: function (lightly), calling, parentheses, strings and quotes, where output appears, case-sensitive names | `py-hello-program` (function view) |
| 4 | `print-and-output` | Understanding print() and Output | printing text and integers, `42` vs `"42"`, output order, printing vs. returning (`None`), missing quotes (`NameError`) and missing `)` (`SyntaxError`) | `py-print-values` (function view with Returns and Prints) |
| 5 | `reading-code-step-by-step` | Reading Code Step by Step | a tracing routine (find, predict, check, continue), expressions evaluated before `print()` | `py-trace-ready` (evaluation chain + function view) |
| 6 | `chapter-1-review` | Chapter Review & Practice | predict, next line, code vs. output, explain, two debug questions, ordering, two practice tasks | none (review applies, doesn't re-show) |

### What was reused from earlier phases

Phase 2's first lesson (`what-is-programming`) covered lessons 1–3 in one page. Its content was
split rather than duplicated, and every id kept:

| Item | Was in | Now in |
| --- | --- | --- |
| lesson `what-is-programming` (completion keeps working) | | lesson 1, rewritten around programs and languages |
| `reflect-exact-instructions` | lesson 1 | lesson 1 |
| `predict-socks` | lesson 1 | lesson 2 |
| `debug-capital-print` (same code and error) | lesson 1 | lesson 3 |
| walkthrough `py-hello-program` | lesson 1 (`print("Hello!")` twice) | lesson 3 (`print("Hello, world!")`) |
| `practice-morning-routine` | lesson 1 | lesson 6 |

A student's saved "last activity" may point at an activity that moved. `resumeTarget` now
ignores a saved activity that isn't in the lesson any more, so Continue opens the lesson at the
top instead of at a missing anchor. Stored progress keys are unchanged.

### Activities

| Lesson | Activities |
| --- | --- |
| 1 | `predict-robot-water` (sequencing, no code), `reflect-exact-instructions` |
| 2 | walkthrough checkpoint (output builds up), `predict-socks`, `predict-code-vs-output` |
| 3 | walkthrough checkpoint (quotes aren't printed), `predict-single-quotes`, `debug-capital-print`, `practice-own-greeting` |
| 4 | walkthrough checkpoint (`"42"` prints like `42`), `predict-quoted-sum`, `predict-print-keeps`, `debug-missing-quotes`, `debug-missing-parenthesis`, `practice-scoreboard` |
| 5 | walkthrough checkpoint (`15`, not `10 + 5`), `predict-second-line`, `predict-next-statement`, `reflect-output-order`, `practice-receipt` |
| 6 | `review-last-line`, `review-next-line`, `review-code-vs-output`, `review-explain-program`, `review-debug-misspelled`, `review-debug-syntax`, `review-order-countdown`, `practice-morning-routine`, `practice-party-plan` |

## Chapter 2: Variables, Values & Data Types

Goal: a student can trace several lines of code and say what value each variable refers to
after every line, tell the basic types apart, convert between them, and use `input()` knowing
it always returns a string. Variables are taught as **names that refer to values**, never as
boxes that contain them.

| # | Lesson id | Title | Teaches | Walkthrough |
| --- | --- | --- | --- | --- |
| 1 | `why-variables-exist` | Why Do We Need Variables? | the cost of repeating a value; a variable as a name that refers to a value; `print()` with several values | `py-welcome-name` (variables) |
| 2 | `values-and-types` | Values and Python Data Types | `int`, `float`, `str`, `bool`, `NoneType`; `None` as a real value; `18` vs `"18"` | none (a variables figure) |
| 3 | `creating-variables` | Creating Variables with Assignment | name / `=` / value; `=` is an instruction, not equality; naming rules; snake_case | `py-score-assignment` (variables) |
| 4 | `using-variables` | Using Variables in Programs | looking up a value; `print(name)` vs `print("name")`; using variables in calculations; NameError | `py-read-variables` (variables) |
| 5 | `reassignment` | Changing Values with Reassignment | read → calculate → produce → rebind → print; `b = a` doesn't link names; multi-step tracing | `py-score-reassign` (variables + expression tree), `py-independent-names` (variables) |
| 6 | `type-conversion` | Strings, Numbers & Type Conversion | `+` adds or joins; TypeError; `type()`; `int()`, `float()`, `str()` return new values; ValueError | `py-int-conversion` (function + variables) |
| 7 | `getting-input` | Getting Input from Users | `input()` shows a prompt, waits, returns a string; converting answers; ValueError on bad answers | `py-input-name`, `py-input-age` (function + variables, sample input) |
| 8 | `chapter-2-review` | Chapter Review & Practice | names, types, the x/y trace, `b = a`, conversion, input strings, NameError, TypeError, a combined challenge | none |

### What was reused

The Phase 3 lesson `why-variables-exist` keeps its id (so completions stay) and became lesson 1,
rewritten around the brief's repeated-name example. Its activities moved to the lessons that now
teach them, with ids unchanged: `debug-name-case` and `reflect-use-before-create` to lesson 4;
`predict-score`, `reflect-earlier-print` (now about `score`) and `practice-player-level` to
lesson 5. Its walkthroughs `py-age-assignment` and `py-birthday` were replaced by
`py-score-assignment` and `py-score-reassign`; a saved "last activity" pointing at an old
walkthrough opens the lesson at the top.

### Activities

| Lesson | Activities |
| --- | --- |
| 1 | walkthrough checkpoint (`print(name, ...)`), `predict-change-name`, `practice-city-postcard` |
| 2 | `predict-print-none`, `predict-type-price-text`, `predict-which-bool`, `reflect-18-and-text`, `practice-product-types` |
| 3 | `debug-backwards-assignment`, `predict-valid-name`, `debug-name-with-space`, `practice-fix-names` |
| 4 | `predict-name-vs-text`, `debug-name-case`, `debug-misspelled-variable`, `reflect-use-before-create`, `practice-profile-card` |
| 5 | walkthrough checkpoints (score before the rebind; `print(b)`), `reflect-earlier-print`, `predict-score`, `predict-trace-points`, `practice-player-level` |
| 6 | walkthrough checkpoint (what `int()` returns), `debug-mixed-plus`, `predict-convert-then-join`, `debug-int-word`, `practice-shop-total` |
| 7 | walkthrough checkpoint (what `input()` returns), `predict-two-inputs`, `debug-input-word`, `practice-greeting-next-year` |
| 8 | `review-valid-name`, `review-identify-types`, `review-trace-xy`, `review-names-independent`, `review-explain-trace`, `review-convert-or-join`, `review-input-type`, `review-debug-name`, `review-debug-join-number`, `practice-ticket-total` |

### Manual entries

Added in Phase 7: `python.types.float`, `python.types.bool`, `python.builtins.int`,
`python.builtins.float`, `python.builtins.str`, `python.errors.ValueError`. Reused:
`concept.variable`, `python.operators.assignment`, `python.types.int`, `python.types.str`,
`python.types.None`, `python.builtins.print`, `python.builtins.input`, `python.builtins.type`,
`python.errors.NameError`, `python.errors.TypeError`, `python.errors.SyntaxError`.

## Conventions used in Chapters 1 and 2

These now apply to every chapter. The mechanics are in
[`LESSON_AUTHORING.md`](./LESSON_AUTHORING.md); the reasoning is in
[`TEACHING_GUIDELINES.md`](./TEACHING_GUIDELINES.md).

- **Opening problem first.** Every lesson starts from something the student recognizes (marking
  test papers, a scoreboard, a till receipt) before any syntax.
- **Key ideas.** Every lesson ends with a section `key-ideas` containing one short list (three
  to six items). It's the only recap: no closing paragraph, no repeated explanation.
- **Prediction before reveal.** When a walkthrough asks for a prediction, the code block above it
  doesn't print the program's output; the walkthrough reveals it at the right step.
- **Real Python is the source of truth.** Every code block with output, every debug question's
  error, every practice solution and every walkthrough step is checked by `check:python`.
- **Links where they help.** A term is linked to the manual the first time it matters in a
  lesson, not every time it appears.
- **Nothing stored by `print()`.** Lessons never suggest that printing keeps a value. Return
  values are named as different from output wherever both appear.
- **Names refer to values.** Variables are names bound to values, not boxes. Lessons say a name
  "refers to" a value; an assignment "makes the name refer to" it; reassignment "rebinds" it.
- **Labelled sample input.** A program that calls `input()` carries an `input` list of sample
  answers. The page shows them as "Sample user input" and says they're pretend; notes say "the
  sample user types…", never "you type…". `check:python` runs the program with those answers.

## Choosing activities

| The student needs to… | Use |
| --- | --- |
| commit to an idea before seeing it run | a walkthrough checkpoint |
| apply a rule to a new program | a `predict` question with code |
| read an error message | a `debug` question with the exact `errorOutput` |
| put reasoning into words | a `reflect` prompt with a model answer |
| write code from scratch | a `practice` task with a checklist, hints and a gated solution |
| put steps in order | a `predict` question whose choices are orders ("C, B, D, A"), with the steps listed above it |

A lesson uses the activities its idea needs; it doesn't need one of each. Wrong choices are
real misconceptions, and each one has feedback that explains the misconception without giving
the answer away.

**Future activity type.** Ordering is a multiple-choice question for now. A drag-to-reorder
activity would be better for "put these lines in order"; it needs a new block type, keyboard
support and its own tests, so it's left for the richer-activities phase (roadmap phase 7).

## Reusing visualizations

Chapter 1 uses only what Phase 5 built:

- `visualizations: []` shows the code, the current line and the printed output. Use it when the
  lesson is about order and output, not about a value (`py-three-messages`).
- `["function"]` with `call` events shows input → function → Returns / Prints. Leave `returns`
  out until the lesson is ready to talk about return values (`py-hello-program`), then show it
  (`py-print-values` shows `None`).
- `evaluation: ["10 + 5", "15"]` on a step draws the evaluation chain above the diagram. Pair it
  with a `call` in the `"call"` phase whose argument is the result, so the student sees the
  value going in (`py-trace-ready`).

Don't add a diagram the lesson doesn't need. A lesson about what programming is has none.

## Adding the next chapter safely

1. Get the chapter's lesson list approved (the outline above is a plan, not permission).
2. Create `chapters/<chapter-id>/chapter.ts` and its `lessons/` folder, keeping the chapter id
   from `planned.ts`. Remove the entry from `planned.ts` and put the new chapter in the same
   position in `course.ts`.
3. Set `status: "in-progress"` until the last lesson is published, then `"complete"`.
4. Chapter 3 is next (`operators-expressions`). It has no earlier lessons to preserve; Chapters 1 and 2's ids must not change.
5. Write each lesson to the conventions above and check it against section 15 of the teaching
   guidelines.
6. Add a test like `src/courses/python-fundamentals/chapter-2.test.ts`: lesson order, answers,
   walkthrough timing, manual links and the recap.
7. Run `bun run typecheck`, `bun run lint`, `bun run test`, `bun run check:python` and
   `bun run build`, then read every lesson in a browser at desktop and phone widths.
8. Update this file's tables and add a dated note to the roadmap's decision log.
