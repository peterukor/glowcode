import { getExample } from "@/data/examples";
import type { ReferenceEntry } from "../types";

// Curated walkthroughs that already exist in the playground. Reused, never rewritten here.
const lenWalkthrough = getExample("len");
const reassignWalkthrough = getExample("reassign");
const elifWalkthrough = getExample("elif");
const ifElseWalkthrough = getExample("if-else");
const loopWalkthrough = getExample("loop");

const CONCAT_ERROR = 'TypeError: can only concatenate str (not "int") to str';

/** Data types, and the methods that belong to each one (`parent` points at the type). */
const types: ReferenceEntry[] = [
  {
    id: "python.types.int",
    scope: "python",
    category: "data-type",
    title: "int",
    summary: "Whole numbers like 13, 0 or -5. Short for integer.",
    aliases: ["integer", "integers", "whole number", "number"],
    explanation: [
      "An **int** is a whole number, with no decimal point: `13`, `0`, `-5`. You write it without quotes.",
      "You can do arithmetic with ints. Dividing with `/` always gives a decimal number (a `float`), even when it divides evenly. `//` divides and drops the remainder, giving an int.",
    ],
    examples: [
      {
        code: `apples = 7
print(apples + 3)
print(apples / 2)
print(apples // 2)`,
        output: ["10", "3.5", "3"],
      },
    ],
    mistakes: [
      {
        title: "Joining a number to text with +",
        explanation: '`+` can add two numbers or join two strings, but not one of each. Use a comma in `print()`, or turn the number into text with `str(age)`.',
        code: `age = 13
print("Age: " + age)`,
        error: CONCAT_ERROR,
      },
    ],
    related: ["python.types.str", "python.operators.addition", "python.builtins.type", "python.errors.TypeError"],
  },
  {
    id: "python.types.str",
    scope: "python",
    category: "data-type",
    title: "str",
    summary: 'Text, written inside quotes like "Ada". Short for string: a string of characters.',
    aliases: ["string", "strings", "text"],
    keywords: ["quotes", "characters", "words"],
    explanation: [
      'A **string** (type `str`) is text: letters, digits, spaces, symbols. You write it inside quotes, either `"double"` or `\'single\'`. The quotes aren\'t part of the text; they show Python where it starts and ends.',
      "Strings are **immutable**: once made, they can't be changed. Methods like [`upper()`](ref:python.types.str.upper) give back a new string instead.",
    ],
    examples: [
      {
        code: `name = "Ada"
print("Hi, " + name)
print(len(name))
print(name.upper())
print(name)`,
        output: ["Hi, Ada", "3", "ADA", "Ada"],
        caption: "`+` joins strings, `len()` counts characters, and `upper()` makes a new string. `name` itself never changes.",
      },
    ],
    mistakes: [
      {
        title: "Forgetting the quotes",
        explanation: "Without quotes, Python treats `Hello` as the name of a variable, and there isn't one.",
        code: `print(Hello)`,
        error: "NameError: name 'Hello' is not defined",
      },
    ],
    related: ["python.types.str.upper", "python.builtins.len", "concept.mutability", "python.types.int"],
  },
  {
    id: "python.types.str.upper",
    scope: "python",
    category: "method",
    parent: "python.types.str",
    title: "str.upper()",
    summary: "Gives back a copy of the string with every letter in capitals. The original string doesn't change.",
    aliases: ["upper", "upper()", ".upper()"],
    keywords: ["uppercase", "upper case", "capital letters", "all caps", "string uppercase"],
    explanation: [
      "`upper()` is a [method](ref:concept.method) of strings. It gives back a **new** string with every letter changed to a capital. Digits, spaces and symbols stay the same.",
      "It doesn't change the original string. Strings can't be changed ([they're immutable](ref:concept.mutability)), so if you want to keep the capitals, store the result.",
    ],
    syntax: "text.upper()",
    accepts: "Nothing goes inside the parentheses. It works on the string before the dot.",
    returns: "A new string in capitals.",
    prints: "Nothing.",
    changes: "Nothing. The original string stays as it was.",
    examples: [
      {
        code: `word = "cat"
loud = word.upper()
print(loud)
print(word)`,
        output: ["CAT", "cat"],
        caption: '`word.upper()` returns `"CAT"`, which is stored in `loud`. `word` still refers to `"cat"`.',
        call: { name: "upper", receiver: "word", receiverValue: '"cat"', args: [], returns: '"CAT"', assignTo: "loud", phase: "assign" },
      },
      {
        code: `print("Hello, World".upper())`,
        output: ["HELLO, WORLD"],
        caption: "Works directly on a string too. Only the letters change.",
      },
    ],
    mistakes: [
      {
        title: "Expecting the string to change",
        explanation: "The new string is returned but never stored, so `word` is still lowercase. Write `word = word.upper()` to keep it.",
        code: `word = "cat"
word.upper()
print(word)`,
        output: ["cat"],
      },
    ],
    related: ["python.types.str", "concept.method", "concept.return-value", "concept.mutability"],
  },
  {
    id: "python.types.list",
    scope: "python",
    category: "data-type",
    title: "list",
    summary: "An ordered collection of values in square brackets, like [3, 5, 7]. Lists can be changed.",
    aliases: ["lists", "array", "collection"],
    keywords: ["square brackets", "items", "index"],
    explanation: [
      "A **list** holds several values in order, written inside square brackets and separated by commas: `[\"pen\", \"book\"]`. Each item has a position, its **index**, counting from 0.",
      "Lists are **mutable**: you can add, remove and replace items in the same list, for example with [`append()`](ref:python.types.list.append).",
    ],
    examples: [
      {
        code: `items = ["pen", "book"]
items.append("ruler")
print(items)
print(len(items))
print(items[0])`,
        output: ["['pen', 'book', 'ruler']", "3", "pen"],
        caption: "When Python prints a list, it shows strings in single quotes.",
      },
    ],
    mistakes: [
      {
        title: "Asking for an index that doesn't exist",
        explanation: "A list with one item only has index 0. Indexes go from 0 to one less than `len(items)`.",
        code: `items = ["pen"]
print(items[1])`,
        error: "IndexError: list index out of range",
      },
    ],
    related: ["python.types.list.append", "python.builtins.len", "concept.mutability", "python.keywords.for"],
  },
  {
    id: "python.types.list.append",
    scope: "python",
    category: "method",
    parent: "python.types.list",
    title: "list.append()",
    summary: "Adds one item to the end of a list. It changes the list itself and returns None.",
    aliases: ["append", "append()", ".append()"],
    keywords: ["add", "add item", "add to list", "push", "list add item", "put at the end"],
    explanation: [
      "`append()` is a [method](ref:concept.method) of lists. It adds the item you give it to the **end** of the list.",
      "It changes the list you call it on, which is possible because lists are [mutable](ref:concept.mutability). It doesn't give back the list: it returns [`None`](ref:python.types.None).",
    ],
    syntax: "items.append(item)",
    parameters: [{ name: "item", description: "The value to add. Exactly one; it can be any type." }],
    returns: "`None`.",
    prints: "Nothing.",
    changes: "The list: it has one more item at the end.",
    examples: [
      {
        code: `items = ["pen"]
items.append("book")
print(items)`,
        output: ["['pen', 'book']"],
        call: {
          name: "append",
          receiver: "items",
          receiverValue: "['pen']",
          args: ['"book"'],
          changes: "['pen', 'book']",
          returns: "None",
          phase: "result",
        },
      },
      {
        code: `items = []
items.append("apple")
items.append("kiwi")
print(items)`,
        output: ["['apple', 'kiwi']"],
        caption: "Start with an empty list and add to it. Each item goes on the end.",
      },
    ],
    mistakes: [
      {
        title: "Storing what append() returns",
        explanation: "`append()` returns `None`, so this replaces the list with `None`. Just call `items.append(\"book\")` on its own line.",
        code: `items = ["pen"]
items = items.append("book")
print(items)`,
        output: ["None"],
      },
      {
        title: "Adding two items at once",
        explanation: "`append()` takes exactly one item. Call it twice, once per item.",
        code: `items = []
items.append("a", "b")`,
        error: "TypeError: list.append() takes exactly one argument (2 given)",
      },
    ],
    related: ["python.types.list", "concept.method", "concept.mutability", "python.types.None"],
  },
  {
    id: "python.types.None",
    scope: "python",
    category: "data-type",
    title: "None",
    summary: "Python's value for \"nothing here\". Functions that have nothing to give back return None.",
    aliases: ["none", "null", "nothing", "NoneType"],
    explanation: [
      "**`None`** is a special value meaning \"no value\". It's written with a capital N and no quotes.",
      "You'll mostly meet it as a [return value](ref:concept.return-value): functions and methods that do their job without giving anything back, like `print()` and `append()`, return `None`.",
    ],
    examples: [
      {
        code: `result = print("hi")
print(result)`,
        output: ["hi", "None"],
        caption: "`print(\"hi\")` prints `hi` and returns `None`, which is stored in `result`.",
      },
    ],
    related: ["concept.return-value", "python.builtins.print", "python.types.list.append"],
  },
];

const builtins: ReferenceEntry[] = [
  {
    id: "python.builtins.print",
    scope: "python",
    category: "built-in",
    title: "print()",
    summary: "Shows values as text on the screen. It displays information; it doesn't give a value back to your program (it returns None).",
    aliases: ["print", "output", "display"],
    keywords: ["show", "show on screen", "console", "write text"],
    explanation: [
      "`print()` shows values on the screen as text, then moves to a new line. It's how a program tells you what it's doing.",
      "Give it several values separated by commas and it prints them on one line, with a space between each. It doesn't give anything useful back: it returns [`None`](ref:python.types.None).",
    ],
    syntax: `print(value)
print(value1, value2, ...)`,
    parameters: [
      { name: "value", description: "What to show. Any type: text, numbers, lists. Separate several values with commas." },
      { name: "end", description: "What to put after the last value. Normally a new line.", optional: true },
    ],
    returns: "`None`.",
    prints: "The values as text, separated by spaces, followed by a new line.",
    changes: "Nothing.",
    examples: [
      {
        code: `print("Hello")
print("Age:", 13)`,
        output: ["Hello", "Age: 13"],
        caption: "With a comma, `print()` puts a space between the values for you.",
        call: { name: "print", args: ['"Hello"'], prints: ["Hello"], returns: "None", phase: "result" },
      },
      {
        code: `result = print("Hi")
print(result)`,
        output: ["Hi", "None"],
        caption: "Printing isn't returning: `print()` shows `Hi` and gives back `None`.",
      },
    ],
    mistakes: [
      {
        title: "Writing Print with a capital P",
        explanation: "Python is case-sensitive. Only `print` exists.",
        code: `Print("Hello")`,
        error: "NameError: name 'Print' is not defined. Did you mean: 'print'?",
      },
      {
        title: "Joining text and a number with +",
        explanation: "Use a comma instead: `print(\"Age:\", 13)`.",
        code: `print("Age: " + 13)`,
        error: CONCAT_ERROR,
      },
    ],
    related: ["concept.return-value", "python.types.None", "python.builtins.input", "concept.function"],
  },
  {
    id: "python.builtins.input",
    scope: "python",
    category: "built-in",
    title: "input()",
    summary: "Shows a prompt, waits for the user to type something and press Enter, and returns what they typed as a string.",
    aliases: ["input", "read input", "ask the user"],
    keywords: ["keyboard", "type", "user typed", "prompt"],
    explanation: [
      "`input()` pauses the program and waits for the user to type something and press Enter. If you give it a **prompt**, it shows that first, so the user knows what to type.",
      "It gives back what the user typed, **always as a string**, even if they typed a number. To do maths with it, turn it into a number first with `int()`.",
    ],
    syntax: "input(prompt)",
    parameters: [{ name: "prompt", description: "Text to show before the user types, like `\"Enter your name: \"`.", optional: true }],
    returns: "What the user typed, as a string (without the Enter).",
    prints: "The prompt, if you give one. What the user types also appears on the screen as they type it.",
    changes: "Nothing.",
    examples: [
      {
        code: `name = input("Enter your name: ")
print(name.upper())`,
        input: ["Ada"],
        output: ["Enter your name: Ada", "ADA"],
        caption: "When the user types `Ada`: `input()` returns `\"Ada\"`, and `upper()` makes `\"ADA\"` from it.",
      },
      {
        code: `age = input("Age? ")
print(int(age) + 1)`,
        input: ["13"],
        output: ["Age? 13", "14"],
        caption: '`input()` returns `"13"` (text). `int(age)` turns it into the number 13.',
      },
    ],
    mistakes: [
      {
        title: "Doing maths with what input() returns",
        explanation: "`age` refers to the string `\"13\"`, not the number 13, and a string can't be added to an int. Use `int(age)`.",
        code: `age = input("Age? ")
print(age + 1)`,
        input: ["13"],
        error: CONCAT_ERROR,
      },
    ],
    related: ["python.types.str", "python.builtins.print", "python.builtins.type", "python.errors.TypeError"],
  },
  {
    id: "python.builtins.len",
    scope: "python",
    category: "built-in",
    title: "len()",
    summary: "Tells you how many items are in a collection, or how many characters are in a string.",
    aliases: ["len", "length", "size"],
    keywords: ["count", "how many", "number of items", "number of characters", "how long"],
    explanation: [
      "`len()` counts. Give it a string and it gives back how many characters it has (spaces count too). Give it a list and it gives back how many items are in it.",
      "It **returns** the count; it doesn't print it. To see the number, store it and print it, or pass it straight to `print()`.",
    ],
    syntax: "len(value)",
    parameters: [{ name: "value", description: "A string, list or other collection." }],
    accepts: "Collections only. A number has no length: `len(5)` is an error.",
    returns: "The count, as an int.",
    prints: "Nothing.",
    changes: "Nothing.",
    examples: [
      {
        code: lenWalkthrough.code,
        output: ["3"],
        caption: "`len(word)` returns 3, `length` receives that value, and `print(length)` displays it. Calling `len()` doesn't print anything by itself.",
        call: { name: "len", args: ['"cat"'], returns: "3", assignTo: "length", phase: "assign" },
        walkthrough: lenWalkthrough,
      },
      {
        code: `print(len(["pen", "book"]))
print(len(""))`,
        output: ["2", "0"],
        caption: "A list's length is its number of items. An empty string has length 0.",
      },
    ],
    mistakes: [
      {
        title: "Asking for the length of a number",
        explanation: "Numbers aren't collections. To count digits, turn the number into a string first: `len(str(12345))`.",
        code: `print(len(5))`,
        error: "TypeError: object of type 'int' has no len()",
      },
      {
        title: "Expecting len() to show the answer",
        explanation: "`len(word)` works out 3 and returns it, but nothing prints it. Wrap it in `print()`.",
        code: `word = "cat"
len(word)`,
        output: [],
      },
    ],
    related: ["concept.return-value", "python.types.str", "python.types.list", "python.builtins.print"],
  },
  {
    id: "python.builtins.type",
    scope: "python",
    category: "built-in",
    title: "type()",
    summary: "Tells you what type a value is, like int or str.",
    aliases: ["type", "typeof"],
    keywords: ["what type", "kind of value", "data type of"],
    explanation: [
      "`type()` tells you what kind of value something is. It's useful when a program misbehaves because a value isn't the type you expected, like a number that's really a string.",
      "When printed, a type shows as `<class 'int'>`, `<class 'str'>` and so on.",
    ],
    syntax: "type(value)",
    parameters: [{ name: "value", description: "Any value." }],
    returns: "The value's type.",
    prints: "Nothing.",
    changes: "Nothing.",
    examples: [
      {
        code: `print(type(13))
print(type("13"))
print(type(3.5))`,
        output: ["<class 'int'>", "<class 'str'>", "<class 'float'>"],
        caption: "`13` and `\"13\"` look alike but are different types.",
      },
      {
        code: `age = input("Age? ")
print(type(age))`,
        input: ["13"],
        output: ["Age? 13", "<class 'str'>"],
        caption: "Even when the user types a number, `input()` returns a string.",
      },
    ],
    related: ["python.types.int", "python.types.str", "python.builtins.input"],
  },
];

const keywords: ReferenceEntry[] = [
  {
    id: "python.keywords.if",
    scope: "python",
    category: "keyword",
    title: "if",
    summary: "Runs a block of code only when a condition is True. Add elif to check more conditions in turn.",
    aliases: ["elif", "if statement", "conditional"],
    keywords: ["condition", "decision", "choose", "else if", "when"],
    explanation: [
      "`if` lets a program make a decision. Python works out the **condition** after `if`. When it's `True`, the indented block underneath runs; when it's `False`, Python skips the block.",
      "`elif` (short for \"else if\") adds another condition, checked only if every condition above it was `False`. Python runs the **first** block whose condition is `True` and skips the rest. Add [`else`](ref:python.keywords.else) for a block that runs when none of them were.",
    ],
    syntax: `if condition:
    # runs when condition is True
elif other_condition:
    # runs when the first was False and this is True`,
    examples: [
      {
        code: `temperature = 30
if temperature > 25:
    print("Wear a hat")
print("Done")`,
        output: ["Wear a hat", "Done"],
        caption: "The indented line belongs to the `if`. The last line isn't indented, so it always runs.",
      },
      {
        code: elifWalkthrough.code,
        output: ["B"],
        caption: "Walk through it: the first condition is False, so Python checks the `elif`.",
        walkthrough: elifWalkthrough,
      },
    ],
    mistakes: [
      {
        title: "Forgetting the colon",
        explanation: "Every `if` and `elif` line ends with `:`.",
        code: `age = 16
if age > 13
    print("Teen")`,
        error: "SyntaxError: expected ':'",
      },
      {
        title: "Not indenting the block",
        explanation: "The lines that belong to the `if` must be indented (4 spaces is the convention).",
        code: `if True:
print("x")`,
        error: "IndentationError: expected an indented block after 'if' statement on line 1",
      },
      {
        title: "Using = instead of ==",
        explanation: "`=` assigns; `==` compares. In a condition you almost always want `==`.",
        code: `age = 13
if age = 13:
    print("Thirteen")`,
        error: "SyntaxError: invalid syntax. Maybe you meant '==' or ':=' instead of '='?",
      },
    ],
    related: ["python.keywords.else", "python.keywords.while", "python.operators.assignment"],
  },
  {
    id: "python.keywords.else",
    scope: "python",
    category: "keyword",
    title: "else",
    summary: "Gives an if statement a block to run when none of its conditions were True.",
    aliases: ["otherwise", "if else"],
    explanation: [
      "`else` comes after an `if` (and any `elif`s). Its block runs only when every condition above it was `False`. It has no condition of its own.",
      "With an `else`, exactly one block of the whole statement always runs.",
    ],
    syntax: `if condition:
    # runs when condition is True
else:
    # runs when it was False`,
    examples: [
      {
        code: ifElseWalkthrough.code,
        output: ["Minor"],
        caption: "16 >= 18 is False, so the else block runs. Walk through it to predict the branch first.",
        walkthrough: ifElseWalkthrough,
      },
    ],
    mistakes: [
      {
        title: "Giving else a condition",
        explanation: "`else` never has a condition. Use `elif` if you need one, or just `else:`.",
        code: `age = 16
if age >= 18:
    print("Adult")
else age < 18:
    print("Minor")`,
        error: "SyntaxError: expected ':'",
      },
    ],
    related: ["python.keywords.if"],
  },
  {
    id: "python.keywords.for",
    scope: "python",
    category: "keyword",
    title: "for",
    summary: "Repeats a block once for each item in a sequence, like a list or a string.",
    aliases: ["for loop", "loop", "iterate", "for each"],
    keywords: ["repeat", "each item", "go through a list", "range"],
    explanation: [
      "A `for` loop goes through a sequence one item at a time. Each time round (each **iteration**), the loop variable refers to the next item, and the indented block runs.",
      "When there are no items left, the loop ends and Python carries on with the line after the block. To repeat something a set number of times, loop over `range(n)`, which gives the numbers 0 up to n - 1.",
    ],
    syntax: `for item in sequence:
    # runs once for each item`,
    examples: [
      {
        code: loopWalkthrough.code,
        output: ["15"],
        caption: "Walk through it to watch line 2 and 3 run again on every lap.",
        walkthrough: loopWalkthrough,
      },
      {
        code: `for letter in "cat":
    print(letter)`,
        output: ["c", "a", "t"],
        caption: "A string is a sequence of characters, so the loop gets one character at a time.",
      },
      {
        code: `for i in range(3):
    print(i)`,
        output: ["0", "1", "2"],
      },
    ],
    mistakes: [
      {
        title: "Not indenting the loop body",
        explanation: "The lines that repeat must be indented under the `for`.",
        code: `for letter in "cat":
print(letter)`,
        error: "IndentationError: expected an indented block after 'for' statement on line 1",
      },
    ],
    related: ["python.keywords.while", "python.types.list", "python.types.str", "python.builtins.len"],
  },
  {
    id: "python.keywords.while",
    scope: "python",
    category: "keyword",
    title: "while",
    summary: "Repeats a block as long as a condition stays True.",
    aliases: ["while loop", "loop"],
    keywords: ["repeat until", "keep going", "infinite loop"],
    explanation: [
      "A `while` loop checks its condition, and if it's `True`, runs the indented block, then checks again. It stops as soon as the condition is `False`.",
      "Something inside the loop has to change so that the condition eventually becomes `False`. Otherwise the loop never ends.",
    ],
    syntax: `while condition:
    # runs again and again while condition is True`,
    examples: [
      {
        code: `count = 3
while count > 0:
    print(count)
    count = count - 1
print("Go!")`,
        output: ["3", "2", "1", "Go!"],
        caption: "Each lap prints `count` and lowers it by 1. When it reaches 0, `count > 0` is False and the loop ends.",
      },
    ],
    mistakes: [
      {
        title: "Never changing the condition",
        explanation: "Nothing in this loop changes `count`, so `count > 0` stays True forever and the program never finishes. (Stop it with Ctrl+C.)",
        code: `count = 3
while count > 0:
    print(count)`,
        neverEnds: true,
      },
    ],
    related: ["python.keywords.for", "python.keywords.if"],
  },
];

const operators: ReferenceEntry[] = [
  {
    id: "python.operators.assignment",
    scope: "python",
    category: "operator",
    title: "= (assignment)",
    summary: "Works out the value on the right, then makes the name on the left refer to it. It is not the math 'equals'.",
    aliases: ["=", "assignment", "assign", "equals sign"],
    keywords: ["set a variable", "store", "make a variable"],
    explanation: [
      "`=` is an instruction, not a statement that two things are equal. Python always does it in two steps: first it works out the value on the **right**; then it makes the name on the **left** refer to that value.",
      "That's why `count = count + 2` makes sense in Python: the right side uses the value `count` refers to now, and only then does `count` move to the result.",
    ],
    syntax: "name = value",
    examples: [
      {
        code: reassignWalkthrough.code,
        output: ["5"],
        caption: "Walk through it to see the calculation and the assignment as two separate steps.",
        walkthrough: reassignWalkthrough,
      },
    ],
    mistakes: [
      {
        title: "Writing it backwards",
        explanation: "The name always goes on the left.",
        code: `13 = age`,
        error: "SyntaxError: cannot assign to literal here. Maybe you meant '==' instead of '='?",
      },
    ],
    related: ["concept.variable", "python.keywords.if", "python.errors.NameError"],
  },
  {
    id: "python.operators.addition",
    scope: "python",
    category: "operator",
    title: "+ (addition)",
    summary: "Adds two numbers. With two strings it joins them instead: \"Hi, \" + \"Sam\" gives \"Hi, Sam\".",
    aliases: ["+", "plus", "add", "concatenate", "join strings"],
    keywords: ["sum", "join text", "concatenation"],
    explanation: [
      "With numbers, `+` adds. With two strings, it joins them end to end (this is called **concatenation**).",
      "Both sides must be numbers, or both must be strings. Python won't guess what you meant by adding a number to text.",
    ],
    syntax: "left + right",
    examples: [
      {
        code: `print(2 + 3)
print("Hi, " + "Sam")
print(1.5 + 2)`,
        output: ["5", "Hi, Sam", "3.5"],
      },
    ],
    mistakes: [
      {
        title: "Adding a number to a string",
        explanation: "Turn the number into text with `str()`, or print the two with a comma between.",
        code: `age = 13
print("Age: " + age)`,
        error: CONCAT_ERROR,
      },
    ],
    related: ["python.types.int", "python.types.str", "python.errors.TypeError"],
  },
];

const errors: ReferenceEntry[] = [
  {
    id: "python.errors.NameError",
    scope: "python",
    category: "error",
    title: "NameError",
    summary: "Python stopped because the code used a name it doesn't know. Usually a typo, a capital letter, or a variable used before it was created.",
    aliases: ["name error"],
    keywords: ["not defined", "is not defined", "name is not defined", "undefined", "did you mean"],
    explanation: [
      "A **NameError** means Python met a name it has never heard of. The last line of the message names it: `name 'score' is not defined`.",
      "Check three things: the spelling and capitals (Python is case-sensitive), whether the variable has been created **above** this line, and whether you meant to write text and forgot the quotes. Newer versions of Python add a suggestion like `Did you mean: 'print'?`.",
    ],
    mistakes: [
      {
        title: "A capital letter in the wrong place",
        explanation: "`age` and `Age` are different names.",
        code: `age = 13
print(Age)`,
        error: "NameError: name 'Age' is not defined. Did you mean: 'age'?",
      },
      {
        title: "Using a variable before it exists",
        explanation: "Python runs from the top and doesn't look ahead.",
        code: `print(score)
score = 10`,
        error: "NameError: name 'score' is not defined",
      },
      {
        title: "Forgetting the quotes around text",
        explanation: "Without quotes, `Hello` is treated as a variable name.",
        code: `print(Hello)`,
        error: "NameError: name 'Hello' is not defined",
      },
    ],
    related: ["concept.variable", "python.operators.assignment", "python.types.str", "concept.interpreter"],
  },
  {
    id: "python.errors.TypeError",
    scope: "python",
    category: "error",
    title: "TypeError",
    summary: "Python stopped because an operation got a value of the wrong type, like adding a number to text.",
    aliases: ["type error"],
    keywords: ["can only concatenate", "unsupported operand", "wrong type", "has no len", "takes exactly one argument"],
    explanation: [
      "A **TypeError** means an operation or function got a kind of value it can't work with. The message says which types were involved.",
      "The usual cause for beginners is mixing numbers and strings, often because [`input()`](ref:python.builtins.input) always returns a string. [`type()`](ref:python.builtins.type) helps you check what you actually have.",
    ],
    mistakes: [
      {
        title: "Adding a number to text",
        explanation: "Use `str(age)` to turn the number into text, or a comma in `print()`.",
        code: `age = 13
print("Age: " + age)`,
        error: CONCAT_ERROR,
      },
      {
        title: "Doing maths with input()",
        explanation: "`input()` returns a string. Turn it into a number with `int()` first.",
        code: `age = input("Age? ")
print(age + 1)`,
        input: ["13"],
        error: CONCAT_ERROR,
      },
      {
        title: "Asking for the length of a number",
        explanation: "`len()` only works on collections like strings and lists.",
        code: `print(len(5))`,
        error: "TypeError: object of type 'int' has no len()",
      },
    ],
    related: ["python.types.int", "python.types.str", "python.builtins.input", "python.builtins.type"],
  },
];

export const pythonEntries: ReferenceEntry[] = [...types, ...builtins, ...keywords, ...operators, ...errors];
