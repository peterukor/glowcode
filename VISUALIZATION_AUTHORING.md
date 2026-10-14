# Visualization Authoring Guide

How to write a step-by-step walkthrough: the read-only player that shows code on the left and
a diagram on the right, one execution event at a time. For how the engine is built, see
[`GLOWCODE_ARCHITECTURE.md`](./GLOWCODE_ARCHITECTURE.md#visualization-engine). For how a
walkthrough is attached to a lesson, see [`LESSON_AUTHORING.md`](./LESSON_AUTHORING.md).

Walkthroughs are written by hand and verified. Students never edit or run the code.

## 1. How execution steps work

A walkthrough is code plus a list of **steps**. A step is one **execution event**, not one
line:

- `count = count + 2` is three events on line 2: read `count`, calculate `3 + 2`, rebind
  `count` to 5.
- A loop runs the same lines again; each run is new events.
- A line that does nothing visible (an `else:` line, a blank line) has no event.

Each step records the state **after** its event: the line, every variable, and everything
printed so far. Because every step is complete, the player can show any step on its own, which
is why Previous and Reset are exact.

## 2. Associating steps with code

`line` is the 1-indexed line the event belongs to. The player highlights it and says when the
line didn't simply move on ("same line, next step", "running again (3rd time)").

In a lesson, the walkthrough's `code` must be exactly the code block's `code`. Define the
walkthrough above the lesson and reuse it (`code: birthday.code`); the validator checks they
match.

## 3. Defining variable states

Write steps with `buildSteps` from `src/walkthrough/build.ts`. Each event says only what
changed, and everything else carries forward:

| Field | Meaning |
| --- | --- |
| `set: { count: py.int(5) }` | variables this event creates or changes (`py.int`, `py.float`, `py.str`, `py.bool`, `py.list`, `py.tuple`, `py.dict`, `py.set`, `py.none`) |
| `unset: ["person"]` | variables that stop existing (a function's locals after it returns) |
| `print: ["5"]` | lines this event prints (a call's `prints` are added automatically when it shows its result) |

The one variable an event changes is highlighted automatically. The player shows variables as
names that refer to values, with words for what's happening: **reading** while an event looks
a value up, **changed** plus "was 3" when an event rebinds a name.

Collections take an optional object id as their second argument: `py.list([1, 2], "a")`.
Give two names the same id when they refer to one object (`b = a`) and different ids for a
copy (`c = a.copy()`). The diagrams draw shared names as two arrows into one object, and
`check:python` compares the ids with Python's `id()`. Dicts are written as entries,
`py.dict([["ada", 36]])`, in insertion order; sets in the order Python iterates them.

You can also write full `TraceStep` objects (`vars`, `output`). That's the format a future
tracer will produce; `buildSteps` only fills it in for you.

## 4. Choosing visualization kinds

`visualizations` lists the views students can switch between; the first is shown by default.
When the main view isn't `variables`, the variables still appear in a card below it.

| Kind | Use it for | Needs |
| --- | --- | --- |
| `variables` | assignment and reassignment | nothing extra |
| `flow` | if / elif / else, `and` / `or` | `ifChain` on the walkthrough and on steps |
| `loop` | `for` over any iterable, or `while` | `forLoop` or `whileLoop` on the walkthrough and on steps (the older `loopItems` + `loopIndex` still work) |
| `function` | built-in and user-defined calls, methods, nested calls | `call` on the steps that call something |
| `collections` | lists, tuples, dicts, sets, indexed strings; mutation and shared objects | collections in `vars`; `element`, `slice`, `mutation`, `membership` to mark what an event does |
| `stack` | user-defined functions calling each other | `frame` and `callers` on the steps inside a function |

An empty list shows just the code and the printed output.

## 5. Specifying what glows

You never name diagram nodes by hand or rely on note text. Each extension has an explicit
state, and the renderer derives what glows from it:

- **Calculations:** `calc: { target, parts, result, phase }`, with `phase` `"read"`, `"calculate"`
  or `"assign"`. While reading, the names' values glow and the result shows `?`; while
  calculating, operands, operator and result glow; on assign, the result and the name glow.
  Give names their current value (`{ code: "count", value: "3" }`); literals and operators
  need no value. Before `"assign"`, the variable must still hold its old value.
- **Conditionals:** `ifChain.results` lists the comparisons Python has evaluated, and `at`
  says where execution is (see section 6).
- **For loops:** `forLoop: { at, index, bodyLine }` (section 12).
- **While loops:** `whileLoop: { checks, at, result, bodyLine }` is the check count, where
  execution is (`"check"`, `"body"`, `"exit"`), the latest result and the body line running.
- **Calls:** `call.phase` (section 8).
- **Collections:** `element`, `slice`, `mutation` and `membership` (section 13).
- **Expression trees:** `calc.tree`, `calc.active`, `calc.done` (section 14).
- **Call stack:** `frame` and `callers` (section 15).

Results only appear in the event that produces them, so the full diagram never gives away
what happens next.

## 6. Conditional paths

The walkthrough's `ifChain` describes the structure once: branches with ids, each with a
condition. Conditions are comparisons (`{ kind: "compare", id, code }`) or `and` / `or` groups
(`{ kind: "boolop", id, op, operands }`). Each step's `ifChain` gives:

- `results`: `{ c1: true }` for every comparison Python has evaluated **so far**. Leave out
  anything Python skipped: `False and …` and `True or …` never evaluate the right side, and
  once a branch is taken, later branches aren't checked. The validator rejects violations.
- `at`: `{ kind: "test", branch }`, `{ kind: "body", branch }`, `{ kind: "else" }` or
  `{ kind: "after" }`.

The flowchart derives the rest: True / False marks, the path taken, skipped branches dimmed,
short-circuited comparisons dashed.

## 7. Prediction checkpoints

Add `checkpoint` to the step whose result is worth predicting. The player stops on the step
before, asks, and only shows the step once the student reveals it (after answering, or by
choosing to skip). Previous / Next never ask again; Reset does.

```ts
checkpoint: {
  prompt: "`count` now refers to 4. What happens at the `while` line?",
  choices: [{ id: "stop", text: "…" }, { id: "print", text: "…", feedback: "Why this is wrong, without the answer." }],
  answer: "stop",
  explanation: "Shown with the revealed step, whatever the student chose.",
}
```

One or two per walkthrough. Not on the first step. The prompt may only use what's already on
screen.

## 8. Function outputs

`call` draws inputs → function → outputs → where the result goes. Returned values, printed
output and changes to an object are separate slots, because they are different things:

```ts
{ name: "len", args: ['"cat"'], returns: "3", assignTo: "length", phase: "result" }
{ name: "print", args: ['"Hello"'], prints: ["Hello"], returns: "None", phase: "result" }
{ name: "append", receiver: "items", receiverValue: "['pen']", args: ['"apple"'], changes: "['pen', 'apple']", returns: "None", phase: "result" }
```

For user-defined functions add `params: ["a", "b"]` (matched to `args` by position). For a
call nested in another, `print(len("hello"))`, give the inner call `feeds: "print()"` and the
outer call `argFrom: { 0: "len()" }`, and write the inner call's events first.

Phases: `"call"` (arguments go in), `"run"` (a user-defined function's body runs), `"result"`
(outputs appear; before this they show `?`), `"assign"` (the returned value is stored in
`assignTo`). Leave out slots that don't apply, or that the lesson isn't ready for (print's
`None` in a first lesson). Write values as Python would show them.

## 9. Validating a walkthrough

- `bun run test` runs `validateWalkthrough` on every walkthrough in the app and checks that ids
  are unique. It reports, step by step: missing notes, lines that don't exist, output that
  disappears, malformed values, a variable changing before its assign event or not holding the
  calculated result, a stored return value that doesn't match, comparisons in an order Python
  wouldn't evaluate (or that it would skip), loop checks going backwards, and predictions
  without a correct choice.
- `bun run check:python` replays the walkthrough in real Python: which lines run and in what
  order (inside functions and generators too), the variables and output after every event,
  which names share one object, every frame's variables on the call stack, each calculation
  and expression-tree node, every membership test, and every condition you said was True or
  False. Part-way through a line, each variable may show its value from before or after
  the line (pop has removed the item, `last` isn't assigned yet), but nothing else.
  Walkthroughs with `input()`, classes or imports are checked by their final state.
- Open `/dev/visualizations?w=<id>` and step through it, including back and Reset, on a
  narrow window too.

## 10. Creating a new visualization component

1. Decide what the diagram needs that a step doesn't already say. Add one focused, optional
   extension to `src/types/trace.ts`: structure on `Walkthrough` (drawn from the first
   event), per-event state on `TraceStep`.
2. Write the renderer in `src/visualizations/`. It takes data and draws the **whole**
   structure every time as SVG inside a `.flow` wrapper, so it uses the flow tree's parts
   (section 16). Mark state with `data-look` (`idle`, `lit`, `true`, `false`, `done`, `dim`),
   give every state words as well as a glow (and an `sr-only` summary), and don't reveal
   results the current event hasn't produced.
3. Add a `VisualizationKind` and a case in `ExampleVisualization`, plus a label in
   `labels.ts`.
4. Teach the validator the new extension's rules, and `replay.ts` how to check it against
   Python if it makes claims Python can verify.
5. Add a walkthrough that uses it, a featured entry in the showcase, and tests.

## 11. Traces from a future editor

The editable IDE is a future phase. When it comes, a language tracer will produce the same
`Walkthrough` / `TraceStep` data, and the player and renderers will draw it unchanged. Notes
are optional for that reason. `scripts/check-python.ts` already records Python line events
(state before each line, in the main program, functions and generators, with every frame and
the `id()` of each collection), and `src/walkthrough/replay.ts` shows how those events line up with
steps; a tracer turns them into steps directly, adding `calc`, `ifChain`, `whileLoop` and
`call` from what it observes. Nothing in the engine assumes a person wrote the trace.

## 12. For loops

Describe the loop once on the walkthrough:

```ts
forLoop: { target: "number", iterable: "numbers", kind: "list", items: [10, 20, 30], body: ["print(number)"], after: 'print("done")' }
```

`kind` is `list`, `tuple`, `str`, `range`, `dict` (items are the keys), `set` (items in the
order this run produced) or `generator` (values are shown as `?` until produced). Each lap is
three or more events, with `forLoop: { at, index }` on each:

| `at` | Line | What students see |
| --- | --- | --- |
| `"next"` | the `for` line | "Next item available?" answers Yes; item `index` lifts out of the iterable and travels to the question |
| `"assign"` | the `for` line | the value travels into the loop variable; the step's `vars` hold it |
| `"body"` + `bodyLine` | a body line | the item settles back in place; that body line glows |
| `"exit"` | the `for` line (and the line after) | the answer is No; the way out glows; every item is ticked |

For a generator, the generator's own lines run between `"next"` and `"assign"`: give those
steps `frame` / `callers` (they run in the generator) and keep `forLoop` at `"next"`. The
final ask uses `index` equal to the number of items before `"exit"`.

The iterable shows at most five items and slides so the current one stays in view, with "…"
only on a side where items are hidden. You never choose the window; it is derived.

## 13. Collections: indexes, slices, changes, shared objects

- `element: { name, index }` marks the item an event uses; negative indexes show the
  counting from the end. For dicts, `element: { name, key }`.
- `slice: { name, start, stop }` selects `start` to `stop - 1` and labels start and stop.
- `mutation: { name, kind, index?, key?, value?, removed? }` says the object changed in place
  (`append`, `insert`, `set`, `pop`, `remove`, `add`, `discard`, `set-key`, `delete-key`). The
  validator works out the new value from the old one and checks the object id stayed the same.
- `membership: { name, value, result }` is an `in` test; the validator checks the result.

For `x = items.pop()`, write three events on one line: the call (with `element` on the last
item), the item leaving (`mutation` of kind `pop` with `removed`, `call.phase: "result"`), and
the assignment (`call.phase: "assign"`), which shows the returned value separately.

Strings appear in the collections view only when the walkthrough indexes or slices them;
other strings stay in the variables view.

## 14. Expression trees

For a calculation with more than one operator, add `calc.tree`: operands are
`{ id, code, value? }`, operators `{ id, code, op, left, right }`, and each node's `code` is
valid Python (`"3 * 2"`). Work it out one operator per event: `active` is the operator being
worked out and `done` holds the results so far, `{ mul: "6" }`. The validator checks that
children are worked out before their parent and that the root equals `result`;
`check:python` evaluates every node.

## 15. The call stack

Steps that run inside a function say so: `frame: "add_one"`, with `vars` holding only that
call's variables, and `callers` listing the frames waiting for it, main program first:
`[{ name: "<module>", vars: {}, calling: "double(4)" }, { name: "double", vars: { n: 4 }, calling: "add_one(n)" }]`.
The stack view stacks the frames newest first, draws "calls …" between them, a "returns …"
arrow when the top frame returns, and leaves a finished frame as a faded outline for one
step. Back in the caller, the step has no `frame` (or the caller's).

## 16. How diagrams are drawn

Every diagram sits on the dark **stage** (`.viz-stage`), in both themes, so glows read
clearly; it uses the dark-theme tokens. Diagrams are SVG built from the flow tree's parts
(`src/visualizations/conditional/ConditionalFlow.tsx`, styled under `.flow` in `styles.css`):
code boxes (`flow-block`), frames with a folder tab (`flow-frame`), routed connectors with
rounded corners (`flow-edge`, with an arrowhead from `arrowHead`), pills on lines
(`flow-label`), a decision diamond (`flow-decision`), and the travelling value
(`loop-chip`). Geometry helpers live in `src/visualizations/flow/geometry.ts`; the loop
layout in `src/visualizations/loops/loopLayout.ts` is pure and testable.

Looks are shared: `lit` (what Python is doing now: glows, with a moving sparkle on lines),
`true` / `false` (a decision's answer), `done` (ran earlier: solid, quietly violet), `dim`
(skipped: dashed and faded), `idle`. Motion explains a state change (a value travelling, an
item lifting out, a frame leaving), uses the `--ease-out` / `--ease-in-out` curves, and is
replaced by a fade under reduced motion.

## A complete example

```ts
import type { Walkthrough } from "@/types/trace";
import { buildSteps, py } from "@/walkthrough/build";

const total = (phase: "read" | "calculate" | "assign") => ({
  target: "price",
  parts: [{ code: "price", value: "20" }, { code: "-" }, { code: "5" }],
  result: "15",
  phase,
});

export const discount: Walkthrough = {
  id: "py-discount",                       // unique across the app, never changed
  title: "Applying a discount",
  language: "python",
  visualizations: ["flow", "variables"],   // the first one is shown by default
  code: `price = 20
if price > 10:
    price = price - 5
print(price)`,
  ifChain: {
    branches: [{ id: "b1", keyword: "if", condition: { kind: "compare", id: "c1", code: "price > 10" }, body: ["price = price - 5"] }],
    after: "print(price)",
  },
  steps: buildSteps([
    { line: 1, set: { price: py.int(20) }, ifChain: { results: {} }, note: "price refers to 20." },
    {
      line: 2,
      ifChain: { results: { c1: true }, at: { kind: "test", branch: "b1" } },
      note: "Is 20 > 10? True, so Python runs the indented line.",
      checkpoint: {
        prompt: "`price` refers to 20. Will the indented line run?",
        choices: [
          { id: "yes", text: "Yes, because `20 > 10` is True" },
          { id: "no", text: "No", feedback: "Work out `20 > 10` with the real value." },
        ],
        answer: "yes",
        explanation: "20 > 10 is True, so the if block runs.",
      },
    },
    { line: 3, calc: total("read"), ifChain: { results: { c1: true }, at: { kind: "body", branch: "b1" } }, note: "Python looks up price: 20." },
    { line: 3, calc: total("calculate"), ifChain: { results: { c1: true }, at: { kind: "body", branch: "b1" } }, note: "20 - 5 is 15. price still refers to 20." },
    {
      line: 3,
      set: { price: py.int(15) },
      calc: total("assign"),
      ifChain: { results: { c1: true }, at: { kind: "body", branch: "b1" } },
      note: "price is rebound to 15.",
    },
    { line: 4, print: ["15"], ifChain: { results: { c1: true }, at: { kind: "after" } }, note: "print() shows 15." },
  ]),
};
```
