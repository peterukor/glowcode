import type { Lesson } from "@/courses/types";

/**
 * Chapter 1, lesson 1. No Python syntax yet: what a program is, who writes it, and why
 * programming languages exist. The first look at real code (and at `print()`) is lesson 3.
 */
export const whatIsProgramming: Lesson = {
  id: "what-is-programming",
  title: "What Is Programming?",
  description: "What programs, programmers and programming languages are, and why computers need exact instructions.",
  status: "published",
  objectives: [
    "Explain what a program is and what a programmer does.",
    "Explain why computers need instructions that leave nothing to guess.",
    "Describe why programming languages exist instead of plain English.",
    "Tell the difference between code and what the code makes the computer do.",
  ],
  references: ["concept.program", "concept.programming-language", "concept.python", "concept.interpreter"],
  sections: [
    {
      id: "why",
      title: "Jobs worth handing over",
      blocks: [
        {
          type: "text",
          text: "Your teacher has 30 test papers to mark. For each one, she adds up the points, works out a percentage and writes a grade. The thinking is easy. Doing it 30 times without a single slip is the hard part.",
        },
        {
          type: "text",
          text: "Jobs like this are perfect for a computer. A computer can do millions of small steps every second, and it never gets bored or loses its place. But it can't decide **what** to do. Someone has to write the exact steps first: add up the points, divide by the total, compare the result with the grade boundaries.",
        },
        {
          type: "text",
          text: "Writing those steps is **programming**, and the person who writes them is a **programmer**. Every app on your phone, every game and every website started as a programmer writing steps like these.",
        },
      ],
    },
    {
      id: "what-is-a-program",
      title: "What is a program?",
      blocks: [
        {
          type: "text",
          text: "A [program](ref:concept.program) is a list of **instructions** for a computer. Each instruction is one small, exact step. The computer carries them out in order, exactly as they're written.",
        },
        {
          type: "callout",
          tone: "real-world",
          title: "Like a recipe, with a very literal cook",
          text: "A recipe lists steps in order: crack the eggs, whisk them, then cook them. A person reading it fills in what's missing and fixes obvious slips. A computer is a cook who never does that. If the recipe says to cook the eggs before cracking them, it tries exactly that.",
        },
        {
          type: "text",
          text: "That last point matters more than it sounds. A computer has no idea what you're **trying** to do. It only has the instructions. When a program does something strange, the reason is almost always in the instructions themselves.",
        },
        {
          type: "text",
          text: "Try being that literal yourself. A robot follows instructions exactly, in the order given, and it's handed these three:",
        },
        { type: "list", ordered: true, items: ["Pour water from the jug.", "Pick up a glass.", "Hold the glass under the jug."] },
        {
          type: "question",
          id: "predict-robot-water",
          variant: "predict",
          prompt: "The robot carries out the three steps above, in that order. What happens?",
          choices: [
            {
              id: "glass",
              text: "It fills a glass with water",
              feedback:
                "That's what a person would do, because a person knows what the steps are **for**. The robot only knows the steps. What is it holding when it carries out step 1?",
            },
            { id: "spill", text: "It pours water onto the table, then picks up an empty glass" },
            {
              id: "reorder",
              text: "It notices the mistake and swaps steps 1 and 3",
              feedback: "Noticing a mistake means knowing what the steps are meant to achieve. A computer follows the order it's given. Try running the steps one at a time.",
            },
          ],
          answer: "spill",
          hint: "Do step 1 yourself, with nothing in your hand.",
          explanation:
            "Step 1 says pour, so the robot pours, before there's any glass to catch the water. Steps 2 and 3 happen afterwards, too late. The instructions were all reasonable; their **order** was wrong, and the robot can't tell.",
        },
      ],
    },
    {
      id: "why-languages",
      title: "Why not just write in English?",
      blocks: [
        {
          type: "text",
          text: "Deep down, a computer's processor only understands very simple instructions written as numbers. People can't sensibly write a game in numbers. But everyday English has the opposite problem: it's full of guesswork. \"Make the text bigger\" doesn't say how much bigger, or which text.",
        },
        {
          type: "text",
          text: "A [programming language](ref:concept.programming-language) sits in between. It's written with words and symbols people can read, and it has strict rules, so every instruction means exactly one thing. Those rules are called **syntax**.",
        },
        {
          type: "text",
          text: "You'll learn [Python](ref:concept.python), a programming language known for being readable. Instructions written in a programming language are called **code**. To run Python code, a program called the [Python interpreter](ref:concept.interpreter) reads it and carries it out:",
        },
        {
          type: "figure",
          caption: "From code to behavior. The computer doesn't act on your intentions, only on the code you wrote.",
          figure: {
            kind: "sequence",
            steps: [
              "A programmer writes **code** in Python",
              "The Python interpreter reads the code",
              "The computer carries out each instruction",
              "You see the result, such as text on the screen",
            ],
          },
        },
        {
          type: "text",
          text: "So there are two different things to keep apart: the **code** (the instructions you write) and what happens when it **runs** (what the computer does with them). You'll see both side by side in every lesson from here on.",
        },
        {
          type: "reflect",
          id: "reflect-exact-instructions",
          prompt: "A friend would understand \"put on your shoes and socks\" and do it in the right order. Why can't a computer do the same?",
          answer:
            "Your friend knows how feet, socks and shoes work, and fills in the missing details without noticing. A computer knows nothing about the world. It only has the instructions it was given, in the order it was given them. That's why programmers write steps that are complete and in the right order, with nothing left for the computer to guess.",
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
            "A **program** is a list of exact instructions. A **programmer** writes them.",
            "A computer carries out instructions in order and never guesses what you meant.",
            "A **programming language** like Python is precise enough for a computer and readable for people. Its rules are its **syntax**.",
            "**Code** is the instructions; running it is what makes the computer act. Next, you'll see how Python works through code one step at a time.",
          ],
        },
      ],
    },
  ],
};
