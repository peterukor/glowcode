import { BookMarked, ChevronDown } from "lucide-react";
import { useState } from "react";
import { navTitle, referenceTree, type ReferenceTreeGroup } from "@/references/registry";
import { EntryLink } from "./ReferenceEntryView";
import { ReferenceSearchBox } from "./ReferenceSearchBox";

/**
 * The manual's table of contents: a search box, then languages → topic groups → entries,
 * with methods nested under their type. Groups fold open and closed; the current entry is
 * marked and its group starts open.
 */
export function ReferenceSidebar({
  currentId,
  onSearch,
  onNavigate,
  homeHref,
  onHome,
}: {
  currentId?: string;
  onSearch: (query: string) => void;
  /** Called after a link is chosen (the mobile drawer closes itself). */
  onNavigate?: () => void;
  homeHref: string;
  onHome: () => void;
}) {
  const tree = referenceTree();
  const contains = (g: ReferenceTreeGroup) => g.items.some((i) => i.entry.id === currentId || i.children.some((c) => c.id === currentId));
  // On an entry page only its group starts open; on the home page everything does.
  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(tree.flatMap((s) => s.groups.map((g) => [`${s.scope}:${g.category}`, !currentId || contains(g)]))),
  );

  return (
    <nav aria-label="Reference contents" className="ref-nav flex flex-col gap-5 p-4">
      <div>
        <a
          href={homeHref}
          onClick={(e) => {
            if (e.metaKey || e.ctrlKey || e.button !== 0) return;
            e.preventDefault();
            onHome();
            onNavigate?.();
          }}
          className="inline-flex items-center gap-2 font-display text-lg font-extrabold"
        >
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand text-white shadow-soft" aria-hidden>
            <BookMarked className="h-4 w-4" />
          </span>
          Reference
        </a>
        <div className="mt-3">
          <ReferenceSearchBox
            onSearch={(q) => {
              onSearch(q);
              onNavigate?.();
            }}
          />
        </div>
      </div>

      {tree.map((section) => (
        <div key={section.scope}>
          <p className="px-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">{section.title}</p>
          <ul className="mt-1 flex flex-col gap-1">
            {section.groups.map((group) => {
              const key = `${section.scope}:${group.category}`;
              const listId = `ref-group-${section.scope}-${group.category}`;
              const isOpen = open[key] ?? false;
              const single = section.groups.length === 1; // e.g. "Programming Concepts": no extra level
              return (
                <li key={key}>
                  {!single && (
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={listId}
                      onClick={() => setOpen((o) => ({ ...o, [key]: !isOpen }))}
                      className="flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left text-sm font-bold hover:bg-muted"
                    >
                      <span className="flex-1">{group.title}</span>
                      <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? "" : "-rotate-90"}`} aria-hidden />
                    </button>
                  )}
                  {(single || isOpen) && (
                    <ul id={listId} className={`flex flex-col gap-0.5 ${single ? "" : "ml-4 mt-0.5 border-l-2 border-border/80 pl-2"}`}>
                      {group.items.map(({ entry, children }) => (
                        <li key={entry.id}>
                          <Item id={entry.id} label={navTitle(entry)} code={entry.scope !== "concept"} currentId={currentId} onNavigate={onNavigate} />
                          {children.length > 0 && (
                            <ul className="ml-3 flex flex-col gap-0.5 border-l-2 border-dashed border-border/80 pl-2" aria-label={`${entry.title} methods`}>
                              {children.map((c) => (
                                <li key={c.id}>
                                  <Item id={c.id} label={navTitle(c)} code currentId={currentId} onNavigate={onNavigate} />
                                </li>
                              ))}
                            </ul>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function Item({ id, label, code, currentId, onNavigate }: { id: string; label: string; code: boolean; currentId?: string; onNavigate?: () => void }) {
  return (
    <EntryLink
      id={id}
      current={id === currentId}
      onNavigate={onNavigate}
      className={`block rounded-lg px-2 py-1 text-sm text-muted-foreground hover:bg-muted hover:text-foreground ${code ? "font-mono" : ""}`}
    >
      {label}
    </EntryLink>
  );
}
