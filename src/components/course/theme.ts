import type { CourseTheme } from "@/courses/types";

/** Tailwind classes per course theme, written out in full so Tailwind can find them. */
export const courseTheme: Record<CourseTheme, { tile: string; text: string; bar: string; border: string }> = {
  grape: { tile: "bg-grape/15 border-grape/40", text: "text-grape", bar: "bg-grape", border: "border-t-grape" },
  sky: { tile: "bg-sky/15 border-sky/40", text: "text-sky", bar: "bg-sky", border: "border-t-sky" },
  teal: { tile: "bg-teal/15 border-teal/40", text: "text-teal", bar: "bg-teal", border: "border-t-teal" },
  coral: { tile: "bg-coral/15 border-coral/40", text: "text-coral", bar: "bg-coral", border: "border-t-coral" },
  sun: { tile: "bg-sun/25 border-sun/60", text: "text-foreground", bar: "bg-sun", border: "border-t-sun" },
};
