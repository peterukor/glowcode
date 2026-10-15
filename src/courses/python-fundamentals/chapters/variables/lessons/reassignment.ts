import type { Lesson } from "@/courses/types";
import type { CalcEvent, ExprNode, Walkthrough } from "@/types/trace";
import { buildSteps, py } from "@/walkthrough/build";

const scorePlusFive: ExprNode = { id: "add", code: "score + 5", op: "+", left: { id: "score", code: "score", value: "10" }, right: { id: "five", code: "5" } };
const scoreCalc = (phase: CalcEvent["phase"], extra: Partial<CalcEvent> = {}): CalcEvent => ({
  target: "score",
  parts: [{ code: "score", value: "10" }, { code: "+" }, { code: "5" }],
  result: "15",
  phase,
  tree: scorePlusFive,
  ...extra,
});

/** The five events the chapter is built around: read, calculate, produce, rebind, print. */
const scoreReassign: Walkthrough = {
  id: "py-score-reassign",
  title: "score = score + 5",
  language: "python",
  visualizations: ["variables"],
  code: `score = 10
score = score + 5

print(score)`,
  steps: buildSteps([
    { line: 1, set: { score: py.int(10) }, highlight: "score", note: "score refers to 10." },
    {
      line: 2,
      calc: scoreCalc("read"),
      note: "Right side first. Python reads the value score refers to now: 10. Reading doesn't change anything.",
    },
    {
      line: 2,
      calc: scoreCalc("calculate", { active: "add", done: {} }),
      note: "Python calculates 10 + 5. score still refers to 10 while it works.",
    },
    {
      line: 2,
      calc: scoreCalc("calculate", { done: { add: "15" } }),
      note: "The calculation produces a new value, 15. It isn't stored anywhere yet, and score still refers to 10.",
      checkpoint: {
        prompt: "Python is calculating `score + 5`. While it does, before line 2 has finished, what does `score` refer to?",
        choices: [
          { id: "ten", text: "`10`" },
          {
            id: "fifteen",
            text: "`15`",
            feedback: "15 is where `score` ends up, but only after the calculation is finished and the assignment runs. Has the assignment happened yet?",
          },
          {
            id: "nothing",
            text: "Nothing: Python clears `score` while it recalculates",
            feedback: "Python needs `score`'s value to do the calculation, so it can't clear it. The name keeps its old value until the very end of the line.",
          },
        ],
        answer: "ten",
        explanation: "The right side is worked out completely first, using the value `score` refers to now. Until the assignment happens, `score` still refers to 10.",
      },
    },
    {
      line: 2,
      set: { score: py.int(15) },
      highlight: "score",
      calc: scoreCalc("assign", { done: { add: "15" } }),
      note: "Only now does the assignment happen: score is rebound to 15. Nothing refers to 10 any more.",
    },
    { line: 4, print: ["15"], note: "print() looks up score and finds the value it refers to now: 15." },
  ]),
};

const independentNames: Walkthrough = {
  id: "py-independent-names",
  title: "b = a, then a changes",
  language: "python",
  visualizations: ["variables"],
  code: `a = 10
b = a
a = 20

print(b)`,
  steps: buildSteps([
    { line: 1, set: { a: py.int(10) }, highlight: "a", note: "a refers to 10." },
    {
      line: 2,
      calc: { target: "b", parts: [{ code: "a", value: "10" }], result: "10", phase: "read" },
      note: "Right side first: Python reads the value a refers to, 10.",
    },
    {
      line: 2,
      set: { b: py.int(10) },
      highlight: "b",
      calc: { target: "b", parts: [{ code: "a", value: "10" }], result: "10", phase: "assign" },
      note: "b now refers to that same value, 10. b refers to the value, not to the name a.",
    },
    { line: 3, set: { a: py.int(20) }, highlight: "a", note: "a is rebound to 20. Only the name a moves." },
    {
      line: 5,
      print: ["10"],
      note: "print(b) looks up b. It still refers to 10: line 3 changed a, and nothing changed b.",
      checkpoint: {
        prompt: "Line 3 made `a` refer to 20. What will `print(b)` show?",
        choices: [
          { id: "ten", text: "`10`" },
          {
            id: "twenty",
            text: "`20`, because `b` is linked to `a`",
            feedback: "Line 2 made `b` refer to the value `a` referred to at that moment. Did line 3 change `b`, or only `a`?",
          },
          {
            id: "a",
            text: "`a`",
            feedback: "`b` has no quotes in `print(b)`, so Python prints the value it refers to.",
          },
        ],
        answer: "ten",
        explanation: "`b = a` copies nothing and links nothing: it makes `b` refer to the value `a` had then, 10. Rebinding `a` later doesn't touch `b`.",
      },
    },
  ]),
};

/**
 * Chapter 2, lesson 5: rebinding a name. predict-score, reflect-earlier-print and
 * practice-player-level come from the Phase 3 variables lesson (ids kept).
 */
export const reassignment: Lesson = {
  id: "reassignment",
  title: "Changing Values with Reassignment",
  description: "Make a name refer to a new value, trace score = score + 5 event by event, and see why b = a doesn't link the names.",
  status: "published",
  objectives: [
    "Explain the order of events in `score = score + 5`: read, calculate, then rebind.",
    "Explain why a name keeps its old value until the assignment finishes.",
    "Explain why `b = a` doesn't link `b` to `a`.",
    "Trace a short program and give each variable's value after every line.",
  ],
  references: ["concept.variable", "python.operators.assignment", "concept.expression"],
  sections: [
    {
      id: "why",
      title: "Values that change",
      blocks: [
        {
          type: "text",
          text: "A game score goes up every time you collect a coin. A bank balance changes with every payment. Programs constantly need a value **based on the old one**: the score plus 5, the balance minus 20. Python does this by making the same name refer to a new value. That's called **reassignment** (or rebinding the name).",
        },
      ],
    },
    {
      id: "event-by-event",
      title: "score = score + 5, one event at a time",
      blocks: [
        {
          type: "text",
          text: "In maths, `score = score + 5` is impossible: nothing equals itself plus 5. In Python it's an instruction, and the order of events makes it work. Step through it slowly.",
        },
        {
          type: "code",
          language: "python",
          code: scoreReassign.code,
          caption: "Line 2 takes four events. It stops before the result appears and asks what `score` refers to.",
          walkthrough: scoreReassign,
        },
        {
          type: "list",
          ordered: true,
          items: [
            "**Read:** Python looks up the value `score` refers to now: `10`.",
            "**Calculate:** it works out `10 + 5`.",
            "**Produce:** the result is a new value, `15`. Nothing refers to it yet.",
            "**Rebind:** `score` now refers to `15`. This is the only moment `score` changes.",
            "**Print:** line 4 looks up `score` and shows `15`.",
          ],
        },
        {
          type: "callout",
          tone: "execution",
          text: "The right side is always finished before the name on the left changes. That's why a line can use a variable's old value to work out its new one.",
        },
        {
          type: "reflect",
          id: "reflect-earlier-print",
          prompt: "Line 2 printed `10`. After line 3, `score` refers to 15. Why doesn't the `10` already on the screen change to `15`?",
          code: `score = 10
print(score)
score = 15
print(score)`,
          answer:
            "`print()` shows the value at the moment its line runs. When line 2 ran, `score` referred to 10, so 10 went on the screen, and that's finished. Line 3 changes what `score` refers to from then on. It doesn't go back and redo earlier lines. To see the new value, the program has to print again, which is what line 4 does.",
        },
      ],
    },
    {
      id: "between-names",
      title: "b = a doesn't link the names",
      blocks: [
        {
          type: "text",
          text: "When one variable is assigned from another, Python looks up the value and makes the new name refer to that value. The two names aren't connected afterwards.",
        },
        {
          type: "code",
          language: "python",
          code: independentNames.code,
          caption: "Predict line 5 before you reveal it.",
          walkthrough: independentNames,
        },
        {
          type: "text",
          text: "After line 2, both names refer to the same value, 10. Line 3 moves only `a` to 20. A name refers to a **value**, never to another name, so changing `a` can't drag `b` along with it.",
        },
        {
          type: "callout",
          tone: "other-languages",
          title: "Coming later",
          text: "With lists, which can be changed in place, two names referring to one list behave differently. Chapter 7 covers that. Numbers and strings can't be changed in place, so for them, rebinding one name never affects another.",
        },
      ],
    },
    {
      id: "tracing",
      title: "Trace it yourself",
      blocks: [
        {
          type: "callout",
          tone: "mindset",
          title: "Keep a table",
          text: "For each line, write down every variable and the value it refers to after that line runs. Only the name on the left of `=` can change.",
        },
        {
          type: "question",
          id: "predict-score",
          variant: "predict",
          prompt: "What does this program print?",
          code: `score = 5
best = score
score = score + 1
print(best)`,
          choices: [
            { id: "5", text: "`5`" },
            {
              id: "6",
              text: "`6`",
              feedback:
                "Line 3 changes what `score` refers to. Does it change what `best` refers to? Work out what each name refers to after every line.",
            },
            {
              id: "score",
              text: "`score`",
              feedback: "There are no quotes around `best` on line 4, so Python prints a value, not a word.",
            },
            {
              id: "error",
              text: "An error, because `best` and `score` are linked",
              feedback: "Two names can refer to the same value without causing an error. What does each one refer to after line 3?",
            },
          ],
          answer: "5",
          hint: "Line 2 makes `best` refer to the value `score` refers to at that moment.",
          explanation:
            "Line 2 makes `best` refer to the value `score` refers to then: 5. Line 3 works out 5 + 1 and makes `score` refer to 6. Only `score` moved, so `best` still refers to 5.",
        },
        {
          type: "question",
          id: "predict-trace-points",
          variant: "predict",
          prompt: "Trace all four assignments. What does the last line print?",
          code: `points = 4
bonus = points
points = points * 2
bonus = bonus + 1
print(points, bonus)`,
          choices: [
            { id: "right", text: "`8 5`" },
            {
              id: "linked",
              text: "`8 9`",
              feedback: "That assumes `bonus` followed `points` to 8 on line 3. Line 3 only rebinds `points`. What did `bonus` refer to just before line 4?",
            },
            {
              id: "unchanged",
              text: "`4 5`",
              feedback: "Line 3 does change `points`: it works out `4 * 2` and rebinds `points` to the result.",
            },
            {
              id: "both-old",
              text: "`8 4`",
              feedback: "Line 4 rebinds `bonus` too: it reads `bonus` (4), adds 1, and makes `bonus` refer to the result.",
            },
          ],
          answer: "right",
          hint: "After line 2 both names refer to 4. Then each later line changes only the name on its left.",
          explanation:
            "Line 1: `points` → 4. Line 2: `bonus` → 4. Line 3: `points` → 4 × 2 = 8 (`bonus` is still 4). Line 4: `bonus` → 4 + 1 = 5. So it prints `8 5`.",
        },
      ],
    },
    {
      id: "practice",
      title: "Your turn",
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
            "Line 3 works out `level + 1` while `level` still refers to 1, then rebinds `level` to 2. The prints come last, so they show the values after the level-up.",
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
    {
      id: "key-ideas",
      title: "Key ideas",
      blocks: [
        {
          type: "list",
          items: [
            "Reassignment makes an existing name refer to a new value.",
            "In `score = score + 5`, Python reads, calculates and produces the result first; `score` changes only at the final rebind.",
            "`b = a` makes `b` refer to `a`'s current value. Later changes to `a` don't affect `b`.",
            "To trace a program, track every variable's value after each line. Only the name on the left of `=` changes.",
          ],
        },
      ],
    },
  ],
};
