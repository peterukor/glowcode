import type { ReferenceEntry } from "../types";

/** Ideas that apply to programming in general, not to one language. */
export const conceptEntries: ReferenceEntry[] = [
  {
    id: "concept.program",
    scope: "concept",
    category: "concept",
    title: "Program",
    summary: "A list of instructions, written in a programming language, that a computer carries out in order.",
    keywords: ["code", "script", "instructions", "software"],
    explanation: [
      "A **program** is a list of instructions for a computer. The computer carries them out in the order they're written, exactly as written. It can't guess what you meant.",
      "Every app, game and website is a program, or many programs working together. The ones you'll write first are a few lines of Python saved in a file, like `main.py`.",
    ],
    examples: [
      {
        code: `print("Hello!")
print("I am a Python program.")`,
        output: ["Hello!", "I am a Python program."],
        caption: "A complete two-line program. Python runs line 1, then line 2.",
      },
    ],
    related: ["concept.programming-language", "concept.interpreter", "python.builtins.print"],
  },
  {
    id: "concept.programming-language",
    scope: "concept",
    category: "concept",
    title: "Programming language",
    summary: "A precise written language for instructions that both people and computers can read. Python and Java are programming languages.",
    aliases: ["language", "coding language"],
    explanation: [
      "Deep down, a computer only understands very simple instructions made of numbers. A **programming language** lets people write instructions in a form they can read, with exact rules so a computer can carry them out too.",
      "Each language has its own rules (its **syntax**). Python uses indentation to group lines; Java uses curly brackets. The ideas, like [variables](ref:concept.variable) and [functions](ref:concept.function), carry over from one language to the next.",
    ],
    related: ["concept.program", "concept.interpreter"],
  },
  {
    id: "concept.interpreter",
    scope: "concept",
    category: "concept",
    title: "Interpreter",
    summary: "The program that reads your Python code and carries it out, one instruction at a time, from the top.",
    aliases: ["python interpreter", "runtime"],
    explanation: [
      "When you run a Python file, the **Python interpreter** reads it and carries out each line in turn, from the top. It finishes one line before starting the next.",
      "If a line has a mistake, the interpreter stops there and prints an error message. Lines above it have already run; lines below it never do.",
    ],
    mistakes: [
      {
        title: "Expecting the lines after an error to run",
        explanation: "Line 1 runs and prints `one`. Line 2 has a mistake, so Python stops. Line 3 never runs.",
        code: `print("one")
Print("two")
print("three")`,
        error: "NameError: name 'Print' is not defined. Did you mean: 'print'?",
      },
    ],
    related: ["concept.program", "python.errors.NameError"],
  },
  {
    id: "concept.variable",
    scope: "concept",
    category: "concept",
    title: "Variable",
    summary: "A name that refers to a value, so a program can remember the value and use it later.",
    aliases: ["variables", "name"],
    keywords: ["store a value", "remember", "save value"],
    explanation: [
      "A **variable** is a name that refers to a value. You create one with an [assignment](ref:python.operators.assignment): the name, `=`, and a value. After that, using the name means using the value it refers to.",
      "A variable can be given a new value at any time. The name then refers to the new value, and the old one is no longer used.",
    ],
    syntax: "name = value",
    examples: [
      {
        code: `age = 13
age = age + 1
print(age)`,
        output: ["14"],
        caption: "Line 2 works out `age + 1` using the old value (13), then makes `age` refer to 14.",
      },
    ],
    mistakes: [
      {
        title: "Using a variable before creating it",
        explanation: "Python runs from the top, so when it reaches line 1, `score` doesn't exist yet. Assign first, then use it.",
        code: `print(score)
score = 10`,
        error: "NameError: name 'score' is not defined",
      },
      {
        title: "Putting quotes around the name",
        explanation: 'With quotes, `"age"` is text. Python prints the word instead of looking up the value.',
        code: `age = 13
print("age")`,
        output: ["age"],
      },
    ],
    related: ["python.operators.assignment", "python.errors.NameError", "concept.mutability"],
  },
  {
    id: "concept.function",
    scope: "concept",
    category: "concept",
    title: "Function",
    summary: "A named job you can ask Python to do. You call it with its name and parentheses, and it can take inputs and give back a result.",
    aliases: ["functions", "function call", "calling a function"],
    keywords: ["call", "arguments", "parameters", "parentheses"],
    explanation: [
      "A **function** is a named job. You **call** it by writing its name followed by parentheses, like `len(\"cat\")`. The values inside the parentheses are its **arguments**: the inputs it works with.",
      "When a function finishes, it can **give back a value** (its [return value](ref:concept.return-value)) for your code to store or use, **print** something on the screen, or **change** an object you gave it. These are different things, and a function can do any mix of them: `len()` only gives back a value, while `print()` prints and gives back `None`.",
      "Python comes with **built-in functions** like [`print()`](ref:python.builtins.print) and [`len()`](ref:python.builtins.len). Later you'll write your own with `def`.",
    ],
    syntax: "function_name(argument1, argument2)",
    examples: [
      {
        code: `length = len("hello")
print(length)`,
        output: ["5"],
        caption: "`len()` takes one argument and gives back 5. `print()` then shows it.",
        call: { name: "len", args: ['"hello"'], returns: "5", assignTo: "length", phase: "assign" },
      },
    ],
    related: ["concept.return-value", "concept.method", "python.builtins.len", "python.builtins.print"],
  },
  {
    id: "concept.return-value",
    scope: "concept",
    category: "concept",
    title: "Return value",
    summary: "The value a function hands back to the code that called it. Returning a value is not the same as printing it.",
    aliases: ["return", "returns", "returned value", "result"],
    keywords: ["give back", "output of a function", "returning vs printing"],
    explanation: [
      "When a function finishes, it hands a value back to the line that called it. That value is its **return value**. The line can store it in a variable, use it in a calculation, or pass it to another function.",
      "Returning doesn't put anything on the screen. Only printing does. A function that has nothing useful to give back returns [`None`](ref:python.types.None), like `print()` does.",
    ],
    examples: [
      {
        code: `result = len("cat")
print(result)
print(print("hi"))`,
        output: ["3", "hi", "None"],
        caption:
          "`len()` returns 3, which is stored and then printed. On line 3, the inner `print(\"hi\")` prints `hi` and returns `None`, which the outer `print()` then shows.",
      },
    ],
    mistakes: [
      {
        title: "Expecting a call to show its result on its own",
        explanation:
          "In a program, `len(word)` works out 3 and hands it back, but nothing uses it, so nothing appears. Print it or store it. (Python's interactive shell does show values automatically, which is why this can be confusing.)",
        code: `word = "cat"
len(word)`,
        output: [],
      },
    ],
    related: ["concept.function", "python.types.None", "python.builtins.print", "python.builtins.len"],
  },
  {
    id: "concept.method",
    scope: "concept",
    category: "concept",
    title: "Method",
    summary: "A function that belongs to a type of value. You call it with a dot after the value: `word.upper()`.",
    aliases: ["methods", "dot notation", "the dot"],
    keywords: ["why is there a dot", "value.method()", "dot before"],
    explanation: [
      "A **method** is a function that belongs to a type of value. You call it by writing the value, a dot, and the method name with parentheses: `word.upper()`. The dot means \"use the `upper` method that belongs to this value\".",
      "Each type has its own methods. Strings have [`upper()`](ref:python.types.str.upper); lists have [`append()`](ref:python.types.list.append). Built-in functions like `len()` don't belong to a type, so they're called without a dot.",
      "Some methods give back a new value and leave the original alone (strings can't be changed). Others change the object itself (lists can). See [mutability](ref:concept.mutability).",
    ],
    syntax: "value.method_name(arguments)",
    examples: [
      {
        code: `word = "cat"
print(word.upper())
items = []
items.append("apple")
print(items)`,
        output: ["CAT", "['apple']"],
      },
    ],
    mistakes: [
      {
        title: "Calling a method on a type that doesn't have it",
        explanation: "`upper()` belongs to strings. `age` refers to an int, which has no `upper()` method.",
        code: `age = 13
age.upper()`,
        error: "AttributeError: 'int' object has no attribute 'upper'",
      },
    ],
    related: ["concept.function", "concept.mutability", "python.types.str.upper", "python.types.list.append"],
  },
  {
    id: "concept.mutability",
    scope: "concept",
    category: "concept",
    title: "Mutability",
    summary: "Whether a value can be changed in place. Lists can (they're mutable); strings and numbers can't (they're immutable).",
    aliases: ["mutable", "immutable", "immutability"],
    keywords: ["change in place", "does it change the original", "modify"],
    explanation: [
      "A **mutable** value can be changed after it's created. A list is mutable: [`append()`](ref:python.types.list.append) adds an item to the same list.",
      "An **immutable** value can't be changed. Strings and numbers are immutable, so a string method like [`upper()`](ref:python.types.str.upper) gives back a **new** string and leaves the original as it was.",
      "This is why some methods return a new value you need to store, while others change the object and return `None`.",
    ],
    examples: [
      {
        code: `word = "cat"
loud = word.upper()
print(word)
print(loud)

items = ["pen"]
items.append("book")
print(items)`,
        output: ["cat", "CAT", "['pen', 'book']"],
        caption: "`upper()` made a new string; `word` is unchanged. `append()` changed the list itself.",
      },
    ],
    mistakes: [
      {
        title: "Expecting a string method to change the string",
        explanation: "`word.upper()` returns a new string, but nothing stores it. `word` still refers to `\"cat\"`. Write `word = word.upper()` to keep the result.",
        code: `word = "cat"
word.upper()
print(word)`,
        output: ["cat"],
      },
      {
        title: "Storing the result of a list method that changes the list",
        explanation: "`append()` changes the list and returns `None`. Assigning that back to `items` replaces the list with `None`.",
        code: `items = ["pen"]
items = items.append("book")
print(items)`,
        output: ["None"],
      },
    ],
    related: ["python.types.str.upper", "python.types.list.append", "python.types.str", "python.types.list"],
  },
];
