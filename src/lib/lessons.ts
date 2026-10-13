export type Difficulty = "Beginner" | "Easy" | "Medium";
export type Lesson = {
  slug: string;
  title: string;
  icon: string;
  color: "grape" | "sky" | "teal" | "sun" | "coral";
  difficulty: Difficulty;
  objective: string;
  explanation: string[];
  exampleId: string; // id in examples.ts
  challenge: { prompt: string; starter: string; hint: string };
};
export type Chapter = { title: string; lessons: Lesson[] };

export const chapters: Chapter[] = [
  {
    title: "Chapter 1 · First Steps",
    lessons: [
      { slug: "basics", title: "Programming Basics", icon: "🚀", color: "grape", difficulty: "Beginner", objective: "Understand that code runs one line at a time.", explanation: ["A program is a list of instructions. Python reads them top to bottom, one line at a time.", "print() is how your program talks back to you."], exampleId: "variables", challenge: { prompt: "Print your favorite food.", starter: 'print("...")', hint: "Put your text inside quotes." } },
      { slug: "variables", title: "Variables", icon: "📦", color: "sky", difficulty: "Beginner", objective: "Store values in named boxes.", explanation: ["A variable is a labeled box that holds a value.", "Use = to put a value in the box. You can change it later."], exampleId: "variables", challenge: { prompt: "Make a variable city and print it.", starter: 'city = ""\nprint(city)', hint: "Strings need quotes." } },
      { slug: "data-types", title: "Data Types", icon: "🎨", color: "teal", difficulty: "Beginner", objective: "Tell ints, floats, strings and booleans apart.", explanation: ["Every value has a type. Each type has its own color here.", "int = whole numbers, float = decimals, str = text, bool = True/False."], exampleId: "variables", challenge: { prompt: "Create one variable of each type.", starter: "a = \nb = \nc = \nd = ", hint: "Try 3, 3.5, \"hi\", True." } },
    ],
  },
  {
    title: "Chapter 2 · Making Decisions",
    lessons: [
      { slug: "operators", title: "Operators", icon: "➗", color: "sun", difficulty: "Easy", objective: "Do math and comparisons.", explanation: ["+ - * / do math. == > < compare values.", "Comparisons always give a boolean."], exampleId: "conditional", challenge: { prompt: "Check if 7 * 6 equals 42.", starter: "print(7 * 6 == 42)", hint: "== compares, = assigns." } },
      { slug: "conditionals", title: "Conditionals", icon: "🔀", color: "coral", difficulty: "Easy", objective: "Choose a path with if / else.", explanation: ["if checks a condition. If it's True, the indented block runs.", "else runs when the condition is False. Only one path is taken."], exampleId: "conditional", challenge: { prompt: "Print \"cold\" if temp < 10, else \"warm\".", starter: "temp = 8\nif temp < 10:\n    ...", hint: "Don't forget the colon and indent." } },
    ],
  },
  {
    title: "Chapter 3 · Repeat & Collect",
    lessons: [
      { slug: "loops", title: "Loops", icon: "🔁", color: "grape", difficulty: "Medium", objective: "Repeat code with for and while.", explanation: ["A for loop visits each item in a sequence, one at a time.", "The variable after for changes on every lap."], exampleId: "loop", challenge: { prompt: "Add up the numbers 1 to 5.", starter: "total = 0\nfor n in range(1, 6):\n    ...", hint: "total = total + n" } },
      { slug: "strings", title: "Strings", icon: "🔤", color: "coral", difficulty: "Easy", objective: "See text as a sequence of characters.", explanation: ["A string is a row of characters, each with an index.", "word[0] is the first character."], exampleId: "lists", challenge: { prompt: "Print the last letter of \"python\".", starter: 'word = "python"\nprint(word[...])', hint: "Index -1 is the last one." } },
      { slug: "lists", title: "Lists", icon: "🧺", color: "teal", difficulty: "Medium", objective: "Store many values in order.", explanation: ["A list holds values in numbered slots starting at 0.", "append() adds to the end."], exampleId: "lists", challenge: { prompt: "Add \"blue\" to the colors list.", starter: 'colors = ["red"]\n...', hint: "colors.append(...)" } },
      { slug: "functions", title: "Functions", icon: "⚙️", color: "sky", difficulty: "Medium", objective: "Package code into reusable recipes.", explanation: ["def creates a function. Inputs go in the parentheses.", "return sends a result back to whoever called it."], exampleId: "function", challenge: { prompt: "Write double(x) that returns x * 2.", starter: "def double(x):\n    ...", hint: "return x * 2" } },
    ],
  },
];

export const allLessons = chapters.flatMap((c) => c.lessons);
export const findLesson = (slug: string) => allLessons.find((l) => l.slug === slug);
