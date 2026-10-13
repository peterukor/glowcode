import { createFileRoute, Link, notFound, redirect } from "@tanstack/react-router";
import { ArrowLeft, Clock } from "lucide-react";
import { resumeLink } from "@/components/course/CourseCard";
import { courseTheme } from "@/components/course/theme";
import { isOpenable } from "@/courses/queries";
import { getCourse } from "@/courses/registry";
import { progressState } from "@/progress/useProgress";

/**
 * /courses/<id>: sends students straight into the course, at their last lesson
 * (or the first one). Coming Soon courses get a friendly page instead.
 */
export const Route = createFileRoute("/courses/$courseId/")({
  beforeLoad: ({ params }) => {
    const course = getCourse(params.courseId);
    if (!course) throw notFound();
    if (isOpenable(course)) {
      const target = resumeLink(course, progressState.get().courses[course.id]);
      if (target) {
        throw redirect({
          to: "/courses/$courseId/$lessonId",
          params: { courseId: course.id, lessonId: target.lessonId },
          hash: target.hash,
          replace: true,
        });
      }
    }
    return { course };
  },
  head: ({ params }) => ({ meta: [{ title: `${getCourse(params.courseId)?.title ?? "Course"} · Glowcode` }] }),
  component: CourseComingSoon,
});

function CourseComingSoon() {
  const { courseId } = Route.useParams();
  const course = getCourse(courseId)!;
  const theme = courseTheme[course.theme];
  return (
    <div className="mx-auto grid min-h-[70vh] max-w-xl place-items-center px-5 py-16 text-center">
      <div>
        <span className={`mx-auto grid h-20 w-20 place-items-center rounded-3xl border-2 text-5xl ${theme.tile}`} aria-hidden>
          {course.icon}
        </span>
        <p className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-bold text-muted-foreground">
          <Clock className="h-3.5 w-3.5" aria-hidden /> Coming soon
        </p>
        <h1 className="mt-4 text-4xl font-extrabold">{course.title}</h1>
        <p className="mt-3 text-lg text-muted-foreground">{course.description}</p>
        <p className="mt-6">We're writing this course now. Its lessons will appear here as soon as they're ready.</p>
        <Link to="/courses" className="btn-ghost mt-8">
          <ArrowLeft className="h-4 w-4" aria-hidden /> Back to all courses
        </Link>
      </div>
    </div>
  );
}
