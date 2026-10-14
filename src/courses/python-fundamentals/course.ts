import type { Course } from "@/courses/types";
import { gettingStarted } from "./chapters/getting-started/chapter";
import { plannedChapters } from "./chapters/planned";
import { variables } from "./chapters/variables/chapter";

export const pythonFundamentals: Course = {
  id: "python-fundamentals",
  title: "Python Fundamentals",
  description: "Learn to think like a programmer with Python, watching every value and decision as your code runs.",
  icon: "🐍",
  theme: "grape",
  status: "published",
  language: "python",
  // The order is the Phase 6 outline in PRODUCT_ROADMAP.md / COURSE_OUTLINE.md.
  chapters: [gettingStarted, variables, ...plannedChapters],
};
