# Glowcode Teaching Guidelines

Glowcode teaches beginners, many of them middle schoolers, to think like programmers. Typing
code is the easy part; we want students to understand what their code does and why.

This file is about **what makes a good lesson**. For the mechanics of adding one (files, ids,
block types), see [`LESSON_AUTHORING.md`](./LESSON_AUTHORING.md).

The two Python lessons are the quality benchmark. When in doubt, read them:

- `src/courses/python-fundamentals/chapters/getting-started/lessons/what-is-programming.ts`
- `src/courses/python-fundamentals/chapters/variables/lessons/why-variables-exist.ts`

## The teaching journey

A good lesson moves through these stages. They describe the order a student meets ideas in.
They are **not** section headings, and short lessons can merge several into one passage.

1. **Problem**: a situation the student recognizes.
2. **Why**: what's hard about it without the new idea.
3. **Concept**: the idea itself, in plain words.
4. **Example**: a tiny piece of code that uses it.
5. **Execution**: what Python does, step by step, when it runs that code.
6. **Reasoning**: why it behaves that way, and what the student should predict next time.
7. **Practice**: the student uses the idea themselves.
8. **Debugging**: the student recognizes and explains a mistake.

A lesson that skips straight from concept to practice usually leaves students able to copy
code but not to explain it.

Inside that journey, the loop students repeat is **learn → predict → visualize → understand
→ practice**. Activities sit between explanations, not in a block at the end: explain an idea,
show the code, ask what it will do, let the walkthrough show it happening, explain the result,
then ask the student to use it in a new situation.

## 1. Introduce concepts through realistic problems

Open with something the student has seen or could imagine building, before any terminology.

> Variables start with a games website that asks a new player's age and needs that number
> again later: to choose games, to show a profile, to say happy birthday. Only then does the
> lesson say that programs need a way to remember.

Good problems are small and concrete: one website, one game, one stack of test papers. If you
can't name the problem a concept solves, the lesson isn't ready to write.

## 2. Explanations for beginners

- Write for a curious 12-year-old: short sentences, everyday words, "you" for the student.
- Explain what something **does** before how to **write** it. "A variable is a name that refers
  to a value" comes before `age = 13`.
- One idea per paragraph. If a paragraph runs past four sentences, split it or cut it.
- Don't write "simply", "just" or "obviously" about anything the reader is meeting for the
  first time.

## 3. Accurate terminology

- Introduce **one new term at a time**, in bold, at the point it's first needed.
- After that, use the real term every time. Don't switch between "variable", "box" and "slot".
- Link a term to the reference the first time it appears: `[string](ref:python.types.str)`.
- Simplify, but never say something false. An analogy (a recipe, a name tag) is a way in; the
  sentence after it should state the accurate idea. Python names **refer to** values. They
  don't "contain" them, so the variables lesson draws names pointing at values.
- Teach how **this** language behaves. Comparisons with other languages go in an
  `other-languages` callout that students can skip.

## 4. Writing natural, readable passages

Lessons should read like a good textbook written by a teacher who knows the students.

- Vary sentence length. A short sentence after two longer ones lands well.
- Say things directly. Avoid "It's not X, it's Y" when nobody believed X.
- Don't end paragraphs with a one-line moral that repeats the paragraph.
- Don't list three things when two make the point.
- Avoid em dashes in lesson text. Use a full stop, a comma, a colon or brackets.
- Read the passage aloud. If you'd never say it to a student, rewrite it.

## 5. Choosing examples

- **Tiny.** Two to five lines is ideal. Every line should earn its place.
- **Runnable.** Every example must run as shown and print exactly the output listed.
- **Meaningful names.** `age`, `score`, `player`. Never `foo`, `x1` or `my_var`.
- **One new idea at a time.** If an example needs something not yet taught, either explain it
  in one sentence or pick another example.
- **Close to the text.** Put the code right after the sentence that introduces it, and say in
  the caption what to notice. Use `highlightLines` for the line the text talks about.

## 6. Explaining syntax

When code uses symbols the student hasn't met, explain them briefly where they appear and link
to the reference for the full story:

> The `=` sign is the [assignment operator](ref:python.operators.assignment).

One sentence is usually enough. Detailed rules, edge cases and every variation belong in the
reference manual, which lessons link to. A lesson shouldn't try to be the manual.

## 7. Introducing built-in functions

Students can use `print()`, `len()` or `.append()` long before they learn to write functions.
When a built-in first appears:

1. Say what job it does, in one sentence.
2. Say what goes inside the parentheses.
3. Say what happens as a result: something printed, a value given back, or something changed.
4. Link to its reference entry.

How the built-in works inside can wait.

## 8. Output versus return values

Beginners mix these up constantly, so lessons must keep them apart.

- **Printed output** is what appears on the screen. Only `print()` (and similar) produces it.
  Code blocks show it under the heading "Printed output". Only put printed text in `output`.
- **A return value** is what a function gives back to the code that called it. Nothing is
  shown on screen unless the program prints it.
- **Side effects** are changes a function makes, like `my_list.append(4)` changing a list
  (and returning `None`).

For anything that takes inputs, make clear what goes in, what comes back, what's printed, and
what changes. In walkthroughs, use `returned` on a step for a returned value; it is drawn
separately from printed output.

## 9. Writing prediction questions

A prediction question asks "what will this print?" before the student can see the answer.

- Use a short program with one interesting moment (a reassignment, an order question).
- Every wrong choice should be a **real beginner mistake**: the old value, the text instead of
  the value, "it's an error". Never joke answers.
- Give each wrong choice `feedback` that names the misunderstanding and points back at the
  code, without giving the answer. Students then try again.
- Add a `hint` when the question has one step students often miss.
- The `explanation` explains **why** the answer is right by walking through the execution. It
  appears only after the student gets it right or chooses to see it.

## 10. Writing debugging activities

Debugging is a skill to practice in every lesson, not a chapter at the end.

- Show code with one realistic bug, and when Python would print an error, include the real
  message in `errorOutput`. Check it against a real Python 3 run.
- Teach students to read the **last line** of an error first.
- Wrong choices are plausible fixes a beginner might try. Their feedback should send the
  student back to the evidence: the error message, a line number, the order of lines.
- The explanation says what caused the bug, how the evidence pointed to it, and the fix.
- For a bug that's better reasoned through out loud than picked from a list, use a `reflect`
  block instead.

## 11. Using callouts sparingly

Callouts pull the eye away from the text, so each one must earn it. Use at most one or two per
section, and none in a section that's already short.

| Tone | Use it for |
| --- | --- |
| `real-world` | connecting the idea to something familiar (a recipe, a name tag) |
| `execution` | a short "how Python runs this" note right after an example |
| `mindset` | a programmer habit: predict first, be the computer |
| `careful` | a common trap, like `age` versus `"age"` |
| `tip` | practical advice that isn't a trap |
| `other-languages` | an optional comparison, such as Java's fixed types |

If a callout could be a normal sentence, make it a normal sentence.

## 12. Choosing visualization moments

Use a picture or a walkthrough where something **changes** or happens **in order**, and words
struggle to show it:

- **Figures** (`figure` block) for a static idea: names pointing at values, the steps Python
  follows. Introduce the figure in the text and caption it with what to notice.
- **Walkthroughs** (on a `code` block) when the order of execution is the point: a reassignment
  that happens in two steps, a loop, a function call. One or two walkthroughs per lesson is
  plenty. Walkthroughs must be accurate; check each step's line, variables and output by hand.
- Skip the visualization when the code is a single obvious line.

Don't fake a visualization. If the walkthrough player can't yet show something (like the call
stack), explain it in text instead.

**Predictions inside walkthroughs.** A walkthrough can stop before a step and ask the student
to predict it. Use this at the moment the idea turns on: the value after a reassignment, the
branch an `if` takes, what a function gives back. One or two per walkthrough; a question on
every step turns watching into a test. The question must not give away the step it asks about,
and it shouldn't repeat a question the lesson asks elsewhere.

## 13. Avoiding unnecessary repetition

- Explain each idea **once**, well. Later, refer back to it in a phrase ("remember: right side
  first") instead of explaining it again.
- Don't recap the lesson at the end. The objectives at the top already say what it covers.
- Each activity should test something different. Two questions about the same line are one
  question too many.
- A lesson doesn't need every kind of block. Use what helps this idea.

## 14. Maintaining correctness

- Run every code example and check the printed output matches, character for character.
- Copy error messages from a real run, including the line that names the error.
- Check every walkthrough step: the line number, every variable's value after that step, and
  the printed output so far. One line can take several steps (`age = age + 1` takes two).
- Keep ids stable. Changing a lesson or activity id loses students' saved progress.
- `bun run test` fails on broken content: unknown reference ids, answers that aren't among the
  choices, walkthrough lines that don't exist. It can't catch wrong explanations. That part is
  your job.

## 15. Reviewing content before publication

Before switching a lesson from `draft` to `published`, read it from the top as a student would
and check:

- [ ] It opens with a problem the student recognizes.
- [ ] The concept is explained before the syntax.
- [ ] Each new term is introduced once, in bold, and linked to the reference when it exists.
- [ ] Every code example is tiny, runs, and shows its real printed output.
- [ ] Printed output and returned values are never confused.
- [ ] There is at least one prediction and one debugging activity, each explaining **why**.
- [ ] Wrong choices are realistic mistakes with feedback that doesn't give the answer away.
- [ ] Walkthrough steps were checked line by line.
- [ ] Callouts are few, and each says something the text doesn't.
- [ ] Nothing is technically false, even where it's simplified.
- [ ] Nothing is explained twice, and there's no closing summary.
- [ ] It reads well aloud.

## Teaching deeply without writing long

Depth comes from the student doing the thinking, not from more paragraphs. A short lesson that
asks for a prediction, shows the execution, and makes the student explain a bug teaches more
than three extra pages of explanation. When a lesson feels thin, add a well-chosen question,
not more prose. When it feels long, cut repeated explanations first, then callouts, then
examples that show the same thing twice.

## Voice

Warm, direct and encouraging, never childish. Talk to the student as "you". Treat mistakes as
information ("you've found the exact idea worth looking at again"). No filler and no hype.
