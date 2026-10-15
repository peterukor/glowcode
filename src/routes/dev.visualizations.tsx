import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CircleCheck, TriangleAlert, Wrench } from "lucide-react";
import { useMemo } from "react";
import { WalkthroughPlayer } from "@/components/walkthrough/WalkthroughPlayer";
import { visualizationLabels } from "@/visualizations/labels";
import { walkthroughCatalog } from "@/walkthrough/catalog";
import { validateWalkthrough } from "@/walkthrough/validate";

/**
 * Developer showcase: every real walkthrough in one place, to check appearance, animation and
 * interaction before writing more lessons. Not linked from student navigation, and hidden
 * from search engines. It shows the actual lesson, playground and manual data, never copies.
 */
export const Route = createFileRoute("/dev/visualizations")({
  validateSearch: (search: Record<string, unknown>) => ({ w: typeof search.w === "string" ? search.w : undefined }),
  head: () => ({
    meta: [{ title: "Visualization showcase (developers) · Glowcode" }, { name: "robots", content: "noindex" }],
  }),
  component: Showcase,
});

/** The behaviors the engine has to get right, and a walkthrough that shows each. */
const FEATURED: { label: string; id: string }[] = [
  { label: "Reassignment: read, calculate, rebind", id: "reassign" },
  { label: "Reassignment in a lesson", id: "py-birthday" },
  { label: "Shared list vs copy", id: "py-shared-list" },
  { label: "Precedence tree", id: "py-precedence" },
  { label: "List changes, pop, slice", id: "py-list-changes" },
  { label: "Long list (sliding window)", id: "py-long-list" },
  { label: "String indexes and slices", id: "py-string-slices" },
  { label: "Dict lookup and update", id: "py-dict-update" },
  { label: "Set membership", id: "py-set-membership" },
  { label: "for loop (list)", id: "py-for-list" },
  { label: "for loop (running total)", id: "loop" },
  { label: "for over a string", id: "py-for-string" },
  { label: "for over range()", id: "py-for-range" },
  { label: "for over a tuple", id: "py-for-tuple" },
  { label: "for over a dict", id: "py-for-dict" },
  { label: "for over a set", id: "py-for-set" },
  { label: "for over a generator", id: "py-for-generator" },
  { label: "while loop", id: "while" },
  { label: "Conditional: if / else", id: "if-else" },
  { label: "Conditional: elif chain", id: "elif" },
  { label: "Short-circuit and / or", id: "and-or" },
  { label: "and, not, skipping", id: "py-id-check" },
  { label: "Function: returns vs prints", id: "len" },
  { label: "Method that mutates a list", id: "lists" },
  { label: "Nested call: print(len(...))", id: "py-nested-call" },
  { label: "User-defined function", id: "py-add-function" },
  { label: "Call stack", id: "py-call-stack" },
  { label: "Function in the playground", id: "function" },
];

function Showcase() {
  const { w } = Route.useSearch();
  const navigate = useNavigate();
  const catalog = useMemo(() => walkthroughCatalog().map((entry) => ({ ...entry, problems: validateWalkthrough(entry.walkthrough) })), []);
  const current = catalog.find((e) => e.walkthrough.id === w) ?? catalog.find((e) => e.walkthrough.id === FEATURED[0]!.id)!;
  const choose = (id: string) => void navigate({ to: "/dev/visualizations", search: { w: id } });

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-5">
      <header className="mb-6">
        <p className="inline-flex items-center gap-1.5 rounded-full bg-sun/25 px-3 py-1 text-xs font-bold">
          <Wrench className="h-3.5 w-3.5" aria-hidden /> Developer page, not part of the courses
        </p>
        <h1 className="mt-3 text-3xl font-extrabold">Visualization showcase</h1>
        <p className="mt-2 max-w-[70ch] text-muted-foreground">
          Every walkthrough in Glowcode, played by the same engine students use. Step through each one to check that the code,
          the diagram and the printed output stay in sync, and that Previous and Reset restore exactly the same picture.
        </p>
      </header>

      <nav aria-label="Featured behaviors" className="mb-5 flex flex-wrap gap-2">
        {FEATURED.filter((f) => catalog.some((e) => e.walkthrough.id === f.id)).map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => choose(f.id)}
            aria-pressed={current.walkthrough.id === f.id}
            className={`rounded-full border-2 px-3 py-1.5 text-sm font-semibold transition-colors ${
              current.walkthrough.id === f.id ? "border-primary bg-primary-button text-primary-foreground" : "bg-card hover:border-primary"
            }`}
          >
            {f.label}
          </button>
        ))}
      </nav>

      <p className="mb-3 text-sm text-muted-foreground">
        <span className="font-mono font-bold text-foreground">{current.walkthrough.id}</span> · used in {current.usedIn.join(", ")}
      </p>
      <WalkthroughPlayer key={current.walkthrough.id} walkthrough={current.walkthrough} />

      <section className="mt-12" aria-labelledby="all-title">
        <h2 id="all-title" className="text-2xl font-extrabold">
          All walkthroughs ({catalog.length})
        </h2>
        <div className="mt-4 overflow-x-auto rounded-3xl border-2 bg-card">
          <table className="w-full min-w-[44rem] text-left text-sm">
            <thead className="border-b-2 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-2">Walkthrough</th>
                <th className="px-4 py-2">Views</th>
                <th className="px-4 py-2">Events</th>
                <th className="px-4 py-2">Predictions</th>
                <th className="px-4 py-2">Used in</th>
                <th className="px-4 py-2">Data check</th>
              </tr>
            </thead>
            <tbody>
              {catalog.map(({ walkthrough: wt, usedIn, problems }) => (
                <tr key={wt.id} className="border-b last:border-0" aria-current={wt.id === current.walkthrough.id || undefined}>
                  <td className="px-4 py-2">
                    <button type="button" className="text-left font-semibold hover:text-primary hover:underline" onClick={() => choose(wt.id)}>
                      {wt.title}
                    </button>
                    <div className="font-mono text-xs text-muted-foreground">{wt.id}</div>
                  </td>
                  <td className="px-4 py-2">{wt.visualizations.map((k) => visualizationLabels[k]).join(", ") || "Code and output only"}</td>
                  <td className="px-4 py-2">{wt.steps.length}</td>
                  <td className="px-4 py-2">{wt.steps.filter((s) => s.checkpoint).length}</td>
                  <td className="px-4 py-2 text-muted-foreground">{usedIn.join(", ")}</td>
                  <td className="px-4 py-2">
                    {problems.length ? (
                      <span className="inline-flex items-center gap-1 font-semibold text-coral-ink" title={problems.join("\n")}>
                        <TriangleAlert className="h-4 w-4" aria-hidden /> {problems.length} problem{problems.length === 1 ? "" : "s"}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-semibold text-teal-ink">
                        <CircleCheck className="h-4 w-4" aria-hidden /> Valid
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          The data check runs the same validator as the tests. Whether each step matches real Python is checked by{" "}
          <code className="inline-code">bun run check:python</code>.
        </p>
      </section>
    </div>
  );
}
