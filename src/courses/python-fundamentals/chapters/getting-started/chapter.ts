import type { Chapter } from "@/courses/types";
import { whatIsProgramming } from "./lessons/what-is-programming";

export const gettingStarted: Chapter = {
  id: "getting-started",
  title: "Getting Started",
  description: "What programming is, and how Python runs your code.",
  // Array order is display order.
  lessons: [whatIsProgramming],
};
