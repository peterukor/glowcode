import type { Lesson } from "@/courses/types";
import type { CallEvent, Walkthrough } from "@/types/trace";
import { buildSteps, py } from "@/walkthrough/build";

const intCall = (phase: CallEvent["phase"]): CallEvent => ({ name: "int", args: ['"18"'], returns: "18", assignTo: "age", phase });

const intConversion: Walkthrough = {
  id: "py-int-conversion",
  title: "Turning \"18\" into 18",
  language: "python",
  visualizations: ["function", "variables"],
  code: `age_text = "18"
age = int(age_text)

print(age + 2)`,
  steps: buildSteps([
    { line: 1, set: { age_text: py.str("18") }, highlight: "age_text", note: "age_text refers to the string \"18\": two characters, not a number." },
    {
      line: 2,
      call: intCall("call"),
      note: "Right side first. Python looks up age_text and calls int() with its value, the string \"18\".",
    },
    {
      line: 2,
      call: intCall("result"),
      note: "int() hands back a new value: the int 18. It doesn't print anything, and it doesn't change age_text.",
      checkpoint: {
        prompt: "`int()` has been given the string `\"18\"`. What does it hand back?",
        choices: [
          { id: "int", text: "The number `18` (an `int`)" },
          {
            id: "str",
            text: "The string `\"18\"` again",
            feedback: "Then `int()` would have done nothing. Its job is to make a new value of a different type.",
          },
          {
            id: "prints",
            text: "Nothing: it prints `18` on the screen",
            feedback: "Converting isn't printing. `int()` hands its result back to line 2, which can then store it.",
          },
        ],
        answer: "int",
        explanation: "`int()` returns a new `int` made from the text. Nothing is printed; the value goes back to line 2.",
      },
    },
    {
      line: 2,
      set: { age: py.int(18) },
      highlight: "age",
      call: intCall("assign"),
      note: "The assignment finishes: age refers to the int 18. age_text still refers to the string \"18\".",
    },
    { line: 4, print: ["20"], note: "age is a number, so age + 2 is arithmetic: 18 + 2 = 20." },
  ]),
};

/** Chapter 2, lesson 6: + on numbers versus strings, type(), int(), float(), str() and ValueError. */
export const typeConversion: Lesson = {
  id: "type-conversion",
  title: "Strings, Numbers & Type Conversion",
  description: "Why \"18\" + \"2\" is \"182\", how to check a type with type(), and how int(), float() and str() make new values.",
  status: "published",
  objectives: [
    "Predict whether `+` adds numbers or joins strings.",
    "Use `type()` to check what type a value is.",
    "Convert between types with `int()`, `float()` and `str()`, and explain that each returns a new value.",
    "Explain why some conversions fail with a ValueError.",
  ],
  references: [
    "python.builtins.type",
    "python.builtins.int",
    "python.builtins.float",
    "python.builtins.str",
    "python.errors.TypeError",
    "python.errors.ValueError",
  ],
  sections: [
    {
      id: "why",
      title: "A number that arrives as text",
      blocks: [
        {
          type: "text",
          text: "A website form, a file or a user typing at a keyboard all give a program **text**. Someone's age arrives as the string `\"18\"`, not the number 18. To work out their age in two years, the program first has to turn that text into a number. Knowing which type you have, and how to change it, prevents some of the most common beginner bugs.",
        },
      ],
    },
    {
      id: "plus",
      title: "+ adds numbers but joins strings",
      blocks: [
        {
          type: "code",
          language: "python",
          code: `print(18 + 2)
print("18" + "2")`,
          output: ["20", "182"],
          caption: "Same `+`, different types, different results.",
        },
        {
          type: "text",
          text: "With two numbers, `+` adds. With two strings, `+` **joins** them end to end, which is called concatenation: `\"18\"` followed by `\"2\"` is `\"182\"`. Python decides which job `+` does from the types of the values on each side.",
        },
        {
          type: "question",
          id: "debug-mixed-plus",
          variant: "debug",
          prompt: "This line mixes a string and a number. Why does Python stop?",
          code: `print("18" + 2)`,
          errorOutput: `Traceback (most recent call last):
  File "main.py", line 1, in <module>
    print("18" + 2)
          ~~~~~^~~
TypeError: can only concatenate str (not "int") to str`,
          choices: [
            {
              id: "guess",
              text: "Python should have added them to make 20",
              feedback: "Python never guesses whether you meant the text or the number. With a string on the left, `+` would have to join, and you can't join a number.",
            },
            { id: "mixed", text: "`+` can join two strings or add two numbers, but not one of each" },
            {
              id: "spaces",
              text: "There must be no spaces around `+`",
              feedback: "Spaces around operators don't matter. The last line of the error names the problem: the types.",
            },
          ],
          answer: "mixed",
          explanation:
            "This is a [TypeError](ref:python.errors.TypeError): the operation got types it can't combine. Decide which you meant: `int(\"18\") + 2` adds to make 20, and `\"18\" + str(2)` joins to make `\"182\"`.",
        },
      ],
    },
    {
      id: "type-function",
      title: "Asking Python for the type",
      blocks: [
        {
          type: "text",
          text: "[`type()`](ref:python.builtins.type) tells you which type a value has. When printed, it shows as `<class '...'>` with the type's name inside.",
        },
        {
          type: "code",
          language: "python",
          code: `print(type(18))
print(type("18"))
print(type(9.99))
print(type(True))`,
          output: ["<class 'int'>", "<class 'str'>", "<class 'float'>", "<class 'bool'>"],
        },
      ],
    },
    {
      id: "converting",
      title: "Converting with int(), float() and str()",
      blocks: [
        {
          type: "text",
          text: "Each type has a function with its name that makes a value of that type: [`int()`](ref:python.builtins.int), [`float()`](ref:python.builtins.float) and [`str()`](ref:python.builtins.str). They **return a new value**; the value you give them is left as it was.",
        },
        {
          type: "code",
          language: "python",
          code: intConversion.code,
          caption: "Watch the string go into `int()`, the number come back, and only then the assignment.",
          walkthrough: intConversion,
        },
        {
          type: "code",
          language: "python",
          code: `price = float("9.99")
print(price * 2)
print("Age: " + str(18))`,
          output: ["19.98", "Age: 18"],
          caption: "`float()` reads a decimal from text. `str()` turns a number into text, so `+` can join it.",
        },
        {
          type: "question",
          id: "predict-convert-then-join",
          variant: "predict",
          prompt: "What does this program print?",
          code: `count = 3
print(str(count) + str(count))`,
          choices: [
            {
              id: "six",
              text: "`6`",
              feedback: "`str(count)` is the string `\"3\"`. What does `+` do with two strings?",
            },
            { id: "joined", text: "`33`" },
            {
              id: "error",
              text: "An error",
              feedback: "Both sides of `+` are strings here, so joining them is fine.",
            },
          ],
          answer: "joined",
          explanation: "`str(count)` returns the string `\"3\"`, so the line joins `\"3\"` and `\"3\"` to make `\"33\"`. `count` itself still refers to the int 3.",
        },
      ],
    },
    {
      id: "value-error",
      title: "Not every string is a number",
      blocks: [
        {
          type: "text",
          text: "`int()` only works on text that spells a whole number. `\"18\"` works, and so does `\" 18 \"` with spaces around it. `\"eighteen\"` doesn't, and neither does `\"18.5\"`, which needs `float()`. A string that can't be converted stops the program with a [ValueError](ref:python.errors.ValueError): the type was right (a string), but its value wasn't usable.",
        },
        {
          type: "question",
          id: "debug-int-word",
          variant: "debug",
          prompt: "The age was written out in words. What went wrong?",
          code: `age_text = "eighteen"
age = int(age_text)`,
          errorOutput: `Traceback (most recent call last):
  File "main.py", line 2, in <module>
    age = int(age_text)
ValueError: invalid literal for int() with base 10: 'eighteen'`,
          choices: [
            {
              id: "type",
              text: "`int()` can't accept strings",
              feedback: "It accepts strings: `int(\"18\")` works. The error is a ValueError, not a TypeError. What's wrong with this particular string?",
            },
            { id: "content", text: "`int()` can only convert text made of digits, and `\"eighteen\"` is a word" },
            {
              id: "name",
              text: "`age_text` was never created",
              feedback: "Line 1 creates it. A missing name would be a NameError, and the message quotes `'eighteen'`, so Python found the value.",
            },
          ],
          answer: "content",
          explanation:
            "`int()` reads digits, not words. The message quotes the exact value it couldn't convert, `'eighteen'`. The program needs the age as digits, like `\"18\"`.",
        },
      ],
    },
    {
      id: "practice",
      title: "Your turn",
      blocks: [
        {
          type: "practice",
          id: "practice-shop-total",
          context: "A shop's order form sends everything as text: the price is `\"4.50\"` and the quantity is `\"3\"`.",
          prompt: "Store both values as strings, convert each one to a suitable number, and print the total cost (price × quantity). Then print a line that joins `\"Total: \"` with the total.",
          checklist: [
            "The price is converted with `float()`, the quantity with `int()`.",
            "The calculation uses the converted numbers, not the strings.",
            "The last line uses `str()` to join the total to text with `+`.",
          ],
          hints: ["`*` multiplies in Python.", "`\"Total: \" + total` is a TypeError. What does `total` need to become first?"],
          solution: `price_text = "4.50"
quantity_text = "3"

price = float(price_text)
quantity = int(quantity_text)
total = price * quantity

print(total)
print("Total: " + str(total))`,
          solutionNote:
            "A float times an int gives a float: `4.5 * 3` is `13.5`. Using `print(\"Total:\", total)` with a comma would also work, because `print()` handles each value itself.",
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
            "`+` adds two numbers and joins two strings. A string and a number together is a TypeError.",
            "`type(value)` tells you a value's type.",
            "`int()`, `float()` and `str()` return a **new** value of that type; the original doesn't change.",
            "Text that doesn't spell a number makes `int()` or `float()` fail with a **ValueError**.",
          ],
        },
      ],
    },
  ],
};
