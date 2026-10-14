// Walkthroughs for the Python visualizations: lists, strings, dicts, sets, for loops over
// every kind of iterable, precedence, nested calls and the call stack. They appear in the
// developer showcase (/dev/visualizations) and are replayed in real Python like every other
// walkthrough (scripts/check-python.ts). Lessons can reuse any of them.

import type { PyItem } from "@/types/python";
import type { CallerFrame, ForLoopTrace, TraceStep, Walkthrough } from "@/types/trace";
import { buildSteps, py, type StepInput } from "@/walkthrough/build";

const quote = (s: string) => `"${s}"`;

// ---------------------------------------------------------------- shared references

const sharedList: Walkthrough = {
  id: "py-shared-list",
  title: "Two names, one list",
  language: "python",
  visualizations: ["collections", "variables"],
  code: `a = [1, 2, 3]
b = a
b.append(4)
c = a.copy()
c.append(5)
print(a, c)`,
  steps: buildSteps([
    { line: 1, set: { a: py.list([1, 2, 3], "first") }, note: "Python makes a list object, and the name a refers to it." },
    {
      line: 2,
      set: { b: py.list([1, 2, 3], "first") },
      note: "b = a doesn't copy anything. b now refers to the same list object as a: one list, two names.",
      checkpoint: {
        prompt: "Next, `b.append(4)` runs. What will `a` refer to afterwards?",
        choices: [
          { id: "four", text: "`[1, 2, 3, 4]`" },
          { id: "same", text: "`[1, 2, 3]`", feedback: "`a` and `b` aren't two lists. They are two names for one list, so a change through `b` is a change to the list `a` refers to." },
          { id: "error", text: "An error", feedback: "Lists can change in place, and `append` is allowed on any list." },
        ],
        answer: "four",
        explanation: "There is only one list. `b.append(4)` changes that list, so both names see `[1, 2, 3, 4]`.",
      },
    },
    {
      line: 3,
      set: { a: py.list([1, 2, 3, 4], "first"), b: py.list([1, 2, 3, 4], "first") },
      mutation: { name: "b", kind: "append", index: 3, value: 4 },
      highlight: "b",
      note: "append changes the list itself. a sees the 4 too, because a and b are the same list.",
    },
    { line: 4, set: { c: py.list([1, 2, 3, 4], "copy") }, note: "a.copy() makes a new list with the same items. c refers to that separate object." },
    {
      line: 5,
      set: { c: py.list([1, 2, 3, 4, 5], "copy") },
      mutation: { name: "c", kind: "append", index: 4, value: 5 },
      note: "Changing the copy leaves the original alone: only c's list gets the 5.",
    },
    { line: 6, print: ["[1, 2, 3, 4] [1, 2, 3, 4, 5]"], note: "a and b share one list; c has its own." },
  ]),
};

// ---------------------------------------------------------------- precedence

const precedenceTree = {
  id: "add",
  code: "4 + 3 * 2",
  op: "+",
  left: { id: "four", code: "4" },
  right: { id: "mul", code: "3 * 2", op: "*", left: { id: "three", code: "3" }, right: { id: "two", code: "2" } },
};
const precedenceCalc = (phase: "read" | "calculate" | "assign", active: string | undefined, done: Record<string, string>) => ({
  target: "result",
  parts: [{ code: "4" }, { code: "+" }, { code: "3" }, { code: "*" }, { code: "2" }],
  result: "10",
  phase,
  tree: precedenceTree,
  ...(active ? { active } : {}),
  done,
});

const precedence: Walkthrough = {
  id: "py-precedence",
  title: "Which part first?",
  language: "python",
  visualizations: ["variables"],
  code: `result = 4 + 3 * 2
print(result)`,
  steps: buildSteps([
    { line: 1, calc: precedenceCalc("read", undefined, {}), note: "Before working anything out, Python reads the whole right side and sees two operators." },
    {
      line: 1,
      calc: precedenceCalc("calculate", "mul", { mul: "6" }),
      note: "* comes before +, so Python works out 3 * 2 first: 6. The + waits for it.",
      checkpoint: {
        prompt: "In `4 + 3 * 2`, which part does Python work out first?",
        choices: [
          { id: "mul", text: "`3 * 2`" },
          { id: "add", text: "`4 + 3`", feedback: "Python doesn't just go left to right: `*` binds tighter than `+`, so the multiplication happens first." },
        ],
        answer: "mul",
        explanation: "Multiplication comes before addition. The tree shows it: the answer of `3 * 2` flows down into the `+`, so it has to be finished first.",
      },
    },
    { line: 1, calc: precedenceCalc("calculate", "add", { mul: "6", add: "10" }), note: "Now the + has both sides: 4 + 6 is 10." },
    { line: 1, set: { result: py.int(10) }, calc: precedenceCalc("assign", undefined, { mul: "6", add: "10" }), note: "result now refers to 10, not 14." },
    { line: 2, print: ["10"], note: "print shows 10." },
  ]),
};

// ---------------------------------------------------------------- list changes

const listOps: Walkthrough = {
  id: "py-list-changes",
  title: "Changing a list",
  language: "python",
  visualizations: ["collections", "variables"],
  code: `items = ["a", "b", "c", "d"]
items[1] = "B"
items.insert(0, "z")
items.remove("c")
last = items.pop()
part = items[1:3]
print(items, last, part)`,
  steps: buildSteps([
    { line: 1, set: { items: py.list(["a", "b", "c", "d"], "items") }, note: "A list of four items, at indexes 0 to 3." },
    {
      line: 2,
      set: { items: py.list(["a", "B", "c", "d"], "items") },
      mutation: { name: "items", kind: "set", index: 1, value: "B", removed: "b" },
      note: 'items[1] = "B" replaces the item at index 1. Same list, one slot changed.',
    },
    {
      line: 3,
      set: { items: py.list(["z", "a", "B", "c", "d"], "items") },
      mutation: { name: "items", kind: "insert", index: 0, value: "z" },
      note: 'insert(0, "z") puts "z" at index 0. Every other item moves up one index.',
    },
    {
      line: 4,
      set: { items: py.list(["z", "a", "B", "d"], "items") },
      mutation: { name: "items", kind: "remove", index: 3, value: "c" },
      note: 'remove("c") finds the first "c" and takes it out. The items after it move down.',
    },
    {
      line: 5,
      element: { name: "items", index: -1 },
      call: { name: "pop", receiver: "items", receiverValue: "['z', 'a', 'B', 'd']", args: [], returns: quote("d"), assignTo: "last", phase: "call" },
      note: "pop() with no index takes the last item.",
    },
    {
      line: 5,
      set: { items: py.list(["z", "a", "B"], "items") },
      mutation: { name: "items", kind: "pop", index: 3, removed: "d" },
      call: { name: "pop", receiver: "items", receiverValue: "['z', 'a', 'B', 'd']", args: [], returns: quote("d"), changes: "['z', 'a', 'B']", assignTo: "last", phase: "result" },
      note: '"d" leaves the list, and pop() hands it back as its returned value.',
    },
    {
      line: 5,
      set: { last: py.str("d") },
      call: { name: "pop", receiver: "items", receiverValue: "['z', 'a', 'B', 'd']", args: [], returns: quote("d"), changes: "['z', 'a', 'B']", assignTo: "last", phase: "assign" },
      note: 'last refers to the returned value, "d". The list no longer has it.',
    },
    {
      line: 6,
      slice: { name: "items", start: 1, stop: 3 },
      note: "items[1:3] starts at index 1 and stops before index 3: indexes 1 and 2.",
      checkpoint: {
        prompt: "`items` is `['z', 'a', 'B']`. What is `items[1:3]`?",
        choices: [
          { id: "two", text: "`['a', 'B']`" },
          { id: "three", text: "`['z', 'a', 'B']`", feedback: "The slice starts at index 1, so `'z'` (index 0) isn't in it." },
          { id: "error", text: "An error, because there is no index 3", feedback: "The stop of a slice is left out, and slices never raise errors for going past the end." },
        ],
        answer: "two",
        explanation: "The start is included and the stop is left out: indexes 1 and 2, which hold `'a'` and `'B'`.",
      },
    },
    { line: 6, set: { part: py.list(["a", "B"], "part") }, slice: { name: "items", start: 1, stop: 3 }, note: "The slice is a new list. items is unchanged." },
    { line: 7, print: ["['z', 'a', 'B'] d ['a', 'B']"], note: "Printing all three." },
  ]),
};

// ---------------------------------------------------------------- long list

const temps = [12, 15, 11, 18, 21, 19, 24, 17, 14];
const longList: Walkthrough = {
  id: "py-long-list",
  title: "A longer list",
  language: "python",
  visualizations: ["collections", "variables"],
  code: `temps = [12, 15, 11, 18, 21, 19, 24, 17, 14]
hottest = temps[6]
temps[8] = 16
print(hottest, temps[-1])`,
  steps: buildSteps([
    { line: 1, set: { temps: py.list(temps, "temps") }, note: "Nine temperatures. Only a few fit on screen at once; the … shows there are more." },
    { line: 2, element: { name: "temps", index: 6 }, note: "temps[6]: the view slides along so index 6 is in sight. Indexes stay the real ones." },
    { line: 2, set: { hottest: py.int(24) }, element: { name: "temps", index: 6 }, note: "hottest refers to 24." },
    {
      line: 3,
      set: { temps: py.list([...temps.slice(0, 8), 16], "temps") },
      mutation: { name: "temps", kind: "set", index: 8, value: 16, removed: 14 },
      note: "temps[8] = 16 changes the last item. The view slides to the end; nothing is hidden after it.",
    },
    { line: 4, element: { name: "temps", index: -1 }, print: ["24 16"], note: "temps[-1] counts from the end: -1 is the last item, the same slot as index 8." },
  ]),
};

// ---------------------------------------------------------------- for loops

/** One for-loop lap: ask for the next item, assign it, then run each body event. */
function lap(line: number, target: string, item: PyItem, index: number, value: StepInput["set"], body: StepInput[], ask = "Next item available? Yes.") {
  const at = (s: ForLoopTrace["at"]): ForLoopTrace => ({ at: s, index });
  return [
    { line, forLoop: at("next"), note: `${ask} Item ${index + 1} rises out of the iterable.` },
    { line, set: value, forLoop: at("assign"), note: `${target} now refers to ${typeof item === "string" ? `"${item}"` : String(item)}.` },
    ...body.map((b) => ({ ...b, forLoop: b.forLoop ?? { at: "body" as const, index, bodyLine: 0 } })),
  ] as StepInput[];
}

const forList: Walkthrough = {
  id: "py-for-list",
  title: "for over a list",
  language: "python",
  visualizations: ["loop", "variables"],
  forLoop: { target: "number", iterable: "numbers", kind: "list", items: [10, 20, 30], body: ["print(number)"], after: 'print("done")' },
  code: `numbers = [10, 20, 30]
for number in numbers:
    print(number)
print("done")`,
  steps: buildSteps([
    { line: 1, set: { numbers: py.list([10, 20, 30], "numbers") }, note: "numbers refers to a list of three items." },
    ...lap(2, "number", 10, 0, { number: py.int(10) }, [{ line: 3, print: ["10"], note: "The body runs with number = 10." }]),
    ...lap(2, "number", 20, 1, { number: py.int(20) }, [{ line: 3, print: ["20"], note: "Back up the loop: the body runs again, now with 20." }], "Back to the top: is there another item? Yes."),
    ...lap(2, "number", 30, 2, { number: py.int(30) }, [{ line: 3, print: ["30"], note: "The last lap." }]).map((s, i) =>
      i === 0
        ? {
            ...s,
            checkpoint: {
              prompt: "`number` refers to 20 and the list is `[10, 20, 30]`. What happens at the `for` line now?",
              choices: [
                { id: "30", text: "`number` gets the next item, `30`" },
                { id: "stop", text: "The loop ends", feedback: "There is still one item the loop hasn't used: 30." },
                { id: "restart", text: "`number` starts again at `10`", feedback: "A for loop never goes back. Each item is used once, in order." },
              ],
              answer: "30",
              explanation: "Each lap takes the next unused item. 30 hasn't been used yet, so it's next.",
            },
          }
        : s,
    ),
    { line: 2, forLoop: { at: "exit", index: 3 }, note: "Next item available? No: every item has been used, so the loop ends." },
    { line: 4, print: ["done"], forLoop: { at: "exit", index: 3 }, note: "Python carries on after the loop. number still refers to 30." },
  ]),
};

const word = "python";
const forString: Walkthrough = {
  id: "py-for-string",
  title: "for over a string",
  language: "python",
  visualizations: ["loop", "variables"],
  forLoop: { target: "letter", iterable: `"${word}"`, kind: "str", items: [...word], body: ["print(letter)"] },
  code: `for letter in "${word}":
    print(letter)`,
  steps: buildSteps([
    ...[...word].flatMap((ch, i) =>
      lap(1, "letter", ch, i, { letter: py.str(ch) }, [{ line: 2, print: [ch], note: `print shows ${ch}.` }], i === 0 ? "A string gives one character at a time." : "Another character? Yes."),
    ),
    { line: 1, forLoop: { at: "exit", index: word.length }, note: "No characters left. The loop ends, and so does the program." },
  ]),
};

const forRange: Walkthrough = {
  id: "py-for-range",
  title: "for over range()",
  language: "python",
  visualizations: ["loop", "variables"],
  forLoop: { target: "i", iterable: "range(1, 4)", kind: "range", items: [1, 2, 3], body: ["total += i"], after: "print(total)" },
  code: `total = 0
for i in range(1, 4):
    total += i
print(total)`,
  steps: buildSteps([
    { line: 1, set: { total: py.int(0) }, note: "total starts at 0." },
    ...lap(2, "i", 1, 0, { i: py.int(1) }, [{ line: 3, set: { total: py.int(1) }, note: "total is 0 + 1." }], "range(1, 4) isn't a list: it makes 1 only now, when the loop asks."),
    ...lap(2, "i", 2, 1, { i: py.int(2) }, [{ line: 3, set: { total: py.int(3) }, note: "total is 1 + 2." }], "range makes the next number, 2."),
    ...lap(2, "i", 3, 2, { i: py.int(3) }, [{ line: 3, set: { total: py.int(6) }, note: "total is 3 + 3." }], "Then 3. The stop, 4, is never produced."),
    { line: 2, forLoop: { at: "exit", index: 3 }, note: "range(1, 4) has nothing left: it stops before 4." },
    { line: 4, print: ["6"], forLoop: { at: "exit", index: 3 }, note: "1 + 2 + 3 is 6." },
  ]),
};

const forTuple: Walkthrough = {
  id: "py-for-tuple",
  title: "for over a tuple",
  language: "python",
  visualizations: ["loop", "variables"],
  forLoop: { target: "size", iterable: "sizes", kind: "tuple", items: ["S", "M", "L"], body: ["print(size)"] },
  code: `sizes = ("S", "M", "L")
for size in sizes:
    print(size)`,
  steps: buildSteps([
    { line: 1, set: { sizes: py.tuple(["S", "M", "L"], "sizes") }, note: "A tuple: ordered like a list, but it can't be changed." },
    ...(["S", "M", "L"] as const).flatMap((s, i) => lap(2, "size", s, i, { size: py.str(s) }, [{ line: 3, print: [s], note: `print shows ${s}.` }])),
    { line: 2, forLoop: { at: "exit", index: 3 }, note: "No items left." },
  ]),
};

const forDict: Walkthrough = {
  id: "py-for-dict",
  title: "for over a dict",
  language: "python",
  visualizations: ["loop", "collections", "variables"],
  forLoop: { target: "name", iterable: "ages", kind: "dict", items: ["ada", "alan"], body: ["print(name, ages[name])"] },
  code: `ages = {"ada": 36, "alan": 41}
for name in ages:
    print(name, ages[name])`,
  steps: buildSteps([
    { line: 1, set: { ages: py.dict([["ada", 36], ["alan", 41]], "ages") }, note: "A dict pairs each key with a value." },
    ...lap(2, "name", "ada", 0, { name: py.str("ada") }, [{ line: 3, element: { name: "ages", key: "ada" }, print: ["ada 36"], note: 'Looping over a dict gives its keys. ages["ada"] looks up the value, 36.' }], "A dict gives its keys, in the order they were added."),
    ...lap(2, "name", "alan", 1, { name: py.str("alan") }, [{ line: 3, element: { name: "ages", key: "alan" }, print: ["alan 41"], note: 'ages["alan"] is 41.' }]),
    { line: 2, forLoop: { at: "exit", index: 2 }, note: "No keys left." },
  ]),
};

const forSet: Walkthrough = {
  id: "py-for-set",
  title: "for over a set",
  language: "python",
  visualizations: ["loop", "variables"],
  forLoop: { target: "n", iterable: "{30, 10, 20}", kind: "set", items: [10, 20, 30], body: ["print(n)"] },
  code: `for n in {30, 10, 20}:
    print(n)`,
  steps: buildSteps([
    ...[10, 20, 30].flatMap((n, i) =>
      lap(1, "n", n, i, { n: py.int(n) }, [{ line: 2, print: [String(n)], note: i === 0 ? "This run gave 10 first, not 30: a set doesn't keep the order you wrote." : `print shows ${n}.` }], i === 0 ? "A set has no positions, so Python picks the order." : "Another value? Yes."),
    ),
    { line: 1, forLoop: { at: "exit", index: 3 }, note: "Every value was used exactly once." },
  ]),
};

const main = (vars: TraceStep["vars"], calling: string): CallerFrame => ({ name: "<module>", vars, calling });
const genStep = (line: number, n: number, x: number | undefined, index: number, note: string): TraceStep => ({
  line,
  vars: { n: py.int(n) },
  frame: "countdown",
  callers: [main(x === undefined ? {} : { x: py.int(x) }, "the next value")],
  forLoop: { at: "next", index },
  ...(x === undefined ? {} : { output: Array.from({ length: 3 - x }, (_, k) => String(2 - k)) }),
  note,
});

const forGenerator: Walkthrough = {
  id: "py-for-generator",
  title: "for over a generator",
  language: "python",
  visualizations: ["loop", "stack", "variables"],
  forLoop: { target: "x", iterable: "countdown(2)", kind: "generator", items: [2, 1], body: ["print(x)"] },
  code: `def countdown(n):
    while n > 0:
        yield n
        n -= 1

for x in countdown(2):
    print(x)`,
  steps: [
    { line: 1, vars: {}, note: "Python learns the generator countdown. Nothing inside it runs yet." },
    { line: 6, vars: {}, forLoop: { at: "next", index: 0 }, note: "The loop asks countdown(2) for a value. The value isn't known yet: the generator has to run to make it." },
    genStep(2, 2, undefined, 0, "Inside the generator: is 2 > 0? True."),
    genStep(3, 2, undefined, 0, "yield n hands 2 to the loop and pauses the generator right here."),
    { line: 6, vars: { x: py.int(2) }, forLoop: { at: "assign", index: 0 }, note: "x refers to 2, the first value produced." },
    { line: 7, vars: { x: py.int(2) }, output: ["2"], forLoop: { at: "body", index: 0, bodyLine: 0 }, note: "print shows 2." },
    { line: 6, vars: { x: py.int(2) }, output: ["2"], forLoop: { at: "next", index: 1 }, note: "The loop asks for another value. The generator carries on from where it paused." },
    genStep(4, 1, 2, 1, "n -= 1: n is now 1."),
    genStep(2, 1, 2, 1, "Is 1 > 0? True."),
    genStep(3, 1, 2, 1, "yield hands over 1 and pauses again."),
    { line: 6, vars: { x: py.int(1) }, output: ["2"], forLoop: { at: "assign", index: 1 }, note: "x refers to 1." },
    { line: 7, vars: { x: py.int(1) }, output: ["2", "1"], forLoop: { at: "body", index: 1, bodyLine: 0 }, note: "print shows 1." },
    { line: 6, vars: { x: py.int(1) }, output: ["2", "1"], forLoop: { at: "next", index: 2 }, note: "The loop asks once more. Nobody knows yet whether there is another value." },
    genStep(4, 0, 1, 2, "n is now 0."),
    genStep(2, 0, 1, 2, "Is 0 > 0? False, so the generator's while loop ends, and so does the generator."),
    { line: 6, vars: { x: py.int(1) }, output: ["2", "1"], forLoop: { at: "exit", index: 2 }, note: "The generator finished without a value: no items left, so the for loop ends." },
  ],
};

// ---------------------------------------------------------------- strings, dicts, sets

const stringSlices: Walkthrough = {
  id: "py-string-slices",
  title: "Indexes and slices",
  language: "python",
  visualizations: ["collections", "variables"],
  code: `word = "python"
first = word[0]
last = word[-1]
middle = word[1:4]
print(first, last, middle)`,
  steps: buildSteps([
    { line: 1, set: { word: py.str("python") }, note: "A string is a sequence of characters, numbered from 0. It can't be changed in place." },
    { line: 2, element: { name: "word", index: 0 }, note: "word[0] is the first character." },
    { line: 2, set: { first: py.str("p") }, element: { name: "word", index: 0 }, note: 'first refers to "p".' },
    { line: 3, element: { name: "word", index: -1 }, note: "Negative indexes count from the end: -1 is the last character." },
    { line: 3, set: { last: py.str("n") }, element: { name: "word", index: -1 }, note: 'last refers to "n".' },
    {
      line: 4,
      slice: { name: "word", start: 1, stop: 4 },
      note: "word[1:4] starts at index 1 and stops before index 4.",
      checkpoint: {
        prompt: 'What is `"python"[1:4]`?',
        choices: [
          { id: "yth", text: '`"yth"`' },
          { id: "ytho", text: '`"ytho"`', feedback: "The stop index is left out: index 4 (`o`) isn't included." },
          { id: "pyth", text: '`"pyth"`', feedback: "Indexes start at 0, so index 1 is `y`, not `p`." },
        ],
        answer: "yth",
        explanation: "Start included, stop left out: indexes 1, 2 and 3, which are `y`, `t` and `h`.",
      },
    },
    { line: 4, set: { middle: py.str("yth") }, slice: { name: "word", start: 1, stop: 4 }, note: 'middle is a new string, "yth". word is unchanged.' },
    { line: 5, print: ["p n yth"], note: "Printing the three pieces." },
  ]),
};

const dictUpdate: Walkthrough = {
  id: "py-dict-update",
  title: "Looking up and changing a dict",
  language: "python",
  visualizations: ["collections", "variables"],
  code: `stock = {"apples": 3, "pears": 0}
count = stock["apples"]
stock["pears"] = 5
stock["kiwis"] = 2
del stock["apples"]
print(stock)`,
  steps: buildSteps([
    { line: 1, set: { stock: py.dict([["apples", 3], ["pears", 0]], "stock") }, note: "A dict: each key leads to a value." },
    { line: 2, element: { name: "stock", key: "apples" }, note: 'stock["apples"] looks up the key "apples".' },
    { line: 2, set: { count: py.int(3) }, element: { name: "stock", key: "apples" }, note: "count refers to its value, 3." },
    {
      line: 3,
      set: { stock: py.dict([["apples", 3], ["pears", 5]], "stock") },
      mutation: { name: "stock", kind: "set-key", key: "pears", value: 5, removed: 0 },
      note: '"pears" is already a key, so its value is replaced: 0 becomes 5.',
    },
    {
      line: 4,
      set: { stock: py.dict([["apples", 3], ["pears", 5], ["kiwis", 2]], "stock") },
      mutation: { name: "stock", kind: "set-key", key: "kiwis", value: 2 },
      note: '"kiwis" isn\'t a key yet, so assigning to it adds a new pair.',
    },
    {
      line: 5,
      set: { stock: py.dict([["pears", 5], ["kiwis", 2]], "stock") },
      mutation: { name: "stock", kind: "delete-key", key: "apples" },
      note: 'del removes the key "apples" and its value.',
    },
    { line: 6, print: ["{'pears': 5, 'kiwis': 2}"], note: "The same dict object all along, changed in place." },
  ]),
};

const setMembership: Walkthrough = {
  id: "py-set-membership",
  title: "Sets and in",
  language: "python",
  visualizations: ["collections", "variables"],
  code: `seen = {3, 1, 2}
seen.add(2)
seen.add(4)
found = 4 in seen
print(found, len(seen))`,
  steps: buildSteps([
    { line: 1, set: { seen: py.set([1, 2, 3], "seen") }, note: "A set keeps each value once, with no positions." },
    { line: 2, mutation: { name: "seen", kind: "add", value: 2 }, note: "2 is already in the set, so add(2) changes nothing." },
    { line: 3, set: { seen: py.set([1, 2, 3, 4], "seen") }, mutation: { name: "seen", kind: "add", value: 4 }, note: "4 is new, so it joins the set." },
    { line: 4, membership: { name: "seen", value: 4, result: true }, note: "4 in seen asks: is 4 one of the values? True." },
    { line: 4, set: { found: py.bool(true) }, membership: { name: "seen", value: 4, result: true }, note: "found refers to True." },
    { line: 5, print: ["True 4"], note: "Four values: adding 2 a second time didn't count." },
  ]),
};

// ---------------------------------------------------------------- conditionals

const idCheck: Walkthrough = {
  id: "py-id-check",
  title: "and, not, and skipping",
  language: "python",
  visualizations: ["flow", "variables"],
  code: `age = 17
has_id = True
if age >= 18 and has_id:
    print("Welcome")
elif not has_id:
    print("Bring your ID")
else:
    print("Too young")`,
  ifChain: {
    branches: [
      {
        id: "b1",
        keyword: "if",
        condition: {
          kind: "boolop",
          id: "g1",
          op: "and",
          operands: [
            { kind: "compare", id: "c1", code: "age >= 18" },
            { kind: "compare", id: "c2", code: "has_id" },
          ],
        },
        body: ['print("Welcome")'],
      },
      { id: "b2", keyword: "elif", condition: { kind: "compare", id: "c3", code: "not has_id" }, body: ['print("Bring your ID")'] },
    ],
    elseBody: ['print("Too young")'],
  },
  steps: buildSteps([
    { line: 1, set: { age: py.int(17) }, ifChain: { results: {} }, note: "age is 17." },
    { line: 2, set: { has_id: py.bool(true) }, ifChain: { results: {} }, note: "has_id is True." },
    {
      line: 3,
      ifChain: { results: { c1: false }, at: { kind: "test", branch: "b1" } },
      note: "Is 17 >= 18? False. With and, one False side is enough: Python never looks at has_id.",
      checkpoint: {
        prompt: "`age >= 18` is False. Does Python check `has_id` next?",
        choices: [
          { id: "skip", text: "No, the `and` is already False" },
          { id: "check", text: "Yes, it always checks both sides", feedback: "`and` needs both sides True. Once the left side is False, the answer can't change, so Python stops there." },
        ],
        answer: "skip",
        explanation: "This is called short-circuiting: `False and anything` is False, so the right side is skipped.",
      },
    },
    { line: 5, ifChain: { results: { c1: false, c3: false }, at: { kind: "test", branch: "b2" } }, note: "not has_id flips True to False, so this branch is skipped too." },
    { line: 8, print: ["Too young"], ifChain: { results: { c1: false, c3: false }, at: { kind: "else" } }, note: "Neither condition was True, so the else block runs." },
  ]),
};

// ---------------------------------------------------------------- calls

const nestedCall: Walkthrough = {
  id: "py-nested-call",
  title: "A call inside a call",
  language: "python",
  visualizations: ["function"],
  code: `print(len("hello"))`,
  steps: [
    { line: 1, vars: {}, call: { name: "len", args: ['"hello"'], returns: "5", feeds: "print()", phase: "call" }, note: 'Python works from the inside out. First len("hello") is called.' },
    {
      line: 1,
      vars: {},
      call: { name: "len", args: ['"hello"'], returns: "5", feeds: "print()", phase: "result" },
      note: "len returns 5. Nothing is printed yet: the 5 goes straight into print().",
      checkpoint: {
        prompt: '`len("hello")` has returned `5`. What is on the screen now?',
        choices: [
          { id: "nothing", text: "Nothing yet" },
          { id: "5", text: "`5`", feedback: "Returning isn't printing. `print()` hasn't run yet; it's waiting for this value." },
          { id: "hello", text: "`hello`", feedback: "`hello` is only an argument to `len()`. Nothing has been printed." },
        ],
        answer: "nothing",
        explanation: "`len()` hands its answer back to the code that called it, here `print()`. Only `print()` puts text on the screen.",
      },
    },
    { line: 1, vars: {}, call: { name: "print", args: ["5"], argFrom: { 0: "len()" }, prints: ["5"], returns: "None", phase: "call" }, note: "Now print() is called with the returned value, 5." },
    { line: 1, vars: {}, output: ["5"], call: { name: "print", args: ["5"], argFrom: { 0: "len()" }, prints: ["5"], returns: "None", phase: "result" }, note: "print shows 5 and returns None." },
  ],
};

const addCall = (phase: "call" | "run" | "result" | "assign") => ({ name: "add", params: ["a", "b"], args: ["2", "3"], returns: "5", assignTo: "total", phase });

const userFunction: Walkthrough = {
  id: "py-add-function",
  title: "Parameters and return",
  language: "python",
  visualizations: ["function", "stack", "variables"],
  code: `def add(a, b):
    return a + b

total = add(2, 3)
print(total)`,
  steps: [
    { line: 1, vars: {}, note: "Python learns the function add. The body doesn't run yet." },
    { line: 4, vars: {}, call: addCall("call"), note: "add(2, 3) is called: 2 goes into a and 3 into b, by position." },
    {
      line: 2,
      vars: { a: py.int(2), b: py.int(3) },
      frame: "add",
      callers: [main({}, "add(2, 3)")],
      call: addCall("result"),
      note: "Inside add, a is 2 and b is 3. return hands back 5. These names belong to this call only.",
    },
    { line: 4, vars: { total: py.int(5) }, highlight: "total", call: addCall("assign"), note: "add is finished and its a and b are gone. total refers to the returned 5." },
    { line: 5, vars: { total: py.int(5) }, output: ["5"], call: { name: "print", args: ["5"], prints: ["5"], returns: "None", phase: "result" }, note: "print shows 5." },
  ],
};

const callStack: Walkthrough = {
  id: "py-call-stack",
  title: "Functions calling functions",
  language: "python",
  visualizations: ["stack", "function", "variables"],
  code: `def add_one(n):
    return n + 1

def double(n):
    m = add_one(n)
    return m * 2

result = double(4)
print(result)`,
  steps: [
    { line: 1, vars: {}, note: "Python learns add_one." },
    { line: 4, vars: {}, note: "And double. Neither has run yet." },
    { line: 8, vars: {}, call: { name: "double", params: ["n"], args: ["4"], returns: "10", assignTo: "result", phase: "call" }, note: "The main program calls double(4) and waits for it." },
    {
      line: 5,
      vars: { n: py.int(4) },
      frame: "double",
      callers: [main({}, "double(4)")],
      call: { name: "add_one", params: ["n"], args: ["4"], returns: "5", assignTo: "m", phase: "call" },
      note: "A new frame for double, with its own n = 4. double calls add_one(n) and waits in turn.",
    },
    {
      line: 2,
      vars: { n: py.int(4) },
      frame: "add_one",
      callers: [main({}, "double(4)"), { name: "double", vars: { n: py.int(4) }, calling: "add_one(n)" }],
      call: { name: "add_one", params: ["n"], args: ["4"], returns: "5", assignTo: "m", phase: "result" },
      note: "add_one has its own n too. Two frames, two different n's. It returns 5.",
      checkpoint: {
        prompt: "`add_one` is about to return. Which functions are waiting for an answer?",
        choices: [
          { id: "both", text: "`double` and the main program" },
          { id: "double", text: "Only `double`", feedback: "The main program is still waiting too: it called `double`, which hasn't returned yet." },
          { id: "none", text: "None of them", feedback: "Every call waits until the function it called returns." },
        ],
        answer: "both",
        explanation: "Calls stack up: the main program waits for `double`, which waits for `add_one`.",
      },
    },
    {
      line: 5,
      vars: { n: py.int(4), m: py.int(5) },
      frame: "double",
      callers: [main({}, "double(4)")],
      call: { name: "add_one", params: ["n"], args: ["4"], returns: "5", assignTo: "m", phase: "assign" },
      note: "add_one is finished and its frame is gone. Back in double, m refers to 5.",
    },
    {
      line: 6,
      vars: { n: py.int(4), m: py.int(5) },
      frame: "double",
      callers: [main({}, "double(4)")],
      call: { name: "double", params: ["n"], args: ["4"], returns: "10", assignTo: "result", phase: "result" },
      note: "double returns 5 * 2, which is 10.",
    },
    { line: 8, vars: { result: py.int(10) }, call: { name: "double", params: ["n"], args: ["4"], returns: "10", assignTo: "result", phase: "assign" }, note: "Only the main program is left. result refers to 10." },
    { line: 9, vars: { result: py.int(10) }, output: ["10"], call: { name: "print", args: ["10"], prints: ["10"], returns: "None", phase: "result" }, note: "print shows 10." },
  ],
};

export const pythonVisuals: Walkthrough[] = [
  sharedList,
  precedence,
  listOps,
  longList,
  forList,
  forString,
  forRange,
  forTuple,
  forDict,
  forSet,
  forGenerator,
  stringSlices,
  dictUpdate,
  setMembership,
  idCheck,
  nestedCall,
  userFunction,
  callStack,
];
