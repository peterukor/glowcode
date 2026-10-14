import { createFileRoute, Link } from "@tanstack/react-router";
import { MissingEntry } from "@/components/reference/MissingEntry";
import { ReferenceEntryView } from "@/components/reference/ReferenceEntryView";
import { ReferenceShell } from "@/components/reference/ReferenceShell";
import { parseOrigin } from "@/references/navigation";
import { getReference } from "@/references/registry";

/**
 * Every manual entry renders through this one route, from its data in the registry.
 * Adding an entry never needs a new page.
 */
export const Route = createFileRoute("/reference/$entryId")({
  validateSearch: (search: Record<string, unknown>) => parseOrigin(search),
  loader: ({ params }) => ({ id: params.entryId, entry: getReference(params.entryId) ?? null }),
  head: ({ loaderData }) => ({
    meta: loaderData?.entry
      ? [
          { title: `${loaderData.entry.title} · Reference · Glowcode` },
          { name: "description", content: loaderData.entry.summary },
        ]
      : [{ title: "Reference entry not found · Glowcode" }],
  }),
  component: ReferenceEntryPage,
});

function ReferenceEntryPage() {
  const { id, entry } = Route.useLoaderData();
  return (
    <ReferenceShell currentId={entry?.id} topic={entry?.title ?? "the reference"}>
      {entry ? (
        // Keyed so walkthroughs and open examples reset when moving between entries.
        <div key={entry.id} className="lesson-enter">
          <ReferenceEntryView entry={entry} />
        </div>
      ) : (
        <MissingEntry
          id={id}
          homeLink={
            <Link to="/reference" className="btn-primary">
              Search the reference
            </Link>
          }
        />
      )}
    </ReferenceShell>
  );
}
