/**
 * Every course Glowcode knows about, in dashboard order.
 * To add a course: create src/courses/<id>/course.ts and add it here.
 */
import { computerFundamentals } from "./computer-fundamentals/course";
import { javaFundamentals } from "./java-fundamentals/course";
import { pythonFundamentals } from "./python-fundamentals/course";
import type { Course } from "./types";
import { versionControl } from "./version-control/course";

export const courses: Course[] = [pythonFundamentals, versionControl, computerFundamentals, javaFundamentals];

export function getCourse(id: string): Course | undefined {
  return courses.find((c) => c.id === id && c.status !== "draft");
}
