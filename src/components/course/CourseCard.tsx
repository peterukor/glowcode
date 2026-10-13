import { Link } from "@tanstack/react-router";
import { ArrowRight, Clock } from "lucide-react";
import { isOpenable, publishedLessons } from "@/courses/queries";
import type { Course } from "@/courses/types";
import { summarizeCourse, type CourseProgress as Progress } from "@/progress/progress";
import { CourseProgress } from "./CourseProgress";
import { courseTheme } from "./theme";

/** Where "Continue" should land: the last lesson, at the last activity if it was in that lesson. */
export function resumeLink(course: Course, progress: Progress | undefined) {
  const { resumeLessonId } = summarizeCourse(course, progress);
  if (!resumeLessonId) return undefined;
  const activity = progress?.lastActivity?.lessonId === resumeLessonId ? progress.lastActivity.activityId : undefined;
  return { lessonId: resumeLessonId, hash: activity ? `activity-${activity}` : undefined };
}

export function CourseCard({ course, progress }: { course: Course; progress: Progress | undefined }) {
  const theme = courseTheme[course.theme];
  const open = isOpenable(course);
  const summary = summarizeCourse(course, progress);
  const lessonCount = publishedLessons(course).length;
  const target = resumeLink(course, progress);

  return (
    <article
      className={`course-card group relative flex flex-col rounded-3xl border-2 border-t-8 bg-card p-6 shadow-soft ${theme.border} ${open ? "" : "opacity-85"}`}
      aria-labelledby={`course-${course.id}`}
    >
      <div className="flex items-start justify-between gap-4">
        <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl border-2 text-3xl ${theme.tile}`} aria-hidden>
          {course.icon}
        </span>
        {open ? (
          <span className="rounded-full bg-teal/15 px-3 py-1 text-xs font-bold text-teal-ink">
            {lessonCount} {lessonCount === 1 ? "lesson" : "lessons"}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-bold text-muted-foreground">
            <Clock className="h-3 w-3" aria-hidden /> Coming soon
          </span>
        )}
      </div>

      <h2 id={`course-${course.id}`} className="mt-4 text-2xl font-extrabold">
        {course.title}
      </h2>
      <p className="mt-2 text-muted-foreground">{course.description}</p>

      <div className="mt-auto pt-6">
        {open && target ? (
          <>
            <CourseProgress summary={summary} barClass={theme.bar} />
            {summary.lastLesson && (
              <p className="mt-3 text-sm text-muted-foreground">
                Last visited: <span className="font-semibold text-foreground">{summary.lastLesson.lesson.title}</span>
              </p>
            )}
            <Link
              to="/courses/$courseId/$lessonId"
              params={{ courseId: course.id, lessonId: target.lessonId }}
              hash={target.hash}
              className="btn-primary mt-5"
            >
              {summary.started ? "Continue learning" : "Start learning"} <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </>
        ) : (
          <p className="text-sm font-semibold text-muted-foreground">We're writing this course now. Check back soon!</p>
        )}
      </div>
    </article>
  );
}
