import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check, PartyPopper } from "lucide-react";
import type { LessonEntry } from "@/courses/queries";

/** "Mark complete" plus previous / next lesson links at the end of a lesson. */
export function LessonNavigation({
  courseId,
  prev,
  next,
  completed,
  onToggleComplete,
}: {
  courseId: string;
  prev?: LessonEntry;
  next?: LessonEntry;
  completed: boolean;
  onToggleComplete: (complete: boolean) => void;
}) {
  return (
    <footer className="mt-16 space-y-6">
      <div
        className={`complete-card flex flex-wrap items-center gap-4 rounded-3xl border-2 p-5 transition-colors ${
          completed ? "border-teal bg-teal/10" : "border-dashed"
        }`}
        data-complete={completed || undefined}
      >
        {completed ? (
          <>
            <span className="animate-pop grid h-11 w-11 place-items-center rounded-full bg-teal text-white" aria-hidden>
              <Check className="h-6 w-6" strokeWidth={3} />
            </span>
            <div className="flex-1">
              <p className="font-bold" role="status">
                Lesson complete! <PartyPopper className="inline h-4 w-4 text-amber" aria-hidden />
              </p>
              <p className="text-sm text-muted-foreground">It stays complete even if you come back to review it.</p>
            </div>
            <button type="button" className="text-sm font-semibold text-muted-foreground underline-offset-4 hover:underline" onClick={() => onToggleComplete(false)}>
              Mark as not complete
            </button>
          </>
        ) : (
          <>
            <div className="flex-1">
              <p className="font-bold">Finished this lesson?</p>
              <p className="text-sm text-muted-foreground">Mark it complete to track your progress through the course.</p>
            </div>
            <button type="button" className="btn-primary !py-2.5" onClick={() => onToggleComplete(true)}>
              <Check className="h-4 w-4" aria-hidden /> Mark lesson complete
            </button>
          </>
        )}
      </div>

      <nav aria-label="Lesson navigation" className="grid gap-3 sm:grid-cols-2">
        {prev ? (
          <Link
            to="/courses/$courseId/$lessonId"
            params={{ courseId, lessonId: prev.lesson.id }}
            className="nav-card group rounded-2xl border-2 bg-card p-4 transition-colors hover:border-primary"
          >
            <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">
              <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" aria-hidden /> Previous
            </span>
            <span className="mt-1 block font-bold">{prev.lesson.title}</span>
          </Link>
        ) : (
          <span className="hidden sm:block" />
        )}
        {next && (
          <Link
            to="/courses/$courseId/$lessonId"
            params={{ courseId, lessonId: next.lesson.id }}
            className="nav-card group rounded-2xl border-2 bg-card p-4 text-right transition-colors hover:border-primary"
          >
            <span className="flex items-center justify-end gap-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Next <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </span>
            <span className="mt-1 block font-bold">{next.lesson.title}</span>
            {next.chapter.title && <span className="block text-xs text-muted-foreground">{next.chapter.title}</span>}
          </Link>
        )}
      </nav>
    </footer>
  );
}
