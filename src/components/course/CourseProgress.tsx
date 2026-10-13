import type { CourseSummary } from "@/progress/progress";

/** "1 of 2 lessons complete" with a bar. Only shown for courses that have lessons. */
export function CourseProgress({ summary, barClass = "bg-brand" }: { summary: CourseSummary; barClass?: string }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 text-xs font-semibold text-muted-foreground">
        <span>
          {summary.completed} of {summary.total} {summary.total === 1 ? "lesson" : "lessons"} complete
        </span>
        <span className="font-mono font-bold text-foreground">{summary.percent}%</span>
      </div>
      <div
        className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-label="Course progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={summary.percent}
      >
        <div className={`h-full rounded-full transition-[width] duration-700 ${barClass}`} style={{ width: `${summary.percent}%` }} />
      </div>
    </div>
  );
}
