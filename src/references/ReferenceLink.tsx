import { useId, useState } from "react";
import { getReference } from "./registry";

/**
 * A term in lesson text that explains itself: hover, keyboard focus or tap shows a short
 * definition. In Phase 3 the tooltip gains a "See more" link to the full manual page.
 */
export function ReferenceLink({ id, label, code }: { id: string; label: string; code?: boolean }) {
  const entry = getReference(id);
  const tipId = useId();
  const [open, setOpen] = useState(false);

  const text = code ? <code className="inline-code">{label}</code> : label;
  if (!entry) return <>{text}</>; // validateCourses() reports unknown ids in tests

  return (
    <span className="ref" data-open={open || undefined} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        className="ref-term"
        aria-describedby={tipId}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
        }}
      >
        {text}
      </button>
      <span role="tooltip" id={tipId} className="ref-tip">
        <span className="block font-display text-sm font-bold">{entry.title}</span>
        <span className="mt-1 block text-[13px] leading-snug text-muted-foreground">{entry.summary}</span>
      </span>
    </span>
  );
}
