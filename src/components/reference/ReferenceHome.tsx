import { RichTextView } from "@/components/lesson/RichTextView";
import { CATEGORY_TITLES, navTitle, referenceTree } from "@/references/registry";
import { searchReferences } from "@/references/search";
import { EntryLink } from "./ReferenceEntryView";
import { ReferenceSearchBox } from "./ReferenceSearchBox";

/** The manual's front page: search as you type, or browse every topic. */
export function ReferenceHome({ query, onQueryChange }: { query: string; onQueryChange: (q: string) => void }) {
  const q = query.trim();
  const results = q ? searchReferences(q) : [];

  return (
    <div>
      <h1 className="text-3xl font-extrabold md:text-4xl">Reference</h1>
      <p className="mt-3 max-w-[60ch] text-lg text-muted-foreground">
        Quick, plain answers about Python and programming ideas: what something does, how to write it, what it gives back,
        and the mistakes to watch for.
      </p>
      <div className="mt-6 max-w-xl">
        <ReferenceSearchBox initial={query} onSearch={onQueryChange} live autoFocus />
      </div>

      {q ? (
        <section className="mt-8" aria-labelledby="results-title">
          <h2 id="results-title" className="text-sm font-bold uppercase tracking-wide text-muted-foreground" aria-live="polite">
            {results.length ? `${results.length} ${results.length === 1 ? "result" : "results"} for “${q}”` : `Nothing matches “${q}”`}
          </h2>
          {results.length ? (
            <ul className="mt-3 flex flex-col gap-2">
              {results.map(({ entry }) => (
                <li key={entry.id}>
                  <EntryLink id={entry.id} className="block rounded-2xl border-2 bg-card px-4 py-3 transition-colors hover:border-primary">
                    <span className="flex flex-wrap items-baseline gap-x-3">
                      <span className={`font-bold ${entry.scope === "concept" ? "" : "font-mono"}`}>{entry.title}</span>
                      <span className="text-xs font-semibold text-muted-foreground">
                        {entry.scope === "concept" ? "Programming concept" : `Python · ${CATEGORY_TITLES[entry.category]}`}
                      </span>
                    </span>
                    <span className="mt-0.5 block text-sm text-muted-foreground">
                      <RichTextView text={entry.summary} />
                    </span>
                  </EntryLink>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-muted-foreground">
              Try a shorter word, a function name like <code className="inline-code">len</code>, or words from an error message. Or
              browse the topics below.
            </p>
          )}
        </section>
      ) : null}

      {!results.length && (
        <div className="mt-10 space-y-10">
          {referenceTree().map((section) => (
            <section key={section.scope} aria-labelledby={`browse-${section.scope}`}>
              <h2 id={`browse-${section.scope}`} className="text-2xl font-extrabold">
                {section.title}
              </h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {section.groups.map((group) => (
                  <div key={group.category} className="rounded-3xl border-2 bg-card p-4">
                    {section.groups.length > 1 && <h3 className="font-bold">{group.title}</h3>}
                    <ul className={`flex flex-wrap gap-1.5 ${section.groups.length > 1 ? "mt-2" : ""}`}>
                      {group.items.flatMap(({ entry, children }) => [entry, ...children]).map((e) => (
                        <li key={e.id}>
                          <EntryLink
                            id={e.id}
                            className={`inline-block rounded-full border-2 px-3 py-1 text-sm font-semibold transition-colors hover:border-primary ${e.scope === "concept" ? "" : "font-mono"}`}
                          >
                            {e.parent ? e.title : navTitle(e)}
                          </EntryLink>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
