import { BookMarked } from "lucide-react";
import { ReferenceLink } from "@/references/ReferenceLink";
import { getReference } from "@/references/registry";

/** "Look it up": the reference entries this lesson relies on. */
export function RelatedReferences({ ids }: { ids: string[] }) {
  const entries = ids.flatMap((id) => {
    const e = getReference(id);
    return e ? [e] : [];
  });
  if (!entries.length) return null;
  return (
    <section className="mt-14 rounded-3xl border-2 bg-muted/40 p-5" aria-labelledby="look-it-up">
      <h2 id="look-it-up" className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">
        <BookMarked className="h-4 w-4" aria-hidden /> Look it up
      </h2>
      <ul className="mt-3 flex flex-wrap gap-2">
        {entries.map((e) => (
          <li key={e.id} className="rounded-full border-2 bg-card px-3 py-1 text-sm font-semibold">
            <ReferenceLink id={e.id} label={e.title} />
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-muted-foreground">Hover, focus or tap a term for a quick explanation. Full reference pages are on the way.</p>
    </section>
  );
}
