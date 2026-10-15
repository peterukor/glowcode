import type { Lesson } from "@/courses/types";
import type { CallEvent, Walkthrough } from "@/types/trace";
import { buildSteps, py } from "@/walkthrough/build";

const askName = (phase: CallEvent["phase"]): CallEvent => ({
  name: "input",
  args: ['"What is your name? "'],
  returns: '"Ada"',
  prints: ["What is your name? Ada"],
  assignTo: "name",
  phase,
});

const inputName: Walkthrough = {
  id: "py-input-name",
  title: "Asking for a name",
  language: "python",
  visualizations: ["function", "variables"],
  input: ["Ada"],
  code: `name = input("What is your name? ")
print("Hello,", name)`,
  steps: buildSteps([
    {
      line: 1,
      call: askName("call"),
      note: "input() is called with a prompt. It shows the prompt and then waits for someone to type an answer and press Enter.",
    },
    {
      line: 1,
      call: askName("result"),
      note: "In this walkthrough the sample user types Ada and presses Enter. The screen shows the prompt followed by what was typed, and input() returns the string \"Ada\".",
    },
    { line: 1, set: { name: py.str("Ada") }, highlight: "name", call: askName("assign"), note: "The assignment finishes: name refers to the string \"Ada\"." },
    { line: 2, print: ["Hello, Ada"], note: "print() looks up name and greets whoever answered." },
  ]),
};

const askAge = (phase: CallEvent["phase"]): CallEvent => ({
  name: "input",
  args: ['"How old are you? "'],
  returns: '"18"',
  prints: ["How old are you? 18"],
  assignTo: "age_text",
  phase,
});
const toInt = (phase: CallEvent["phase"]): CallEvent => ({ name: "int", args: ['"18"'], returns: "18", assignTo: "age", phase });

const inputAge: Walkthrough = {
  id: "py-input-age",
  title: "Asking for a number",
  language: "python",
  visualizations: ["function", "variables"],
  input: ["18"],
  code: `age_text = input("How old are you? ")
age = int(age_text)

print(age + 1)`,
  steps: buildSteps([
    { line: 1, call: askAge("call"), note: "input() shows its prompt and waits for an answer." },
    { line: 1, call: askAge("result"), note: "The sample user types 18 and presses Enter. input() returns what was typed." },
    {
      line: 1,
      set: { age_text: py.str("18") },
      highlight: "age_text",
      call: askAge("assign"),
      note: "age_text refers to what input() returned. Look at its type in the variables view: it's a string, \"18\".",
      checkpoint: {
        prompt: "The sample user typed `18`. What does `age_text` refer to?",
        choices: [
          { id: "str", text: "The string `\"18\"`" },
          {
            id: "int",
            text: "The number `18`",
            feedback: "`input()` can't know that the answer is meant to be a number. What type does it always return?",
          },
          {
            id: "prompt",
            text: "The prompt `\"How old are you? \"`",
            feedback: "The prompt is what `input()` shows. Its returned value is what the user typed.",
          },
        ],
        answer: "str",
        explanation: "`input()` always returns a string, whatever the user types. `age_text` refers to the text `\"18\"`, which is why line 2 is needed.",
      },
    },
    { line: 2, call: toInt("call"), note: "Line 2 gives that string to int()." },
    { line: 2, call: toInt("result"), note: "int() returns the number 18." },
    { line: 2, set: { age: py.int(18) }, highlight: "age", call: toInt("assign"), note: "age refers to the int 18. Now arithmetic works." },
    { line: 4, print: ["19"], note: "age + 1 is 18 + 1 = 19." },
  ]),
};

/** Chapter 2, lesson 7: input() returns a string; converting it; what happens when it can't be converted. */
export const gettingInput: Lesson = {
  id: "getting-input",
  title: "Getting Input from Users",
  description: "Ask the user a question with input(), store the answer, and convert it when you need a number.",
  status: "published",
  objectives: [
    "Describe what `input()` does: shows a prompt, waits, and returns what was typed.",
    "Explain that `input()` always returns a string.",
    "Convert an answer to a number with `int()` before doing arithmetic.",
    "Explain what happens when an answer can't be converted.",
  ],
  references: ["python.builtins.input", "python.builtins.int", "python.errors.ValueError", "python.errors.TypeError"],
  sections: [
    {
      id: "why",
      title: "Programs that respond to people",
      blocks: [
        {
          type: "text",
          text: "Every program so far has printed the same thing every time. Real programs respond to whoever is using them: they ask your name, your age, how many tickets you want. To do that, a program needs to stop, ask a question, and use the answer.",
        },
        {
          type: "callout",
          tone: "careful",
          title: "Sample input on this page",
          text: "Glowcode shows programs; it doesn't run your typing. When a program here calls `input()`, the page shows a **sample user input**: a pretend answer, clearly labelled, so you can see what the program does with it. You don't type anything.",
        },
      ],
    },
    {
      id: "input",
      title: "Asking a question with input()",
      blocks: [
        {
          type: "code",
          language: "python",
          code: inputName.code,
          input: inputName.input,
          output: ["What is your name? Ada", "Hello, Ada"],
          caption: "The first output line is the prompt followed by what the sample user typed.",
          walkthrough: inputName,
        },
        {
          type: "text",
          text: "[`input()`](ref:python.builtins.input) does four things:",
        },
        {
          type: "list",
          ordered: true,
          items: [
            "Shows the **prompt**, the text in its parentheses, so the user knows what to type. The space at the end of `\"What is your name? \"` keeps the answer from touching the question mark.",
            "**Waits** until the user types something and presses Enter.",
            "**Returns** what they typed, as a string.",
            "That's all. Storing the answer is the assignment's job: `name = input(...)` makes `name` refer to the returned string.",
          ],
        },
      ],
    },
    {
      id: "always-a-string",
      title: "The answer is always a string",
      blocks: [
        {
          type: "text",
          text: "Even when the user types digits, `input()` returns text. To do arithmetic with the answer, convert it with `int()` (or `float()` for decimals), just as in the last lesson.",
        },
        {
          type: "code",
          language: "python",
          code: inputAge.code,
          input: inputAge.input,
          caption: "Step through it. It stops to ask what `input()` handed back.",
          walkthrough: inputAge,
        },
        {
          type: "question",
          id: "predict-two-inputs",
          variant: "predict",
          prompt: "The sample user types `2` and then `3`. What is the **last** line this program prints?",
          code: `first = input("First number: ")
second = input("Second number: ")
print(first + second)`,
          input: ["2", "3"],
          choices: [
            {
              id: "five",
              text: "`5`",
              feedback: "What type does `input()` return? And what does `+` do with two values of that type?",
            },
            { id: "joined", text: "`23`, the two answers joined" },
            {
              id: "error",
              text: "An error, because you can't add input",
              feedback: "Both values are strings, and `+` can join two strings without any error.",
            },
          ],
          answer: "joined",
          hint: "Write down the type of `first` and `second` before you think about `+`.",
          explanation:
            "Both answers are strings: `\"2\"` and `\"3\"`. `+` joins strings, so the result is `\"23\"`. To add them as numbers, convert first: `int(first) + int(second)` is `5`.",
        },
      ],
    },
    {
      id: "bad-answers",
      title: "When the answer isn't a number",
      blocks: [
        {
          type: "text",
          text: "Users can type anything. If the program converts the answer with `int()` and the user typed a word, the conversion fails with a [ValueError](ref:python.errors.ValueError) and the program stops. Later chapters show how to check an answer before converting it; for now, it's enough to recognise the error and know what caused it.",
        },
        {
          type: "question",
          id: "debug-input-word",
          variant: "debug",
          prompt: "The sample user typed `eighteen`. The program printed its prompt, then stopped with this error. Why?",
          code: `age_text = input("How old are you? ")
age = int(age_text)
print(age + 1)`,
          input: ["eighteen"],
          errorOutput: `Traceback (most recent call last):
  File "main.py", line 2, in <module>
    age = int(age_text)
ValueError: invalid literal for int() with base 10: 'eighteen'`,
          choices: [
            {
              id: "input-failed",
              text: "`input()` couldn't read the answer",
              feedback: "The error is on line 2, not line 1. `input()` happily returned `\"eighteen\"`. Which function couldn't use it?",
            },
            { id: "convert", text: "`int()` can't turn the word `\"eighteen\"` into a number" },
            {
              id: "plus",
              text: "`age + 1` can't add 1 to a string",
              feedback: "Line 3 never ran: the error is on line 2. Read the last line of the message.",
            },
          ],
          answer: "convert",
          explanation:
            "`input()` returned the string `\"eighteen\"`, and `int()` only understands digits, so line 2 raised a ValueError. Line 3 never ran.",
        },
      ],
    },
    {
      id: "practice",
      title: "Your turn",
      blocks: [
        {
          type: "practice",
          id: "practice-greeting-next-year",
          context: "A birthday app asks two questions and replies with one sentence.",
          prompt: "Ask for the user's name and age with `input()`. Convert the age to a number, then print a greeting with their name and the age they'll be next year.",
          checklist: [
            "Two `input()` calls, each with a clear prompt ending in a space.",
            "The age is converted with `int()` before adding 1.",
            "The greeting uses the name and the calculated age.",
          ],
          hints: ["Store each answer in its own variable.", "`print(\"Hi\", name, \"- next year you'll be\", age + 1)` mixes text and values."],
          solution: `name = input("What is your name? ")
age_text = input("How old are you? ")
age = int(age_text)

print("Hi", name, "- next year you'll be", age + 1)`,
          input: ["Ada", "18"],
          solutionNote:
            "With the sample input `Ada` and `18`, this prints `Hi Ada - next year you'll be 19`. Converting the age first is what makes `age + 1` arithmetic instead of an error.",
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
            "`input(prompt)` shows the prompt, waits for the user, and returns what they typed.",
            "The answer is **always a string**, even when it's made of digits.",
            "Convert with `int()` or `float()` before doing arithmetic with an answer.",
            "If the answer doesn't spell a number, the conversion fails with a **ValueError**.",
          ],
        },
      ],
    },
  ],
};
