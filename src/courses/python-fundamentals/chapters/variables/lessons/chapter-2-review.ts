import type { Lesson } from "@/courses/types";

/**
 * Chapter 2, lesson 8: review. New programs only; every activity asks the student to apply an
 * idea (names, types, reassignment, conversion, input, NameError) rather than recall it.
 */
export const chapterTwoReview: Lesson = {
  id: "chapter-2-review",
  title: "Chapter Review & Practice",
  description: "Trace, predict and debug programs that use variables, types, conversion and input.",
  status: "published",
  objectives: [
    "Trace a program and give every variable's value after each line.",
    "Identify types and predict what conversions and `+` produce.",
    "Explain what `input()` returns and when a conversion fails.",
    "Find and fix NameErrors and type mistakes.",
  ],
  references: ["concept.variable", "python.operators.assignment", "python.builtins.input", "python.builtins.int", "python.errors.NameError", "python.errors.TypeError"],
  sections: [
    {
      id: "how-to-use",
      title: "Before you start",
      blocks: [
        {
          type: "text",
          text: "Every activity uses a program you haven't seen. Keep a small table as you go: each variable, and the value it refers to after every line. If an answer surprises you, the feedback points to the step where the reasoning went off course, and you can try again.",
        },
      ],
    },
    {
      id: "names-and-types",
      title: "Names and types",
      blocks: [
        {
          type: "question",
          id: "review-valid-name",
          variant: "predict",
          prompt: "Which of these can be used as a variable name?",
          choices: [
            { id: "valid", text: "`total_2`" },
            {
              id: "space",
              text: "`total 2`",
              feedback: "A space ends a name, so Python would see `total` followed by `2`.",
            },
            {
              id: "digit",
              text: "`2_total`",
              feedback: "A name can contain digits but can't start with one.",
            },
            {
              id: "keyword",
              text: "`True`",
              feedback: "`True` is already a value in Python, so it can't be used as a name.",
            },
          ],
          answer: "valid",
          explanation: "`total_2` uses only letters, a digit and an underscore, doesn't start with a digit, and isn't a keyword.",
        },
        {
          type: "question",
          id: "review-identify-types",
          variant: "predict",
          prompt: "What are the types of `3`, `3.0`, `\"3\"` and `False`, in that order?",
          choices: [
            { id: "right", text: "`int`, `float`, `str`, `bool`" },
            {
              id: "same",
              text: "`int`, `int`, `int`, `bool`",
              feedback: "They all involve a three, but how each one is written matters. What does a decimal point make? What do quotes make?",
            },
            {
              id: "false-str",
              text: "`int`, `float`, `str`, `str`",
              feedback: "`False` has no quotes and starts with a capital letter. That makes it one of the two values of a particular type.",
            },
          ],
          answer: "right",
          explanation: "Digits alone make an `int`; a decimal point makes a `float`; quotes make a `str`; `True` and `False` are the two `bool` values.",
        },
      ],
    },
    {
      id: "trace",
      title: "Tracing reassignment",
      blocks: [
        {
          type: "question",
          id: "review-trace-xy",
          variant: "predict",
          prompt: "Trace every line. What does this program print?",
          code: `x = 5
y = x
x = x + 3
y = y + x

print(x)
print(y)`,
          choices: [
            {
              id: "old-x",
              text: "`8`, then `10`",
              feedback: "That uses x = 5 on line 4. By the time line 4 runs, line 3 has already rebound `x`. What does `x` refer to then?",
            },
            {
              id: "linked",
              text: "`8`, then `16`",
              feedback: "That assumes `y` followed `x` to 8 on line 3. Line 3 only rebinds `x`; `y` still refers to 5 until line 4.",
            },
            { id: "right", text: "`8`, then `13`" },
            {
              id: "unchanged",
              text: "`5`, then `10`",
              feedback: "Line 3 does change `x`: it works out 5 + 3 and rebinds `x` to the result.",
            },
          ],
          answer: "right",
          hint: "After line 2, both names refer to 5. Each later line changes only the name on its left.",
          explanation:
            "Line 1: `x` → 5. Line 2: `y` → 5. Line 3: `x` → 5 + 3 = 8 (`y` is still 5). Line 4: `y` → 5 + 8 = 13, using the new `x`. So it prints `8`, then `13`.",
        },
        {
          type: "question",
          id: "review-names-independent",
          variant: "predict",
          prompt: "What does this program print?",
          code: `colour = "red"
favourite = colour
colour = "blue"
print(colour, favourite)`,
          choices: [
            { id: "right", text: "`blue red`" },
            {
              id: "linked",
              text: "`blue blue`",
              feedback: "Line 2 made `favourite` refer to the value `\"red\"`, not to the name `colour`. Which name did line 3 rebind?",
            },
            {
              id: "old",
              text: "`red red`",
              feedback: "Line 3 rebinds `colour` to `\"blue\"` before the print runs.",
            },
          ],
          answer: "right",
          explanation: "`favourite` refers to `\"red\"`, the value `colour` had at line 2. Line 3 moves only `colour`, to `\"blue\"`.",
        },
        {
          type: "reflect",
          id: "review-explain-trace",
          prompt: "Explain, line by line, why the `y` in the first program ended up as 13 and not 10.",
          answer:
            "Python runs the lines in order, and each assignment uses the values the names refer to at that moment. Line 3 rebinds `x` to 8 before line 4 runs. So when line 4 works out `y + x`, it reads `y` (still 5) and `x` (now 8), and 5 + 8 is 13. To get 10, line 4 would have to run before line 3.",
        },
      ],
    },
    {
      id: "conversion-and-input",
      title: "Conversion and input",
      blocks: [
        {
          type: "question",
          id: "review-convert-or-join",
          variant: "predict",
          prompt: "What is the **first** line this program prints?",
          code: `a = "7"
b = "3"
print(int(a) + int(b))
print(a + b)`,
          choices: [
            { id: "right", text: "`10`" },
            {
              id: "joined",
              text: "`73`",
              feedback: "That's line 4's output. Line 3 converts both strings with `int()` first. What does `+` do with two ints?",
            },
            {
              id: "error",
              text: "An error",
              feedback: "`\"7\"` and `\"3\"` both spell whole numbers, so `int()` converts them without trouble.",
            },
          ],
          answer: "right",
          explanation: "Line 3 converts `\"7\"` and `\"3\"` to the ints 7 and 3 and adds them: `10`. Line 4 joins the strings: `73`.",
        },
        {
          type: "question",
          id: "review-input-type",
          variant: "predict",
          prompt: "The sample user types `5`. What is the **last** line printed?",
          code: `n = input("Pick a number: ")
print(n + n)`,
          input: ["5"],
          choices: [
            {
              id: "ten",
              text: "`10`",
              feedback: "That would be true if `n` referred to the number 5. What type does `input()` return?",
            },
            { id: "right", text: "`55`, the two strings joined" },
            {
              id: "error",
              text: "A TypeError",
              feedback: "A TypeError comes from mixing types. Here both sides of `+` are the same type.",
            },
          ],
          answer: "right",
          explanation: "`input()` returned the string `\"5\"`, so `n + n` joins two strings: `\"55\"`. Converting with `int(n)` would make it `10`.",
        },
      ],
    },
    {
      id: "debugging",
      title: "Debugging",
      blocks: [
        {
          type: "question",
          id: "review-debug-name",
          variant: "debug",
          prompt: "This program stopped on line 2. What's wrong?",
          code: `total = 5
print(Total)`,
          errorOutput: `Traceback (most recent call last):
  File "main.py", line 2, in <module>
    print(Total)
          ^^^^^
NameError: name 'Total' is not defined. Did you mean: 'total'?`,
          choices: [
            { id: "case", text: "`Total` and `total` are different names; only `total` exists" },
            {
              id: "order",
              text: "`total` is used before it's created",
              feedback: "Line 1 creates `total` before line 2 runs. Compare the two names letter by letter.",
            },
            {
              id: "type",
              text: "`print()` can't show an int",
              feedback: "`print()` shows ints fine. The error is a NameError: it's about a name.",
            },
          ],
          answer: "case",
          explanation: "Names are case-sensitive. Python couldn't find `Total`, so it stopped and suggested `total`.",
        },
        {
          type: "question",
          id: "review-debug-join-number",
          variant: "debug",
          prompt: "The programmer wanted `Score: 10`. Which fix works?",
          code: `print("Score: " + 10)`,
          errorOutput: `Traceback (most recent call last):
  File "main.py", line 1, in <module>
    print("Score: " + 10)
          ~~~~~~~~~~^~~~
TypeError: can only concatenate str (not "int") to str`,
          choices: [
            {
              id: "int",
              text: "`print(int(\"Score: \") + 10)`",
              feedback: "`\"Score: \"` isn't a number, so `int()` would fail with a ValueError. Which side needs to change type?",
            },
            { id: "str", text: "`print(\"Score: \" + str(10))`" },
            {
              id: "quotes",
              text: "`print(\"Score: + 10\")`",
              feedback: "That prints the text `Score: + 10` exactly as written. The goal was `Score: 10`.",
            },
          ],
          answer: "str",
          explanation: "`+` can't join a string and an int. `str(10)` makes the text `\"10\"`, and two strings join to `\"Score: 10\"`. (`print(\"Score:\", 10)` with a comma would also work.)",
        },
      ],
    },
    {
      id: "practice",
      title: "Challenge",
      blocks: [
        {
          type: "practice",
          id: "practice-ticket-total",
          context: "A cinema's ticket machine asks for a name and how many tickets, then shows the total. Tickets cost 7.5 each.",
          prompt: "Ask for the customer's name and the number of tickets. Store the price in a variable, convert the number of tickets, work out the total, and print a receipt line with the name and the total.",
          checklist: [
            "Two `input()` calls with clear prompts.",
            "The ticket count is converted with `int()` before multiplying.",
            "The price is stored once, in a variable, not typed into the calculation.",
            "The receipt uses the name and the calculated total.",
            "Before revealing the solution, trace your program with the sample answers `Sam` and `4`.",
          ],
          hints: [
            "Start with `price = 7.5`.",
            "`tickets = int(input(\"How many tickets? \"))` asks and converts in one line.",
            "`print(name, \"pays\", total)` makes the receipt line.",
          ],
          solution: `price = 7.5
name = input("Name: ")
tickets_text = input("How many tickets? ")
tickets = int(tickets_text)
total = price * tickets

print(name, "pays", total)`,
          input: ["Sam", "4"],
          solutionNote:
            "With the sample answers `Sam` and `4`, `tickets` refers to the int 4 and `total` to 7.5 × 4 = 30.0, so the receipt says `Sam pays 30.0`. A float times an int is a float, which is why it shows `.0`.",
        },
      ],
    },
    {
      id: "key-ideas",
      title: "Chapter 2 in one list",
      blocks: [
        {
          type: "list",
          items: [
            "A variable is a **name that refers to a value**; `=` makes the name on the left refer to the value worked out on the right.",
            "Every value has a type: `int`, `float`, `str`, `bool` or `NoneType`. The way it's written decides which.",
            "Reassignment rebinds a name only after the right side is worked out. `b = a` copies the current value, not a link.",
            "`int()`, `float()` and `str()` return new values; text that isn't a number gives a **ValueError**.",
            "`input()` always returns a string. Convert it before doing arithmetic.",
            "Next chapter: operators and expressions, the calculations you can write with these values.",
          ],
        },
      ],
    },
  ],
};
