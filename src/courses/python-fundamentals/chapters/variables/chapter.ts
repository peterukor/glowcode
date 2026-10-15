import type { Chapter } from "@/courses/types";
import { chapterTwoReview } from "./lessons/chapter-2-review";
import { creatingVariables } from "./lessons/creating-variables";
import { gettingInput } from "./lessons/getting-input";
import { reassignment } from "./lessons/reassignment";
import { typeConversion } from "./lessons/type-conversion";
import { usingVariables } from "./lessons/using-variables";
import { valuesAndTypes } from "./lessons/values-and-types";
import { whyVariablesExist } from "./lessons/why-variables-exist";

export const variables: Chapter = {
  // The id predates the Phase 6 title; ids never change once students have progress.
  id: "variables",
  title: "Variables, Values & Data Types",
  description: "How programs remember information with names, what kinds of values there are, and how to convert between them.",
  status: "complete",
  // Array order is display order.
  lessons: [whyVariablesExist, valuesAndTypes, creatingVariables, usingVariables, reassignment, typeConversion, gettingInput, chapterTwoReview],
};
