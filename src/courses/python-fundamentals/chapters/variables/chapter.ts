import type { Chapter } from "@/courses/types";
import { whyVariablesExist } from "./lessons/why-variables-exist";

export const variables: Chapter = {
  // The id predates the Phase 6 title; ids never change once students have progress.
  id: "variables",
  title: "Variables, Values & Data Types",
  description: "How programs remember information, change it, and what kinds of values there are.",
  // One lesson so far (from Phase 3). The rest of the chapter is written in a later phase.
  status: "in-progress",
  lessons: [whyVariablesExist],
};
