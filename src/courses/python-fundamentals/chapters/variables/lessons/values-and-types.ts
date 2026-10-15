import type { Lesson } from "@/courses/types";
import { py } from "@/walkthrough/build";

/** Chapter 2, lesson 2: the five basic types. Collections wait for later chapters. */
export const valuesAndTypes: Lesson = {
  id: "values-and-types",
  title: "Values and Python Data Types",
  description: "Whole numbers, decimals, text, True/False and None: what each type is for and how to tell them apart.",
  status: "published",
  objectives: [
    "Name Python's basic types: `int`, `float`, `str`, `bool` and `NoneType`.",
    "Tell which type a value has from the way it's written.",
    "Explain why `18` and `\"18\"` are different types even though they print the same.",
    "Explain that `None` is a real value that means \"nothing here\".",
  ],
  references: ["python.types.int", "python.types.float", "python.types.str", "python.types.bool", "python.types.None"],
  sections: [
    {
      id: "why",
      title: "Not all information is the same kind",
      blocks: [
        {
          type: "text",
          text: "A sign-up form asks for your age, the price of your plan, your name, whether you want emails, and a middle name you might not have. These answers are different **kinds** of information. You can add one year to an age. You can't add one year to a name. A yes-or-no answer has exactly two possibilities.",
        },
        {
          type: "text",
          text: "Python keeps track of what kind each value is. That kind is the value's **type**, and it decides what you can do with the value.",
        },
      ],
    },
    {
      id: "five-types",
      title: "Five basic types",
      blocks: [
        {
          type: "code",
          language: "python",
          code: `age = 18
price = 9.99
name = "Ada"
is_ready = True
result = None`,
          caption: "Five variables, each referring to a value of a different type.",
        },
        {
          type: "figure",
          caption: "Each name refers to a value, labelled with its type. The way the value is written tells Python which type it is.",
          figure: {
            kind: "variables",
            vars: { age: py.int(18), price: py.float(9.99), name: py.str("Ada"), is_ready: py.bool(true), result: py.none() },
          },
        },
        {
          type: "list",
          items: [
            "[`int`](ref:python.types.int) (integer): a whole number, like `18`, `0` or `-5`. No decimal point, no quotes.",
            "[`float`](ref:python.types.float): a number with a decimal point, like `9.99` or `2.0`. `2.0` is a float even though it's a whole amount.",
            "[`str`](ref:python.types.str) (string): text, written in quotes, like `\"Ada\"`. Anything in quotes is a string, even `\"18\"`.",
            "[`bool`](ref:python.types.bool) (Boolean): exactly `True` or `False`, with a capital letter and no quotes. For yes-or-no facts.",
            "`NoneType`: it has only one value, [`None`](ref:python.types.None), which means \"nothing here\" or \"no value yet\".",
          ],
        },
        {
          type: "callout",
          tone: "careful",
          title: "None is a real value",
          text: "`None` isn't an error, and it isn't the same as `0`, an empty string or the word `\"None\"`. It's a value in its own right, so a variable can refer to it, and `print(result)` shows `None`.",
        },
        {
          type: "question",
          id: "predict-print-none",
          variant: "predict",
          prompt: "What does this program print?",
          code: `result = None
print(result)`,
          choices: [
            { id: "none", text: "`None`" },
            {
              id: "blank",
              text: "An empty line, because there's nothing to show",
              feedback: "`None` means \"nothing here\", but it's still a value that `result` refers to. How does `print()` show a value?",
            },
            {
              id: "error",
              text: "An error, because `result` has no value",
              feedback: "Line 1 does give `result` a value: `None`. A variable only causes an error if it was never created.",
            },
          ],
          answer: "none",
          explanation: "`None` is a real value, so `result` refers to it and `print()` shows it the way Python writes it: `None`.",
        },
      ],
    },
    {
      id: "how-it-is-written",
      title: "The way it's written decides the type",
      blocks: [
        {
          type: "text",
          text: "In Chapter 1 you saw that `42` and `\"42\"` print the same. The same is true of `18` and `\"18\"`. They differ in what Python can **do** with them: `18` is a number, so `18 + 2` is `20`. `\"18\"` is two characters, a 1 and an 8, and Python won't do arithmetic with text. Lesson 6 shows how to turn one into the other.",
        },
        {
          type: "question",
          id: "predict-type-price-text",
          variant: "predict",
          prompt: "A shop program has this line. What type of value does `price` refer to?",
          code: `price = "9.99"`,
          choices: [
            {
              id: "float",
              text: "`float`, because it has a decimal point",
              feedback: "It does contain a decimal point, but look at what's around it. What do quotes always make?",
            },
            { id: "str", text: "`str`, because it's in quotes" },
            {
              id: "int",
              text: "`int`, because it's a price",
              feedback: "Python can't tell what a value is *for*, only how it's written. And an `int` never has a decimal point.",
            },
          ],
          answer: "str",
          hint: "Check the characters around the value before the characters inside it.",
          explanation:
            "Quotes make a string, whatever is inside them. `\"9.99\"` is four characters of text. Without the quotes, `9.99` would be a `float`.",
        },
        {
          type: "question",
          id: "predict-which-bool",
          variant: "predict",
          prompt: "Which line makes `is_member` refer to a `bool`?",
          choices: [
            {
              id: "quoted",
              text: "`is_member = \"True\"`",
              feedback: "The quotes make this the four-character string `\"True\"`, not the bool.",
            },
            { id: "bool", text: "`is_member = True`" },
            {
              id: "lower",
              text: "`is_member = true`",
              feedback: "Python's bool values start with a capital letter. Lowercase `true` is just a name, and since nothing is called `true`, this line stops with a NameError.",
            },
          ],
          answer: "bool",
          explanation: "`True` and `False` are written exactly like that: capital first letter, no quotes. Change either detail and it's something else.",
        },
        {
          type: "reflect",
          id: "reflect-18-and-text",
          prompt: "A friend says `18` and `\"18\"` are the same, because `print()` shows `18` for both. What would you tell them?",
          answer:
            "They look the same on screen, but they're different types. `18` is an `int`, a number Python can do arithmetic with: `18 + 2` is `20`. `\"18\"` is a `str`, the two characters 1 and 8, which Python treats as text. The quotes in the code decide which one you have; the printed output can't tell you.",
        },
      ],
    },
    {
      id: "practice",
      title: "Your turn",
      blocks: [
        {
          type: "practice",
          id: "practice-product-types",
          context: "An online shop describes each product with a few facts: its name, how many are in stock, its price, whether it's on sale, and a discount code it might not have yet.",
          prompt: "Create five variables for one product, choosing a sensible type for each: `product` (text), `in_stock` (a whole number), `price` (a decimal), `on_sale` (yes or no) and `discount_code` (no value yet). Print `product` and `price`.",
          checklist: [
            "Only the text value has quotes.",
            "`price` has a decimal point; `in_stock` doesn't.",
            "`on_sale` is `True` or `False` with a capital letter.",
            "`discount_code` refers to `None`.",
          ],
          hints: ["Look back at the five-variable example: each line uses a different type.", "`None` is written with a capital N and no quotes."],
          solution: `product = "Headphones"
in_stock = 12
price = 24.99
on_sale = False
discount_code = None

print(product)
print(price)`,
          solutionNote:
            "Each value's type comes from how it's written: quotes for text, a decimal point for a float, digits only for an int, `True`/`False` for a bool, and `None` for \"nothing yet\".",
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
            "Every value has a **type**: `int`, `float`, `str`, `bool` or `NoneType` so far.",
            "How a value is written decides its type: quotes make a string, a decimal point makes a float.",
            "`18` and `\"18\"` print the same, but only the `int` can be used in arithmetic.",
            "`True`, `False` and `None` are real values, written with a capital letter and no quotes.",
          ],
        },
      ],
    },
  ],
};
