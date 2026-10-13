import { BookOpen, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen, Sparkles } from "lucide-react";
import { useState, type CSSProperties, type ReactNode } from "react";
import { usePanelPrefs } from "@/progress/useProgress";
import { Drawer } from "../Drawer";

/**
 * Three columns on wide screens (≥1280px): course contents | lesson | Ask Glow.
 * Each side panel collapses to a slim rail independently, and the reading column grows
 * to fill the space. The choice is remembered. Below 1280px both panels become drawers.
 */
export function LessonLayout({
  contents,
  assistant,
  children,
}: {
  /** Receives a callback that closes the mobile drawer after navigating. */
  contents: (onNavigate?: () => void) => ReactNode;
  assistant: ReactNode;
  children: ReactNode;
}) {
  const [prefs, setPrefs] = usePanelPrefs();
  const [drawer, setDrawer] = useState<"contents" | "assistant" | null>(null);

  const columns = {
    "--left": prefs.contentsOpen ? "18rem" : "3.25rem",
    "--right": prefs.assistantOpen ? "20rem" : "3.25rem",
  } as CSSProperties;

  return (
    <div className="lesson-shell" style={columns}>
      {/* LEFT: course contents (wide screens) */}
      <aside className="lesson-panel lesson-panel-left" aria-label="Course contents" data-open={prefs.contentsOpen || undefined}>
        {prefs.contentsOpen ? (
          <div id="contents-panel" className="panel-body">
            <button
              type="button"
              className="icon-btn absolute right-3 top-3 z-10"
              aria-label="Hide course contents"
              aria-expanded="true"
              aria-controls="contents-panel"
              onClick={() => setPrefs({ contentsOpen: false })}
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
            {contents()}
          </div>
        ) : (
          <PanelRail side="left" label="Contents" icon={<BookOpen className="h-4 w-4" />} onOpen={() => setPrefs({ contentsOpen: true })}>
            <PanelLeftOpen className="h-4 w-4" />
          </PanelRail>
        )}
      </aside>

      {/* CENTER: the reading column */}
      <div className="min-w-0">
        <div className="sticky top-16 z-20 flex items-center gap-2 border-b bg-background/85 px-4 py-2 backdrop-blur-lg xl:hidden">
          <button type="button" className="btn-chip" onClick={() => setDrawer("contents")} aria-haspopup="dialog">
            <BookOpen className="h-4 w-4" aria-hidden /> Contents
          </button>
          <button type="button" className="btn-chip ml-auto" onClick={() => setDrawer("assistant")} aria-haspopup="dialog">
            <Sparkles className="h-4 w-4 text-grape" aria-hidden /> Ask Glow
          </button>
        </div>
        <article id="lesson-main" className="mx-auto w-full max-w-[48rem] px-5 pb-24 pt-8 sm:px-8">
          {children}
        </article>
      </div>

      {/* RIGHT: Ask Glow (wide screens) */}
      <aside className="lesson-panel lesson-panel-right" aria-label="Ask Glow" data-open={prefs.assistantOpen || undefined}>
        {prefs.assistantOpen ? (
          <div id="assistant-panel" className="panel-body flex flex-col">
            <button
              type="button"
              className="icon-btn absolute left-3 top-3 z-10"
              aria-label="Hide Ask Glow"
              aria-expanded="true"
              aria-controls="assistant-panel"
              onClick={() => setPrefs({ assistantOpen: false })}
            >
              <PanelRightClose className="h-4 w-4" />
            </button>
            {assistant}
          </div>
        ) : (
          <PanelRail side="right" label="Ask Glow" icon={<Sparkles className="h-4 w-4 text-grape" />} onOpen={() => setPrefs({ assistantOpen: true })}>
            <PanelRightOpen className="h-4 w-4" />
          </PanelRail>
        )}
      </aside>

      {/* Drawers for smaller screens */}
      <Drawer open={drawer === "contents"} onClose={() => setDrawer(null)} side="left" title="Course contents">
        {contents(() => setDrawer(null))}
      </Drawer>
      <Drawer open={drawer === "assistant"} onClose={() => setDrawer(null)} side="right" title="Ask Glow">
        {assistant}
      </Drawer>
    </div>
  );
}

/** What a collapsed panel shrinks to: a slim strip that reopens it. */
function PanelRail({ side, label, icon, onOpen, children }: { side: "left" | "right"; label: string; icon: ReactNode; onOpen: () => void; children: ReactNode }) {
  return (
    <div className="flex h-full flex-col items-center gap-3 py-3">
      <button type="button" className="icon-btn" aria-label={`Show ${label}`} aria-expanded="false" onClick={onOpen}>
        {children}
      </button>
      <button
        type="button"
        onClick={onOpen}
        tabIndex={-1}
        aria-hidden
        className={`flex items-center gap-2 rounded-full px-1 py-3 text-xs font-bold text-muted-foreground hover:text-foreground [writing-mode:vertical-rl] ${side === "left" ? "rotate-180" : ""}`}
      >
        {icon} {label}
      </button>
    </div>
  );
}
