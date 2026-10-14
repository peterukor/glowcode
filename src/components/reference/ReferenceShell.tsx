import { useCanGoBack, useLocation, useNavigate, useRouter } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { AssistantPanel } from "@/components/lesson/AssistantPanel";
import { LessonLayout } from "@/components/lesson/LessonLayout";
import { findPublishedLesson } from "@/courses/queries";
import { getCourse } from "@/courses/registry";
import { nextOrigin, parseOrigin, type ReferenceOrigin } from "@/references/navigation";
import { ReferenceSidebar } from "./ReferenceSidebar";

/**
 * The manual's page frame: the lesson page's three-column layout, with the reference
 * contents on the left and the Ask Glow panel on the right. Adds "Back to lesson" when the
 * student arrived from a lesson.
 */
export function ReferenceShell({ currentId, topic, children }: { currentId?: string; topic: string; children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const origin = parseOrigin(location.search as Record<string, unknown>);
  const onward = nextOrigin(location.pathname, origin);

  return (
    <LessonLayout
      contentsLabel="Reference contents"
      contents={(onNavigate) => (
        <ReferenceSidebar
          key={currentId ?? "home"}
          currentId={currentId}
          homeHref="/reference"
          onHome={() => void navigate({ to: "/reference", search: onward })}
          onSearch={(q) => void navigate({ to: "/reference", search: { ...onward, q: q || undefined } })}
          onNavigate={onNavigate}
        />
      )}
      assistant={<AssistantPanel context={{ kind: "reference", referenceId: currentId, referenceTitle: topic }} />}
    >
      <BackToLesson origin={origin} />
      {children}
    </LessonLayout>
  );
}

/**
 * Returns to the lesson the student came from. Going back through history (rather than
 * opening the lesson again) restores where they were reading; without history (a shared
 * link), it opens the lesson instead.
 */
function BackToLesson({ origin }: { origin: ReferenceOrigin }) {
  const router = useRouter();
  const canGoBack = useCanGoBack();
  if (!origin.from) return null;
  const [, , courseId, lessonId] = origin.from.split("/");
  const course = courseId ? getCourse(courseId) : undefined;
  const lesson = course && lessonId ? findPublishedLesson(course, lessonId)?.lesson : undefined;
  if (!lesson) return null;

  return (
    <button
      type="button"
      className="mb-6 inline-flex items-center gap-1.5 rounded-full border-2 bg-card px-3 py-1.5 text-sm font-semibold transition-colors hover:border-primary hover:text-primary"
      onClick={() => {
        if (canGoBack) router.history.go(-(origin.hops ?? 1));
        else void router.navigate({ href: origin.from! });
      }}
    >
      <ArrowLeft className="h-4 w-4" aria-hidden /> Back to {lesson.title}
    </button>
  );
}
