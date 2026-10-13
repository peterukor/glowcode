// Hand-written demo traces. A real Python tracer will replace these later; it only
// needs to produce the same `TraceStep` shape (see src/types/trace.ts).

import type { Example } from "@/types/trace";
import type { PyValue } from "@/types/python";

const int = (value: number): PyValue => ({ type: "int", value });
const float = (value: number): PyValue => ({ type: "float", value });
const str = (value: string): PyValue => ({ type: "str", value });
const bool = (value: boolean): PyValue => ({ type: "bool", value });
const list = (value: (string | number)[]): PyValue => ({ type: "list", value });

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
    { line: 1, vars: { name: str("Ada") }, highlight: "name", note: 'A box labeled name now holds the string "Ada".' },
    { line: 2, vars: { name: str("Ada"), age: int(16) }, highlight: "age", note: "age holds a whole number, an int." },
    { line: 3, vars: { name: str("Ada"), age: int(16), height: float(1.62) }, highlight: "height", note: "Numbers with a decimal point are floats." },
    { line: 4, vars: { name: str("Ada"), age: int(16), height: float(1.62), is_coder: bool(true) }, highlight: "is_coder", note: "True and False are booleans." },
    { line: 5, vars: { name: str("Ada"), age: int(16), height: float(1.62), is_coder: bool(true) }, output: ["Ada is 16"], note: "print() shows values in the console." },
  ],
};

const ifElse: Example = {
  id: "if-else",
  title: "If / Else",
  emoji: "🔀",
  language: "python",
  visualizations: ["flow", "variables"],
  code: `score = 82
if score >= 70:
    result = "pass"
else:
    result = "try again"
print(result)`,
  ifChain: {
    branches: [
      { id: "b1", keyword: "if", condition: { kind: "compare", id: "c1", code: "score >= 70" }, body: ['result = "pass"'] },
    ],
    elseBody: ['result = "try again"'],
    after: "print(result)",
  },
  steps: [
    { line: 1, vars: { score: int(82) }, highlight: "score", ifChain: { results: {} }, note: "score is set to 82." },
    { line: 2, vars: { score: int(82) }, ifChain: { results: { c1: true }, at: { kind: "test", branch: "b1" } }, note: "Python asks: is 82 >= 70? Yes, it's True." },
    { line: 3, vars: { score: int(82), result: str("pass") }, highlight: "result", ifChain: { results: { c1: true }, at: { kind: "body", branch: "b1" } }, note: "True, so Python follows the True line and runs the if block." },
    { line: 6, vars: { score: int(82), result: str("pass") }, output: ["pass"], ifChain: { results: { c1: true }, at: { kind: "after" } }, note: "The else block was skipped entirely. Both paths meet again at print()." },
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

const forLoop: Example = {
  id: "loop",
  title: "For Loop",
  emoji: "🔁",
  language: "python",
  visualizations: ["loop", "variables"],
  code: `total = 0
for n in [3, 5, 7]:
    total = total + n
print(total)`,
  steps: [
    { line: 1, vars: { total: int(0) }, highlight: "total", note: "Start with total at 0." },
    { line: 2, vars: { total: int(0), n: int(3) }, loopIndex: 0, highlight: "n", note: "Lap 1: n takes the first item, 3." },
    { line: 3, vars: { total: int(3), n: int(3) }, loopIndex: 0, highlight: "total", note: "total becomes 0 + 3 = 3." },
    { line: 2, vars: { total: int(3), n: int(5) }, loopIndex: 1, highlight: "n", note: "Lap 2: n is now 5." },
    { line: 3, vars: { total: int(8), n: int(5) }, loopIndex: 1, highlight: "total", note: "total becomes 3 + 5 = 8." },
    { line: 2, vars: { total: int(8), n: int(7) }, loopIndex: 2, highlight: "n", note: "Lap 3: n is 7." },
    { line: 3, vars: { total: int(15), n: int(7) }, loopIndex: 2, highlight: "total", note: "total becomes 8 + 7 = 15." },
    { line: 4, vars: { total: int(15), n: int(7) }, loopIndex: 3, output: ["15"], note: "The loop is done. Print 15." },
  ],
};

const listsAndStrings: Example = {
  id: "lists",
  title: "Lists & Strings",
  emoji: "🧺",
  language: "python",
  visualizations: ["collections", "variables"],
  code: `fruits = ["apple", "kiwi"]
fruits.append("mango")
word = "code"
first = word[0]
print(fruits[2], first)`,
  steps: [
    { line: 1, vars: { fruits: list(["apple", "kiwi"]) }, highlight: "fruits", note: "A list is a row of numbered boxes, starting at 0." },
    { line: 2, vars: { fruits: list(["apple", "kiwi", "mango"]) }, highlight: "fruits", note: "append() adds a box at the end, at index 2." },
    { line: 3, vars: { fruits: list(["apple", "kiwi", "mango"]), word: str("code") }, highlight: "word", note: "A string is a row of characters, too." },
    { line: 4, vars: { fruits: list(["apple", "kiwi", "mango"]), word: str("code"), first: str("c") }, highlight: "first", note: "word[0] grabs the first character." },
    { line: 5, vars: { fruits: list(["apple", "kiwi", "mango"]), word: str("code"), first: str("c") }, output: ["mango c"], note: "Indexing works the same way on lists and strings." },
  ],
};

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
    { line: 1, vars: {}, note: "Python learns the recipe called greet. Nothing runs yet." },
    { line: 5, vars: {}, note: 'greet("Sam") is called. "Sam" goes in as person.' },
    { line: 2, vars: { person: str("Sam"), message: str("Hi, Sam") }, highlight: "message", note: "Inside the function, message is built." },
    { line: 3, vars: { person: str("Sam"), message: str("Hi, Sam") }, note: "return sends the value back out." },
    { line: 5, vars: { text: str("Hi, Sam") }, highlight: "text", note: "The returned value lands in text." },
    { line: 6, vars: { text: str("Hi, Sam") }, output: ["Hi, Sam"], note: "Printed!" },
  ],
};

export const examples: Example[] = [variables, ifElse, elifChain, andOr, forLoop, listsAndStrings, functions];

export function getExample(id: string): Example {
  return examples.find((e) => e.id === id) ?? variables;
}
