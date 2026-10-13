import { Target } from "lucide-react";
import type { Chapter, Course, Lesson } from "@/courses/types";
import { RichTextView } from "./RichTextView";

export function LessonHeader({ course, chapter, lesson, position }: { course: Course; chapter: Chapter; lesson: Lesson; position: string }) {
  return (
    <header>
      <p className="font-mono text-xs font-bold uppercase tracking-wider text-primary">
        {chapter.title} <span className="text-muted-foreground">· {position}</span>
      </p>
      <h1 className="mt-2 text-4xl font-extrabold leading-tight md:text-5xl">{lesson.title}</h1>
      <p className="mt-3 text-lg text-muted-foreground">{lesson.description}</p>

      {lesson.objectives.length > 0 && (
        <section className="mt-7 rounded-3xl border-2 border-teal/40 bg-teal/8 p-5" aria-labelledby="objectives-title">
          <h2 id="objectives-title" className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-teal-ink">
            <Target className="h-4 w-4" aria-hidden /> By the end of this lesson, you can
          </h2>
          <ul className="mt-3 space-y-2">
            {lesson.objectives.map((o) => (
              <li key={o} className="flex gap-2.5">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-teal" aria-hidden />
                <span>
                  <RichTextView text={o} />
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
      <span className="sr-only">Part of {course.title}</span>
    </header>
  );
}
