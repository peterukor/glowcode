import type { Chapter } from "@/courses/types";
import { chapterOneReview } from "./lessons/chapter-1-review";
import { firstPythonProgram } from "./lessons/first-python-program";
import { howComputersFollowInstructions } from "./lessons/how-computers-follow-instructions";
import { printAndOutput } from "./lessons/print-and-output";
import { readingCodeStepByStep } from "./lessons/reading-code-step-by-step";
import { whatIsProgramming } from "./lessons/what-is-programming";

export const gettingStarted: Chapter = {
  id: "getting-started",
  title: "Getting Started with Programming",
  description: "What programs are, how Python runs them one statement at a time, and your first lines of output.",
  status: "complete",
  // Array order is display order.
  lessons: [whatIsProgramming, howComputersFollowInstructions, firstPythonProgram, printAndOutput, readingCodeStepByStep, chapterOneReview],
};
