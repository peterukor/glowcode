import type { ReactNode } from "react";
import { searchReferences } from "@/references/search";
import { EntryList } from "./ReferenceEntryView";

/** Shown for an unknown reference id (an old link, a typo): say so, and suggest close matches. */
export function MissingEntry({ id, homeLink }: { id: string; homeLink: ReactNode }) {
  const suggestions = suggest(id);
  return (
    <div>
      <h1 className="text-3xl font-extrabold">No entry called “{id}”</h1>
      <p className="mt-3 text-muted-foreground">This reference page doesn't exist, or it has moved.</p>
      {suggestions.length > 0 && (
        <div className="lesson-prose mt-6">
          <h2 className="text-xl font-extrabold">Did you mean</h2>
          <div className="mt-3">
            <EntryList entries={suggestions} />
          </div>
        </div>
      )}
      <div className="mt-6">{homeLink}</div>
    </div>
  );
}

/** Close matches for a mistyped id: search its last part, trimming letters until something matches ("lenn" → "len"). */
function suggest(id: string) {
  let guess = (id.split(".").at(-1) ?? id).replace(/[-_]/g, " ");
  while (guess.length >= 2) {
    const found = searchReferences(guess).slice(0, 4);
    if (found.length) return found.map((r) => r.entry);
    guess = guess.slice(0, -1);
  }
  return [];
}
