import { Link } from "@tanstack/react-router";
import { ArrowLeft, Check, ChevronDown } from "lucide-react";
import { useState } from "react";
import { visibleChapters } from "@/courses/queries";
import type { Course } from "@/courses/types";
import { isLessonComplete, summarizeCourse } from "@/progress/progress";
import { useCourseProgress } from "@/progress/useProgress";
import { CourseProgress } from "./CourseProgress";
import { courseTheme } from "./theme";

/** The course's table of contents: chapters, lessons, where you are and what's done. */
export function CourseSidebar({
  course,
  currentLessonId,
  onNavigate,
}: {
  course: Course;
  currentLessonId: string;
  /** Called after a lesson link is chosen (the mobile drawer closes itself). */
  onNavigate?: () => void;
}) {
  const progress = useCourseProgress(course.id);
  const summary = summarizeCourse(course, progress);
  const chapters = visibleChapters(course);
  const theme = courseTheme[course.theme];

  // Every chapter starts open; students can fold the ones they're done with.
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  return (
    <nav aria-label={`${course.title} contents`} className="flex flex-col gap-5 p-4">
      <div>
        <Link to="/courses" className="inline-flex items-center gap-1 py-2 text-xs font-semibold text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> All courses
        </Link>
        <div className="mt-3 flex items-center gap-3">
          <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border-2 text-xl ${theme.tile}`} aria-hidden>
            {course.icon}
          </span>
          <span className="font-display text-lg font-extrabold leading-tight">{course.title}</span>
        </div>
        <div className="mt-4">
          <CourseProgress summary={summary} barClass={theme.bar} />
        </div>
      </div>

      <ol className="flex flex-col gap-2">
        {chapters.map((chapter, ci) => {
          const isCollapsed = Boolean(collapsed[chapter.id]);
          const listId = `chapter-${chapter.id}-lessons`;
          return (
            <li key={chapter.id}>
              <button
                type="button"
                aria-expanded={!isCollapsed}
                aria-controls={listId}
                onClick={() => setCollapsed((c) => ({ ...c, [chapter.id]: !isCollapsed }))}
                className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left hover:bg-muted"
              >
                <span className="font-mono text-xs font-bold text-muted-foreground">{String(ci + 1).padStart(2, "0")}</span>
                <span className="flex-1 text-sm font-bold">{chapter.title}</span>
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isCollapsed ? "-rotate-90" : ""}`} aria-hidden />
              </button>
              {!isCollapsed && (
                <ol id={listId} className="mt-1 flex flex-col gap-0.5 border-l-2 border-border/80 pl-2 ml-4">
                  {chapter.lessons.map((lesson) => {
                    const done = isLessonComplete(progress, lesson.id);
                    const current = lesson.id === currentLessonId;
                    if (lesson.status !== "published") {
                      return (
                        <li key={lesson.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-muted-foreground/70">
                          <span className="h-4 w-4 shrink-0 rounded-full border-2 border-dashed border-border" aria-hidden />
                          <span className="flex-1">{lesson.title}</span>
                          <span className="text-[10px] font-bold uppercase tracking-wide">Soon</span>
                        </li>
                      );
                    }
                    return (
                      <li key={lesson.id}>
                        <Link
                          to="/courses/$courseId/$lessonId"
                          params={{ courseId: course.id, lessonId: lesson.id }}
                          onClick={onNavigate}
                          aria-current={current ? "page" : undefined}
                          className={`sidebar-lesson flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors ${
                            current ? "bg-primary/12 font-bold text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          }`}
                        >
                          <span
                            className={`grid h-4 w-4 shrink-0 place-items-center rounded-full border-2 ${
                              done ? "border-teal bg-teal text-white" : current ? "border-primary" : "border-border"
                            }`}
                            aria-hidden
                          >
                            {done && <Check className="h-2.5 w-2.5" strokeWidth={4} />}
                          </span>
                          <span className="flex-1">{lesson.title}</span>
                          {done && <span className="sr-only">(completed)</span>}
                        </Link>
                      </li>
                    );
                  })}
                </ol>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
