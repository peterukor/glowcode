// Static, hand-authored execution traces. These are DEMO data only —
// real Python tracing will replace them later (see AGENTS.md).

export type PyType = "int" | "float" | "str" | "bool" | "list" | "None";
export type PyValue = { type: PyType; value: string | number | boolean | (string | number)[] | null };
export type Vars = Record<string, PyValue>;

export type Step = {
  line: number; // 1-indexed active line
  vars: Vars;
  output?: string[]; // cumulative console output
  note: string; // friendly explanation
  highlight?: string; // variable or branch id to emphasize
  loopIndex?: number;
  branch?: "yes" | "no";
};

export type VizKind = "variables" | "flowchart" | "collections" | "loop" | "function";

export type Example = {
  id: string;
  title: string;
  emoji: string;
  viz: VizKind[];
  code: string;
  steps: Step[];
};

const i = (v: number): PyValue => ({ type: "int", value: v });
const f = (v: number): PyValue => ({ type: "float", value: v });
const s = (v: string): PyValue => ({ type: "str", value: v });
const b = (v: boolean): PyValue => ({ type: "bool", value: v });
const l = (v: (string | number)[]): PyValue => ({ type: "list", value: v });

export const examples: Example[] = [
  {
    id: "variables",
    title: "Variables",
    emoji: "📦",
    viz: ["variables"],
    code: `name = "Ada"
age = 16
height = 1.62
is_coder = True
print(name, "is", age)`,
    steps: [
      { line: 1, vars: { name: s("Ada") }, highlight: "name", note: "A box labeled name now holds the string \"Ada\"." },
      { line: 2, vars: { name: s("Ada"), age: i(16) }, highlight: "age", note: "age holds a whole number — an int." },
      { line: 3, vars: { name: s("Ada"), age: i(16), height: f(1.62) }, highlight: "height", note: "Decimals are floats." },
      { line: 4, vars: { name: s("Ada"), age: i(16), height: f(1.62), is_coder: b(true) }, highlight: "is_coder", note: "True/False values are booleans." },
      { line: 5, vars: { name: s("Ada"), age: i(16), height: f(1.62), is_coder: b(true) }, output: ["Ada is 16"], note: "print() shows values in the console." },
    ],
  },
  {
    id: "conditional",
    title: "If / Else",
    emoji: "🔀",
    viz: ["flowchart", "variables"],
    code: `score = 82
if score >= 70:
    result = "pass"
else:
    result = "try again"
print(result)`,
    steps: [
      { line: 1, vars: { score: i(82) }, highlight: "score", note: "score is set to 82." },
      { line: 2, vars: { score: i(82) }, note: "Python asks: is 82 >= 70?" },
      { line: 3, vars: { score: i(82), result: s("pass") }, branch: "yes", highlight: "result", note: "Yes! The True branch runs." },
      { line: 6, vars: { score: i(82), result: s("pass") }, branch: "yes", output: ["pass"], note: "The else branch was skipped entirely." },
    ],
  },
  {
    id: "loop",
    title: "For Loop",
    emoji: "🔁",
    viz: ["loop", "variables"],
    code: `total = 0
for n in [3, 5, 7]:
    total = total + n
print(total)`,
    steps: [
      { line: 1, vars: { total: i(0) }, highlight: "total", note: "Start with total at 0." },
      { line: 2, vars: { total: i(0), n: i(3) }, loopIndex: 0, highlight: "n", note: "Iteration 1: n takes the first item, 3." },
      { line: 3, vars: { total: i(3), n: i(3) }, loopIndex: 0, highlight: "total", note: "total becomes 0 + 3 = 3." },
      { line: 2, vars: { total: i(3), n: i(5) }, loopIndex: 1, highlight: "n", note: "Iteration 2: n is now 5." },
      { line: 3, vars: { total: i(8), n: i(5) }, loopIndex: 1, highlight: "total", note: "total becomes 3 + 5 = 8." },
      { line: 2, vars: { total: i(8), n: i(7) }, loopIndex: 2, highlight: "n", note: "Iteration 3: n is 7." },
      { line: 3, vars: { total: i(15), n: i(7) }, loopIndex: 2, highlight: "total", note: "total becomes 8 + 7 = 15." },
      { line: 4, vars: { total: i(15), n: i(7) }, output: ["15"], note: "Loop done. Print 15." },
    ],
  },
  {
    id: "lists",
    title: "Lists & Strings",
    emoji: "🧺",
    viz: ["collections", "variables"],
    code: `fruits = ["apple", "kiwi"]
fruits.append("mango")
word = "code"
first = word[0]
print(fruits[2], first)`,
    steps: [
      { line: 1, vars: { fruits: l(["apple", "kiwi"]) }, highlight: "fruits", note: "A list is a row of indexed boxes, starting at 0." },
      { line: 2, vars: { fruits: l(["apple", "kiwi", "mango"]) }, highlight: "fruits", note: "append() adds a box at the end — index 2." },
      { line: 3, vars: { fruits: l(["apple", "kiwi", "mango"]), word: s("code") }, highlight: "word", note: "Strings are sequences of characters, too." },
      { line: 4, vars: { fruits: l(["apple", "kiwi", "mango"]), word: s("code"), first: s("c") }, highlight: "first", note: "word[0] grabs the first character." },
      { line: 5, vars: { fruits: l(["apple", "kiwi", "mango"]), word: s("code"), first: s("c") }, output: ["mango c"], note: "Indexing works the same on lists and strings." },
    ],
  },
  {
    id: "function",
    title: "Functions",
    emoji: "⚙️",
    viz: ["function", "variables"],
    code: `def greet(person):
    message = "Hi, " + person
    return message

text = greet("Sam")
print(text)`,
    steps: [
      { line: 1, vars: {}, note: "Python learns the recipe called greet — nothing runs yet." },
      { line: 5, vars: {}, note: "greet(\"Sam\") is called. \"Sam\" goes in as person." },
      { line: 2, vars: { person: s("Sam"), message: s("Hi, Sam") }, highlight: "message", note: "Inside the function, message is built." },
      { line: 3, vars: { person: s("Sam"), message: s("Hi, Sam") }, note: "return sends the value back out." },
      { line: 5, vars: { text: s("Hi, Sam") }, highlight: "text", note: "The returned value lands in text." },
      { line: 6, vars: { text: s("Hi, Sam") }, output: ["Hi, Sam"], note: "Printed!" },
    ],
  },
];

export const getExample = (id: string) => examples.find((e) => e.id === id) ?? examples[0];
