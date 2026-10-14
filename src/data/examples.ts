// Hand-written, verified demo traces (scripts/check-python.ts replays each one in real Python).
// A future tracer only needs to produce the same `TraceStep` shape (see src/types/trace.ts).

import type { Example } from "@/types/trace";
import type { PyValue } from "@/types/python";
import { buildSteps, py } from "@/walkthrough/build";

const int = (value: number): PyValue => ({ type: "int", value });
const float = (value: number): PyValue => ({ type: "float", value });
const str = (value: string): PyValue => ({ type: "str", value });
const bool = (value: boolean): PyValue => ({ type: "bool", value });

const variables: Example = {
  id: "variables",
  title: "Variables",
  emoji: "📦",
  language: "python",
  visualizations: ["variables"],
  code: `name = "Ada"
age = 16
height = 1.62
is_coder = True
print(name, "is", age)`,
  steps: [
    { line: 1, vars: { name: str("Ada") }, highlight: "name", note: 'name now refers to the string "Ada".' },
    { line: 2, vars: { name: str("Ada"), age: int(16) }, highlight: "age", note: "age refers to a whole number, an int." },
    { line: 3, vars: { name: str("Ada"), age: int(16), height: float(1.62) }, highlight: "height", note: "Numbers with a decimal point are floats." },
    { line: 4, vars: { name: str("Ada"), age: int(16), height: float(1.62), is_coder: bool(true) }, highlight: "is_coder", note: "True and False are booleans." },
    { line: 5, vars: { name: str("Ada"), age: int(16), height: float(1.62), is_coder: bool(true) }, output: ["Ada is 16"], note: "print() shows values in the console." },
  ],
};

const reassign: Example = {
  id: "reassign",
  title: "Reassignment",
  emoji: "🔄",
  language: "python",
  visualizations: ["variables"],
  code: `count = 3
count = count + 2
print(count)`,
  steps: [
    { line: 1, vars: { count: int(3) }, highlight: "count", note: "count now refers to 3." },
    {
      line: 2,
      vars: { count: int(3) },
      calc: { target: "count", parts: [{ code: "count", value: "3" }, { code: "+" }, { code: "2" }], result: "5", phase: "read" },
      note: "Line 2 starts with the right side. Python looks up the value count refers to right now: 3.",
      checkpoint: {
        prompt: "What value will `count` refer to after line 2?",
        choices: [
          { id: "5", text: "`5`" },
          {
            id: "3",
            text: "`3`",
            feedback: "3 is what `count` refers to right now. Line 2 is an assignment, so `count` will refer to whatever the right side works out to.",
          },
          {
            id: "expr",
            text: "`count + 2`",
            feedback: "There are no quotes, so `count + 2` isn't text. Python works it out using the value `count` refers to.",
          },
          {
            id: "2",
            text: "`2`",
            feedback: "The right side is `count + 2`, not just `2`. Python uses the current value of `count` in the calculation.",
          },
        ],
        answer: "5",
        explanation: "Python works out the right side first, using the value `count` refers to now: 3 + 2 is 5. Then `count` refers to 5.",
      },
    },
    {
      line: 2,
      vars: { count: int(3) },
      calc: { target: "count", parts: [{ code: "count", value: "3" }, { code: "+" }, { code: "2" }], result: "5", phase: "calculate" },
      note: "Now it calculates 3 + 2, which is 5. count still refers to 3 at this moment.",
    },
    {
      line: 2,
      vars: { count: int(5) },
      highlight: "count",
      calc: { target: "count", parts: [{ code: "count", value: "3" }, { code: "+" }, { code: "2" }], result: "5", phase: "assign" },
      note: "Last event on line 2: the name count is rebound to the result, 5. It no longer refers to 3.",
    },
    { line: 3, vars: { count: int(5) }, output: ["5"], note: "print() shows the value count refers to now: 5." },
  ],
};

const ifElse: Example = {
  id: "if-else",
  title: "If / Else",
  emoji: "🔀",
  language: "python",
  visualizations: ["flow", "variables"],
  code: `age = 16

if age >= 18:
    print("Adult")
else:
    print("Minor")`,
  ifChain: {
    branches: [{ id: "b1", keyword: "if", condition: { kind: "compare", id: "c1", code: "age >= 18" }, body: ['print("Adult")'] }],
    elseBody: ['print("Minor")'],
  },
  steps: [
    { line: 1, vars: { age: int(16) }, highlight: "age", ifChain: { results: {} }, note: "age now refers to 16." },
    {
      line: 3,
      vars: { age: int(16) },
      ifChain: { results: { c1: false }, at: { kind: "test", branch: "b1" } },
      note: "Python checks the condition with the real value: 16 >= 18 is False. So it skips the if block.",
      checkpoint: {
        prompt: "`age` refers to 16. Which line will print?",
        choices: [
          { id: "adult", text: '`print("Adult")`', feedback: "Check the comparison with the real value. Is 16 greater than or equal to 18?" },
          { id: "minor", text: '`print("Minor")`' },
          { id: "both", text: "Both of them", feedback: "An if/else runs exactly one of its two blocks, never both." },
          { id: "neither", text: "Neither", feedback: "With an else, one of the two blocks always runs. Which one runs when the condition is False?" },
        ],
        answer: "minor",
        explanation: "16 >= 18 is False, so Python skips the if block and runs the else block instead. Only `Minor` is printed.",
      },
    },
    {
      line: 6,
      vars: { age: int(16) },
      output: ["Minor"],
      ifChain: { results: { c1: false }, at: { kind: "else" } },
      note: "False, so the else block runs and prints Minor. The Adult line never ran.",
    },
  ],
};

const elifChain: Example = {
  id: "elif",
  title: "If / Elif / Else",
  emoji: "🪜",
  language: "python",
  visualizations: ["flow", "variables"],
  code: `score = 75
if score >= 90:
    grade = "A"
elif score >= 70:
    grade = "B"
else:
    grade = "C"
print(grade)`,
  ifChain: {
    branches: [
      { id: "b1", keyword: "if", condition: { kind: "compare", id: "c1", code: "score >= 90" }, body: ['grade = "A"'] },
      { id: "b2", keyword: "elif", condition: { kind: "compare", id: "c2", code: "score >= 70" }, body: ['grade = "B"'] },
    ],
    elseBody: ['grade = "C"'],
    after: "print(grade)",
  },
  steps: [
    { line: 1, vars: { score: int(75) }, highlight: "score", ifChain: { results: {} }, note: "score is set to 75." },
    { line: 2, vars: { score: int(75) }, ifChain: { results: { c1: false }, at: { kind: "test", branch: "b1" } }, note: "Is 75 >= 90? No, it's False. Python follows the False line down to the elif." },
    { line: 4, vars: { score: int(75) }, ifChain: { results: { c1: false, c2: true }, at: { kind: "test", branch: "b2" } }, note: "Is 75 >= 70? Yes, True! This is the branch Python will take." },
    { line: 5, vars: { score: int(75), grade: str("B") }, highlight: "grade", ifChain: { results: { c1: false, c2: true }, at: { kind: "body", branch: "b2" } }, note: 'The elif block runs: grade becomes "B".' },
    { line: 8, vars: { score: int(75), grade: str("B") }, output: ["B"], ifChain: { results: { c1: false, c2: true }, at: { kind: "after" } }, note: "Only one branch ever runs. The else was skipped, and every path meets again at print()." },
  ],
};

const andOr: Example = {
  id: "and-or",
  title: "And / Or",
  emoji: "🧩",
  language: "python",
  visualizations: ["flow", "variables"],
  code: `age = 15
has_ticket = False
with_adult = True
if age >= 13 and has_ticket:
    print("Enjoy the movie!")
elif with_adult or age >= 16:
    print("Come with an adult")
else:
    print("Sorry, not today")
print("Bye!")`,
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
            { kind: "compare", id: "c1", code: "age >= 13" },
            { kind: "compare", id: "c2", code: "has_ticket" },
          ],
        },
        body: ['print("Enjoy the movie!")'],
      },
      {
        id: "b2",
        keyword: "elif",
        condition: {
          kind: "boolop",
          id: "g2",
          op: "or",
          operands: [
            { kind: "compare", id: "c3", code: "with_adult" },
            { kind: "compare", id: "c4", code: "age >= 16" },
          ],
        },
        body: ['print("Come with an adult")'],
      },
    ],
    elseBody: ['print("Sorry, not today")'],
    after: 'print("Bye!")',
  },
  steps: [
    { line: 1, vars: { age: int(15) }, highlight: "age", ifChain: { results: {} }, note: "age is 15." },
    { line: 2, vars: { age: int(15), has_ticket: bool(false) }, highlight: "has_ticket", ifChain: { results: {} }, note: "has_ticket is False." },
    { line: 3, vars: { age: int(15), has_ticket: bool(false), with_adult: bool(true) }, highlight: "with_adult", ifChain: { results: {} }, note: "with_adult is True." },
    { line: 4, vars: { age: int(15), has_ticket: bool(false), with_adult: bool(true) }, ifChain: { results: { c1: true }, at: { kind: "test", branch: "b1" } }, note: "Is 15 >= 13? True. But this is an and, so Python must check the other side too." },
    { line: 4, vars: { age: int(15), has_ticket: bool(false), with_adult: bool(true) }, ifChain: { results: { c1: true, c2: false }, at: { kind: "test", branch: "b1" } }, note: "has_ticket is False. and needs both sides True, so the whole if is False." },
    { line: 6, vars: { age: int(15), has_ticket: bool(false), with_adult: bool(true) }, ifChain: { results: { c1: true, c2: false, c3: true }, at: { kind: "test", branch: "b2" } }, note: "with_adult is True. or only needs one True side, so Python skips age >= 16 entirely." },
    { line: 7, vars: { age: int(15), has_ticket: bool(false), with_adult: bool(true) }, output: ["Come with an adult"], ifChain: { results: { c1: true, c2: false, c3: true }, at: { kind: "body", branch: "b2" } }, note: "The elif block runs." },
    { line: 10, vars: { age: int(15), has_ticket: bool(false), with_adult: bool(true) }, output: ["Come with an adult", "Bye!"], ifChain: { results: { c1: true, c2: false, c3: true }, at: { kind: "after" } }, note: "The else was skipped, and every path meets again at the last print()." },
  ],
};

const loopCalc = (old: number, n: number, phase: "calculate" | "assign") => ({
  target: "total",
  parts: [{ code: "total", value: String(old) }, { code: "+" }, { code: "n", value: String(n) }],
  result: String(old + n),
  phase,
});

const forLoop: Example = {
  id: "loop",
  title: "For Loop",
  emoji: "🔁",
  language: "python",
  visualizations: ["loop", "variables"],
  loopItems: [3, 5, 7],
  code: `total = 0
for n in [3, 5, 7]:
    total = total + n
print(total)`,
  steps: [
    { line: 1, vars: { total: int(0) }, highlight: "total", note: "Start with total at 0." },
    { line: 2, vars: { total: int(0), n: int(3) }, loopIndex: 0, highlight: "n", note: "Lap 1: n takes the first item, 3." },
    { line: 3, vars: { total: int(0), n: int(3) }, loopIndex: 0, calc: loopCalc(0, 3, "calculate"), note: "Work out total + n: 0 + 3 is 3." },
    { line: 3, vars: { total: int(3), n: int(3) }, loopIndex: 0, highlight: "total", calc: loopCalc(0, 3, "assign"), note: "total now refers to 3." },
    { line: 2, vars: { total: int(3), n: int(5) }, loopIndex: 1, highlight: "n", note: "Back to line 2. Lap 2: n is now 5." },
    { line: 3, vars: { total: int(3), n: int(5) }, loopIndex: 1, calc: loopCalc(3, 5, "calculate"), note: "Work out total + n: 3 + 5 is 8." },
    { line: 3, vars: { total: int(8), n: int(5) }, loopIndex: 1, highlight: "total", calc: loopCalc(3, 5, "assign"), note: "total now refers to 8." },
    { line: 2, vars: { total: int(8), n: int(7) }, loopIndex: 2, highlight: "n", note: "Lap 3: n is 7, the last item." },
    {
      line: 3,
      vars: { total: int(8), n: int(7) },
      loopIndex: 2,
      calc: loopCalc(8, 7, "calculate"),
      note: "Work out total + n: 8 + 7 is 15.",
      checkpoint: {
        prompt: "`total` refers to 8 and `n` refers to 7. What will `total + n` work out to?",
        choices: [
          { id: "15", text: "`15`" },
          { id: "7", text: "`7`", feedback: "That's just `n`. The line adds `n` to what `total` already refers to." },
          { id: "8", text: "`8`", feedback: "8 is what `total` refers to before this line. Add `n` to it." },
        ],
        answer: "15",
        explanation: "Each lap adds the current item to the running total: 8 + 7 is 15.",
      },
    },
    { line: 3, vars: { total: int(15), n: int(7) }, loopIndex: 2, highlight: "total", calc: loopCalc(8, 7, "assign"), note: "total now refers to 15." },
    { line: 2, vars: { total: int(15), n: int(7) }, loopIndex: 3, note: "Back to line 2 once more, but there are no items left. The loop ends." },
    { line: 4, vars: { total: int(15), n: int(7) }, loopIndex: 3, output: ["15"], note: "Python carries on after the loop and prints 15." },
  ],
};

const appendCall = (phase: "call" | "result") => ({
  name: "append",
  receiver: "fruits",
  receiverValue: "['apple', 'kiwi']",
  args: ['"mango"'],
  changes: "['apple', 'kiwi', 'mango']",
  returns: "None",
  phase,
});

const listsAndStrings: Example = {
  id: "lists",
  title: "Lists & Strings",
  emoji: "🧺",
  language: "python",
  visualizations: ["collections", "function", "variables"],
  code: `fruits = ["apple", "kiwi"]
fruits.append("mango")
word = "code"
first = word[0]
print(fruits[2], first)`,
  steps: buildSteps([
    { line: 1, set: { fruits: py.list(["apple", "kiwi"]) }, note: "fruits refers to a list of two items. Positions start at 0." },
    { line: 2, call: appendCall("call"), note: 'append() is called on the list fruits refers to, with "mango".' },
    {
      line: 2,
      set: { fruits: py.list(["apple", "kiwi", "mango"]) },
      call: appendCall("result"),
      element: { name: "fruits", index: 2 },
      note: 'append() changes that same list: "mango" goes on the end, at index 2. It returns None, which this line doesn\'t use.',
    },
    { line: 3, set: { word: py.str("code") }, note: "A string is a sequence of characters, also numbered from 0." },
    { line: 4, set: { first: py.str("c") }, element: { name: "word", index: 0 }, note: "word[0] is the character at position 0." },
    { line: 5, print: ["mango c"], element: { name: "fruits", index: 2 }, note: "fruits[2] and first are printed, separated by a space." },
  ]),
};

const countCalc = (old: number, phase: "calculate" | "assign") => ({
  target: "count",
  parts: [{ code: "count", value: String(old) }, { code: "+" }, { code: "1" }],
  result: String(old + 1),
  phase,
});

/** One lap of the while loop: check (True), print, then count += 1 in two events. */
const whileLap = (count: number) => [
  {
    line: 3,
    whileLoop: { checks: count, at: "check" as const, result: true },
    note: `Check ${count}: is ${count} <= 3? True, so the body runs.`,
  },
  { line: 4, whileLoop: { checks: count, at: "body" as const, result: true }, print: [String(count)], note: `print(count) shows ${count}.` },
  {
    line: 5,
    whileLoop: { checks: count, at: "body" as const, result: true },
    calc: countCalc(count, "calculate"),
    note: `count += 1 is short for count = count + 1. Python works out ${count} + 1.`,
  },
  {
    line: 5,
    set: { count: py.int(count + 1) },
    whileLoop: { checks: count, at: "body" as const, result: true },
    calc: countCalc(count, "assign"),
    note: `count now refers to ${count + 1}. Back to the while line.`,
  },
];

const whileLoop: Example = {
  id: "while",
  title: "While Loop",
  emoji: "⏳",
  language: "python",
  visualizations: ["loop", "variables"],
  whileLoop: { condition: "count <= 3", body: ["print(count)", "count += 1"] },
  code: `count = 1

while count <= 3:
    print(count)
    count += 1`,
  steps: buildSteps([
    { line: 1, set: { count: py.int(1) }, note: "count refers to 1." },
    ...whileLap(1),
    ...whileLap(2),
    ...whileLap(3),
    {
      line: 3,
      whileLoop: { checks: 4, at: "check", result: false },
      note: "Check 4: is 4 <= 3? False.",
      checkpoint: {
        prompt: "`count` now refers to 4. What happens at the `while` line?",
        choices: [
          { id: "stop", text: "The check is False, so the loop stops" },
          { id: "print", text: "It prints `4`", feedback: "The body only runs when the check is True. Work out `4 <= 3`." },
          {
            id: "forever",
            text: "It keeps looping forever",
            feedback: "`count` goes up by 1 every lap, so at some point `count <= 3` stops being True. Has it happened yet?",
          },
        ],
        answer: "stop",
        explanation: "4 <= 3 is False, so Python skips the body and leaves the loop. The loop printed 1, 2 and 3: one line per True check.",
      },
    },
    {
      line: 3,
      whileLoop: { checks: 4, at: "exit", result: false },
      note: "False means the loop is over. Nothing comes after it, so the program ends.",
    },
  ]),
};


const greetCall = (phase: "call" | "run" | "result" | "assign") => ({
  name: "greet",
  args: ['"Sam"'],
  returns: '"Hi, Sam"',
  assignTo: "text",
  phase,
});

const functions: Example = {
  id: "function",
  title: "Functions",
  emoji: "⚙️",
  language: "python",
  visualizations: ["function", "variables"],
  code: `def greet(person):
    message = "Hi, " + person
    return message

text = greet("Sam")
print(text)`,
  steps: [
    { line: 1, vars: {}, note: "Python learns the recipe called greet. Nothing inside it runs yet." },
    { line: 5, vars: {}, call: greetCall("call"), note: 'greet("Sam") is called. "Sam" goes in as person.' },
    {
      line: 2,
      vars: { person: str("Sam"), message: str("Hi, Sam") },
      highlight: "message",
      call: greetCall("run"),
      note: "Inside the function, message is built from the input.",
    },
    {
      line: 3,
      vars: { person: str("Sam"), message: str("Hi, Sam") },
      call: greetCall("result"),
      note: "return hands the value back to the line that called greet(). Nothing is printed.",
    },
    { line: 5, vars: { text: str("Hi, Sam") }, highlight: "text", call: greetCall("assign"), note: "Back on line 5, the returned value is stored: text refers to it." },
    {
      line: 6,
      vars: { text: str("Hi, Sam") },
      output: ["Hi, Sam"],
      call: { name: "print", args: ['"Hi, Sam"'], prints: ["Hi, Sam"], phase: "result" },
      note: "Only now, print() shows it on the screen.",
    },
  ],
};

const builtinLen: Example = {
  id: "len",
  title: "len()",
  emoji: "📏",
  language: "python",
  visualizations: ["function", "variables"],
  code: `word = "cat"
length = len(word)
print(length)`,
  steps: [
    { line: 1, vars: { word: str("cat") }, highlight: "word", note: 'word now refers to "cat".' },
    {
      line: 2,
      vars: { word: str("cat") },
      call: { name: "len", args: ['"cat"'], returns: "3", assignTo: "length", phase: "call" },
      note: 'len(word) is called. The value word refers to, "cat", goes in.',
    },
    {
      line: 2,
      vars: { word: str("cat") },
      call: { name: "len", args: ['"cat"'], returns: "3", assignTo: "length", phase: "result" },
      note: "len() counts the characters and returns 3. Look at Printed output: still empty. Returning isn't printing.",
      checkpoint: {
        prompt: "What does `len(word)` do with its answer?",
        choices: [
          { id: "returns", text: "Hands `3` back to line 2, without showing anything" },
          {
            id: "prints",
            text: "Prints `3` on the screen",
            feedback: "`len()` doesn't print anything. Only `print()` puts text on the screen, and line 2 doesn't call it.",
          },
          { id: "cat", text: 'Hands back `"cat"`', feedback: '`len()` gives back how many characters there are, not the text itself.' },
          {
            id: "changes",
            text: "Changes `word` to `3`",
            feedback: "`len()` only reads the string. `word` still refers to `\"cat\"` afterwards.",
          },
        ],
        answer: "returns",
        explanation:
          "`len()` returns 3: it hands the value back to the code that called it. Nothing appears on the screen. Line 2 then stores the returned value in `length`.",
      },
    },
    {
      line: 2,
      vars: { word: str("cat"), length: int(3) },
      highlight: "length",
      call: { name: "len", args: ['"cat"'], returns: "3", assignTo: "length", phase: "assign" },
      note: "Same line, last event: length now refers to the returned value, 3.",
    },
    {
      line: 3,
      vars: { word: str("cat"), length: int(3) },
      call: { name: "print", args: ["3"], prints: ["3"], returns: "None", phase: "call" },
      note: "print(length) is called with the value length refers to, 3.",
    },
    {
      line: 3,
      vars: { word: str("cat"), length: int(3) },
      output: ["3"],
      call: { name: "print", args: ["3"], prints: ["3"], returns: "None", phase: "result" },
      note: "print() shows 3 on the screen. It returns None (Python's value for \"nothing\"), which this program doesn't use.",
    },
  ],
};

export const examples: Example[] = [variables, reassign, ifElse, elifChain, andOr, forLoop, whileLoop, listsAndStrings, functions, builtinLen];

export function getExample(id: string): Example {
  return examples.find((e) => e.id === id) ?? variables;
}
