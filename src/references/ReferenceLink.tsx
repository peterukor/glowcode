import { ArrowRight } from "lucide-react";
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useReferenceNavigation } from "./navigation";
import { getReference } from "./registry";

const OPEN_DELAY = 120;
const CLOSE_DELAY = 160;
const GAP = 8;
const MARGIN = 8;

/**
 * A term that explains itself. Hover (mouse), keyboard focus or tap opens a small card with
 * the entry's title, a one-line summary and "See more" for the full manual page.
 *
 * - The card is drawn in a portal with fixed positioning, so it never shifts the text,
 *   isn't clipped by scrolling code blocks, and stays on screen near the edges.
 * - Escape closes it and returns focus to the term; so does tapping or clicking elsewhere.
 * - Screen readers hear the summary as the term's description without opening anything.
 * - Unknown ids render as plain text (the content tests report them).
 */
export function ReferenceLink({ id, label, code, variant = "prose" }: { id: string; label: string; code?: boolean; variant?: "prose" | "code" }) {
  const entry = getReference(id);
  const nav = useReferenceNavigation();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; placement: "below" | "above" } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const lastPointer = useRef<string>("");
  // A tap or click focuses the term before its click event; let the click decide.
  const pointerFocus = useRef(false);
  const skipFocusOpen = useRef(false);
  const cardId = useId();
  const descId = useId();
  const titleId = useId();

  const schedule = useCallback((next: boolean, delay: number) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(next), delay);
  }, []);
  const close = useCallback((refocus = false) => {
    clearTimeout(timer.current);
    setOpen(false);
    if (refocus) {
      skipFocusOpen.current = true; // returning focus shouldn't reopen the card
      triggerRef.current?.focus();
      skipFocusOpen.current = false;
    }
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  // Place the card under the term (or above it when there's no room), inside the viewport.
  const place = useCallback(() => {
    const t = triggerRef.current?.getBoundingClientRect();
    const card = cardRef.current;
    if (!t || !card) return;
    const w = card.offsetWidth;
    const h = card.offsetHeight;
    const below = t.bottom + GAP + h <= window.innerHeight - MARGIN || t.top - GAP - h < MARGIN;
    const left = Math.min(Math.max(t.left + t.width / 2 - w / 2, MARGIN), Math.max(MARGIN, window.innerWidth - w - MARGIN));
    setPos({ top: below ? t.bottom + GAP : t.top - GAP - h, left, placement: below ? "below" : "above" });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    const outside = (e: PointerEvent) => {
      const target = e.target as Node;
      if (!triggerRef.current?.contains(target) && !cardRef.current?.contains(target)) close();
    };
    document.addEventListener("pointerdown", outside);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
      document.removeEventListener("pointerdown", outside);
    };
  }, [open, place, close]);

  const text: ReactNode = code ? <code className="inline-code">{label}</code> : label;
  if (!entry) return <>{text}</>;

  const leavesBoth = (next: EventTarget | null) =>
    !(next instanceof Node) || (!triggerRef.current?.contains(next) && !cardRef.current?.contains(next));
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape" && open) {
      e.stopPropagation();
      close(true);
    }
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={variant === "code" ? "ref-term ref-term-code" : "ref-term"}
        aria-expanded={open}
        aria-controls={open ? cardId : undefined}
        aria-describedby={descId}
        data-ref={entry.id}
        onPointerDown={(e) => {
          lastPointer.current = e.pointerType;
          pointerFocus.current = true;
        }}
        onPointerEnter={(e) => e.pointerType === "mouse" && schedule(true, OPEN_DELAY)}
        onPointerLeave={(e) => e.pointerType === "mouse" && schedule(false, CLOSE_DELAY)}
        onFocus={() => {
          if (!pointerFocus.current && !skipFocusOpen.current) setOpen(true); // keyboard focus
        }}
        onBlur={(e) => {
          pointerFocus.current = false;
          if (leavesBoth(e.relatedTarget)) schedule(false, CLOSE_DELAY);
        }}
        onClick={(e) => {
          // A mouse click keeps the card open (hover already opened it); a tap or the
          // keyboard (Enter / Space, detail 0) toggles it.
          clearTimeout(timer.current);
          const mouse = e.detail > 0 && lastPointer.current === "mouse";
          pointerFocus.current = false;
          setOpen((o) => (mouse ? true : !o));
        }}
        onKeyDown={onKeyDown}
      >
        {text}
      </button>
      {/* Read as the term's description; hidden so it isn't read twice in the text flow. */}
      <span id={descId} hidden>
        {plain(entry.summary)}
      </span>
      {open &&
        createPortal(
          <div
            ref={cardRef}
            id={cardId}
            role="dialog"
            aria-labelledby={titleId}
            className="ref-card"
            data-placement={pos?.placement}
            style={pos ? { top: pos.top, left: pos.left } : { top: 0, left: 0, visibility: "hidden" }}
            onPointerEnter={(e) => e.pointerType === "mouse" && clearTimeout(timer.current)}
            onPointerLeave={(e) => e.pointerType === "mouse" && schedule(false, CLOSE_DELAY)}
            onBlur={(e) => leavesBoth(e.relatedTarget) && schedule(false, CLOSE_DELAY)}
            onKeyDown={onKeyDown}
          >
            <p id={titleId} className="font-display text-sm font-bold">
              {entry.title}
            </p>
            <p className="mt-1 text-[13px] leading-snug text-muted-foreground">{plain(entry.summary)}</p>
            <a
              href={nav.hrefFor(entry.id)}
              className="mt-2 inline-flex items-center gap-1 text-[13px] font-bold text-primary hover:underline"
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                if (nav.open?.(entry.id)) {
                  e.preventDefault();
                  close();
                }
              }}
            >
              See more <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              <span className="sr-only"> about {entry.title}</span>
            </a>
          </div>,
          document.body,
        )}
    </>
  );
}

/** Summaries use lesson markup (`code`, **bold**); the popup shows them as plain text. */
const plain = (text: string) => text.replace(/`([^`]+)`/g, "$1").replace(/\*\*([^*]+)\*\*/g, "$1");
