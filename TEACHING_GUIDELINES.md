# Glowcode Teaching Guidelines

Glowcode teaches beginners, many of them middle schoolers, to **think like programmers**,
not just to type code. Every lesson follows these principles. When in doubt, re-read
`why-variables-exist.ts`: it's the reference example of this style.

## 1. Start by explaining why

Open with a problem the student recognizes, before any terminology.

> Teaching variables? Start with a games website that asks a new player's age, and needs that
> number again later: to pick games, show a profile, say happy birthday. *Then* reveal that
> programs need a way to remember. That's what variables are for.

If you can't name the problem a concept solves, the lesson isn't ready.

## 2. Concept before syntax

Students should understand **what something does** before memorizing **how to write it**.
"A variable is a name that refers to a value" comes before `age = 13`.

## 3. Simple English, accurate ideas

- Write for a curious 12-year-old: short sentences, everyday words.
- Introduce **one technical term at a time**, in bold, right where it's first needed.
- Never trade accuracy for simplicity. Analogies are welcome, but don't let them say something
  false. (Glowcode draws variables as labeled boxes; the text still says a variable is a *name
  that refers to a value*, because that's how Python actually works.)
- Use real terms once they're introduced (`string`, `assignment`), and link them to the
  reference: `[string](ref:python.types.str)`.

## 4. Teach how *this* language behaves

Explain the current language's actual rules. In Python, a name can be rebound to a value of a
different type; in Java, a variable's type is declared and fixed. Comparisons with other
languages go in an `other-languages` callout, are optional, and never distract from the main idea.

## 5. What goes in, what happens, what comes out

Especially for functions and methods, always make clear:

- **Inputs / arguments**: what you give it
- **Return value**: what it gives back (Python functions that finish normally always return
  something, possibly `None`)
- **Printed output**: what appears on screen. Printing is **not** returning.
- **Side effects / mutation**: what it changes. `my_list.append(4)` changes the list and
  returns `None`.

## 6. Progressive learning is fine

Students can use `print()`, `len()` or `.append()` long before they learn to write functions.
Explain what a built-in does and how it behaves; leave how it's implemented for later.

## 7. Programmer mindset, everywhere

Mindset and debugging are not a final chapter. Every lesson should ask students to do some of:

1. **Understand** the problem.
2. **Break it** into smaller parts.
3. **Predict** what will happen.
4. **Plan** a solution.
5. **Examine** execution (walkthroughs).
6. **Test** assumptions.
7. **Identify and explain** mistakes, including reading error messages.

Use `mindset` callouts, prediction questions and debug questions to build this habit.

## 8. Examples and practice

Each topic should eventually offer a clear explanation, a small code example, a walkthrough or
visualization, prediction questions, practice and a debugging exercise. Use what helps.
**Don't force every component into every lesson**; repetition for its own sake is filler.

## Writing checklist

- [ ] Opens with a real-world reason (`why` section)
- [ ] Concept explained before syntax
- [ ] Each new term introduced once, in bold, linked to the reference when it exists
- [ ] Code examples are tiny, runnable, and their output is shown
- [ ] At least one prediction or debugging activity, with an explanation of *why*
- [ ] Wrong answer choices are realistic beginner mistakes, not jokes
- [ ] Walkthrough steps verified line by line (a line may appear in several steps)
- [ ] Nothing technically false, even when simplified
- [ ] Short passages: if a paragraph runs past ~4 sentences, split it or cut it

## Voice

Warm, direct and encouraging, never childish. Talk to the student ("you"). Celebrate mistakes
as information ("you've found exactly the thing worth learning"). No filler, no hype, no
"simply" or "just" for things that are new to the reader.
