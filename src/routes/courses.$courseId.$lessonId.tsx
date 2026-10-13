import { createFileRoute, notFound, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { CourseSidebar } from "@/components/course/CourseSidebar";
import { AssistantPanel, type AssistantContext } from "@/components/lesson/AssistantPanel";
import { LessonBody } from "@/components/lesson/LessonBody";
import { LessonHeader } from "@/components/lesson/LessonHeader";
import { LessonLayout } from "@/components/lesson/LessonLayout";
import { LessonNavigation } from "@/components/lesson/LessonNavigation";
import { RelatedReferences } from "@/components/lesson/RelatedReferences";
import { WalkthroughView } from "@/components/lesson/WalkthroughView";
import { findPublishedLesson, lessonNeighbors, publishedLessons, walkthroughsIn } from "@/courses/queries";
import { getCourse } from "@/courses/registry";
import { isLessonComplete } from "@/progress/progress";
import { progressActions, useCourseProgress } from "@/progress/useProgress";

type LessonSearch = { walkthrough?: string };

/**
 * Every lesson of every course renders through this one route. Lessons are content
 * files, so adding one never needs a new page.
 */
export const Route = createFileRoute("/courses/$courseId/$lessonId")({
  validateSearch: (search: Record<string, unknown>): LessonSearch =>
    typeof search["walkthrough"] === "string" ? { walkthrough: search["walkthrough"] } : {},
  loader: ({ params }) => {
    const course = getCourse(params.courseId);
    const entry = course && findPublishedLesson(course, params.lessonId);
    if (!course || !entry) throw notFound(); // drafts and coming-soon lessons can't be opened
    return { course, entry };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.entry.lesson.title} · ${loaderData.course.title} · Glowcode` },
          { name: "description", content: loaderData.entry.lesson.description },
        ]
      : [{ title: "Lesson not found · Glowcode" }],
  }),
  component: LessonPage,
});

// Set when a walkthrough was opened from the lesson, so closing it can step back in history.
let openedInApp = false;

function LessonPage() {
  const { course, entry } = Route.useLoaderData();
  const { lesson, chapter } = entry;
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const router = useRouter();
  const progress = useCourseProgress(course.id);

  // Remember where the student is. Visiting is not completing.
  useEffect(() => {
    progressActions.visitLesson(course.id, lesson.id);
  }, [course.id, lesson.id]);

  // When resuming at an activity (#activity-...), bring it into view once the page renders.
  const scrolledFor = useRef<string | null>(null);
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash && scrolledFor.current !== lesson.id) {
      scrolledFor.current = lesson.id;
      document.getElementById(hash)?.scrollIntoView({ block: "start" });
    }
  }, [lesson.id]);

  const list = publishedLessons(course);
  const position = `Lesson ${list.findIndex((e) => e.lesson.id === lesson.id) + 1} of ${list.length}`;
  const { prev, next } = lessonNeighbors(course, lesson.id);
  const walkthrough = search.walkthrough ? walkthroughsIn(lesson).find((w) => w.id === search.walkthrough) : undefined;

  const assistantContext: AssistantContext = {
    courseId: course.id,
    courseTitle: course.title,
    lessonId: lesson.id,
    lessonTitle: lesson.title,
    objectives: lesson.objectives,
    ...(walkthrough && { walkthrough: { id: walkthrough.id, code: walkthrough.code, line: 1 } }),
  };

  const openWalkthrough = (id: string) => {
    openedInApp = true;
    // resetScroll: false keeps the reading position exactly where it was.
    void navigate({ search: { walkthrough: id }, resetScroll: false });
  };
  const closeWalkthrough = () => {
    if (openedInApp) {
      openedInApp = false;
      router.history.back();
    } else {
      void navigate({ search: {}, replace: true, resetScroll: false });
    }
  };

  return (
    <LessonLayout
      contents={(onNavigate) => <CourseSidebar course={course} currentLessonId={lesson.id} onNavigate={onNavigate} />}
      assistant={<AssistantPanel context={assistantContext} />}
    >
      {/* Keyed by lesson so answers and revealed hints reset when moving between lessons. */}
      <div key={lesson.id} className="lesson-enter">
        <LessonHeader course={course} chapter={chapter} lesson={lesson} position={position} />
        <LessonBody
          lesson={lesson}
          handlers={{
            onOpenWalkthrough: openWalkthrough,
            onActivity: (activityId) => progressActions.recordActivity(course.id, lesson.id, activityId),
          }}
        />
        {lesson.references && <RelatedReferences ids={lesson.references} />}
        <LessonNavigation
          courseId={course.id}
          prev={prev}
          next={next}
          completed={isLessonComplete(progress, lesson.id)}
          onToggleComplete={(complete) => progressActions.setComplete(course.id, lesson.id, complete)}
        />
      </div>

      {walkthrough && <WalkthroughView key={walkthrough.id} walkthrough={walkthrough} onClose={closeWalkthrough} />}
    </LessonLayout>
  );
}
