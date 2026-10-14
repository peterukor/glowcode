import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ReferenceHome } from "@/components/reference/ReferenceHome";
import { ReferenceShell } from "@/components/reference/ReferenceShell";
import { parseOrigin, type ReferenceOrigin } from "@/references/navigation";

type ReferenceIndexSearch = ReferenceOrigin & { q?: string };

/** The manual's home: search and browse. `?q=` keeps the search in the URL for Back / Forward. */
export const Route = createFileRoute("/reference/")({
  validateSearch: (search: Record<string, unknown>): ReferenceIndexSearch => ({
    ...parseOrigin(search),
    q: typeof search.q === "string" && search.q.trim() ? search.q : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Reference · Glowcode" },
      { name: "description", content: "Quick answers about Python and programming ideas: what it does, how to write it, what it returns." },
    ],
  }),
  component: ReferenceIndexPage,
});

function ReferenceIndexPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  return (
    <ReferenceShell topic="the reference">
      <ReferenceHome
        query={search.q ?? ""}
        // Typing replaces the history entry, so Back leaves the manual instead of undoing letters.
        onQueryChange={(q) => void navigate({ to: "/reference", search: { ...search, q: q.trim() ? q : undefined }, replace: true })}
      />
    </ReferenceShell>
  );
}
