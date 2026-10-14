/**
 * Every walkthrough in the app, with where it's used. Built from the content itself (lessons,
 * playground demos, showcase demos, manual examples), so nothing is listed twice by hand. The developer
 * showcase and the tests read it.
 */
import { walkthroughsIn } from "@/courses/queries";
import { courses } from "@/courses/registry";
import { examples } from "@/data/examples";
import { pythonVisuals } from "@/data/pythonVisuals";
import { allReferences } from "@/references/registry";
import type { Walkthrough } from "@/types/trace";

export type CatalogEntry = { walkthrough: Walkthrough; usedIn: string[] };

export function walkthroughCatalog(): CatalogEntry[] {
  const byId = new Map<string, CatalogEntry>();
  const add = (w: Walkthrough, place: string) => {
    const entry = byId.get(w.id) ?? { walkthrough: w, usedIn: [] };
    if (!entry.usedIn.includes(place)) entry.usedIn.push(place);
    byId.set(w.id, entry);
  };
  for (const course of courses) {
    for (const chapter of course.chapters) {
      for (const lesson of chapter.lessons) for (const w of walkthroughsIn(lesson)) add(w, `Lesson: ${lesson.title}`);
    }
  }
  for (const w of examples) add(w, "Playground");
  for (const w of pythonVisuals) add(w, "Showcase");
  for (const entry of allReferences) {
    for (const x of entry.examples ?? []) if (x.walkthrough) add(x.walkthrough, `Manual: ${entry.title}`);
  }
  return [...byId.values()];
}

/** Every walkthrough object, including repeats, so id clashes between different objects show up. */
export function allWalkthroughUses(): Walkthrough[] {
  return [
    ...courses.flatMap((c) => c.chapters.flatMap((ch) => ch.lessons.flatMap(walkthroughsIn))),
    ...examples,
    ...pythonVisuals,
    ...allReferences.flatMap((e) => (e.examples ?? []).flatMap((x) => (x.walkthrough ? [x.walkthrough] : []))),
  ];
}
