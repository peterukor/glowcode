import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { CourseCard, resumeLink } from "@/components/course/CourseCard";
import { courses, getCourse } from "@/courses/registry";
import { summarizeCourse } from "@/progress/progress";
import { useAllProgress } from "@/progress/useProgress";

export const Route = createFileRoute("/courses/")({
  head: () => ({
    meta: [
      { title: "Courses · Glowcode" },
      { name: "description", content: "Pick a course: Python, Git and GitHub, computer fundamentals or Java." },
    ],
  }),
  component: CourseCatalog,
});

function CourseCatalog() {
  const progress = useAllProgress();

  // The course touched most recently, for a "pick up where you left off" banner.
  const recent = Object.entries(progress.courses)
    .filter(([, p]) => p.lastVisitedAt)
    .sort(([, a], [, b]) => (b.lastVisitedAt ?? "").localeCompare(a.lastVisitedAt ?? ""))
    .map(([id, p]) => ({ course: getCourse(id), p }))
    .find(({ course, p }) => course && summarizeCourse(course, p).lastLesson);
  const recentSummary = recent?.course ? summarizeCourse(recent.course, recent.p) : undefined;
  const recentTarget = recent?.course ? resumeLink(recent.course, recent.p) : undefined;

  return (
    <div className="relative">
      <div className="absolute inset-x-0 top-0 h-80 bg-hero" aria-hidden />
      <div className="relative mx-auto max-w-6xl px-5 py-14">
        <h1 className="text-5xl font-extrabold md:text-6xl">
          Your <span className="text-brand">courses</span>
        </h1>
        <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
          Each course stands on its own. Start whichever one matches what you're learning right now, and jump to any
          lesson whenever you like.
        </p>

        {recent?.course && recentSummary?.lastLesson && recentTarget && (
          <Link
            to="/courses/$courseId/$lessonId"
            params={{ courseId: recent.course.id, lessonId: recentTarget.lessonId }}
            hash={recentTarget.hash}
            className="resume-banner group mt-8 flex flex-wrap items-center gap-4 rounded-3xl border-2 border-primary/40 bg-card p-5 shadow-soft transition-colors hover:border-primary"
          >
            <span className="text-3xl" aria-hidden>
              {recent.course.icon}
            </span>
            <span className="flex-1">
              <span className="block text-xs font-bold uppercase tracking-wide text-primary">Pick up where you left off</span>
              <span className="block text-lg font-bold">{recentSummary.lastLesson.lesson.title}</span>
              <span className="block text-sm text-muted-foreground">
                {recent.course.title} · {recentSummary.percent}% complete
              </span>
            </span>
            <span className="btn-primary !py-2.5">
              Continue <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </span>
          </Link>
        )}

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} progress={progress.courses[course.id]} />
          ))}
        </div>
      </div>
    </div>
  );
}
