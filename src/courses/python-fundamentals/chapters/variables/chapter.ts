import type { Chapter } from "@/courses/types";
import { whyVariablesExist } from "./lessons/why-variables-exist";

export const variables: Chapter = {
  id: "variables",
  title: "Variables and Values",
  description: "How programs remember information and change it.",
  lessons: [whyVariablesExist],
};
