import { createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { CourseSidebar } from "@/components/course/CourseSidebar";
import { AssistantPanel, type AssistantContext } from "@/components/lesson/AssistantPanel";
import { LessonBody } from "@/components/lesson/LessonBody";
import { LessonHeader } from "@/components/lesson/LessonHeader";
import { LessonLayout } from "@/components/lesson/LessonLayout";
import { LessonNavigation } from "@/components/lesson/LessonNavigation";
import { RelatedReferences } from "@/components/lesson/RelatedReferences";
import { findPublishedLesson, lessonNeighbors, publishedLessons } from "@/courses/queries";
import { getCourse } from "@/courses/registry";
import { isLessonComplete } from "@/progress/progress";
import { progressActions, useCourseProgress } from "@/progress/useProgress";

/**
 * Every lesson of every course renders through this one route. Lessons are content
 * files, so adding one never needs a new page.
 */
export const Route = createFileRoute("/courses/$courseId/$lessonId")({
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

function LessonPage() {
  const { course, entry } = Route.useLoaderData();
  const { lesson, chapter } = entry;
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

  const assistantContext: AssistantContext = {
    kind: "lesson",
    courseId: course.id,
    courseTitle: course.title,
    lessonId: lesson.id,
    lessonTitle: lesson.title,
    objectives: lesson.objectives,
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
          handlers={{ onActivity: (activityId) => progressActions.recordActivity(course.id, lesson.id, activityId) }}
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
    </LessonLayout>
  );
}
