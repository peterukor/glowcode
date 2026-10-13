import type { Course } from "@/courses/types";
import { gettingStarted } from "./chapters/getting-started/chapter";
import { variables } from "./chapters/variables/chapter";

export const pythonFundamentals: Course = {
  id: "python-fundamentals",
  title: "Python Fundamentals",
  description: "Learn to think like a programmer with Python, watching every value and decision as your code runs.",
  icon: "🐍",
  theme: "grape",
  status: "published",
  language: "python",
  chapters: [gettingStarted, variables],
};
