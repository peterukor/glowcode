import { CornerDownLeft, Keyboard, Printer, Shuffle, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { CodeView } from "@/components/CodeView";
import { CodeExample } from "@/components/lesson/CodeExample";
import { RichTextView } from "@/components/lesson/RichTextView";
import type { CodeBlock } from "@/courses/types";
import { useReferenceNavigation } from "@/references/navigation";
import { breadcrumb, CATEGORY_TITLES, getReference, methodsOf, navTitle } from "@/references/registry";
import type { ReferenceEntry, ReferenceExample, ReferenceMistake } from "@/references/types";
import { FunctionView } from "@/visualizations/FunctionView";

const CALLABLE = new Set(["built-in", "method"]);

/**
 * A full manual page. Sections follow the questions a student asks, in order: what is it,
 * how do I write it, what does it take, what happens (returns / prints / changes), examples,
 * common mistakes, then where to go next. Sections without content are left out.
 * No router dependency: links come from the reference navigation context.
 */
export function ReferenceEntryView({ entry }: { entry: ReferenceEntry }) {
  const callable = CALLABLE.has(entry.category);
  const methods = methodsOf(entry.id);
  const related = (entry.related ?? []).flatMap((id) => getReference(id) ?? []);
  const parent = entry.parent ? getReference(entry.parent) : undefined;

  return (
    <article className="reference-entry" aria-labelledby="reference-title">
      <header>
        <nav aria-label="Where this entry sits" className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          {breadcrumb(entry).map((part, i) => (
            <span key={i}>
              {i > 0 && <span aria-hidden> › </span>}
              {parent && part === parent.title ? <EntryLink id={parent.id}>{part}</EntryLink> : part}
            </span>
          ))}
        </nav>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 id="reference-title" className={`text-3xl font-extrabold md:text-4xl ${entry.scope === "concept" ? "" : "font-mono"}`}>
            {entry.title}
          </h1>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-grape-ink">
            {entry.category === "method" && parent ? `${parent.title} method` : categoryLabel(entry)}
          </span>
        </div>
        <p className="mt-3 text-lg text-muted-foreground">
          <RichTextView text={entry.summary} />
        </p>
      </header>

      <Section title="What it is">
        {entry.explanation.map((p, i) => (
          <p key={i}>
            <RichTextView text={p} />
          </p>
        ))}
      </Section>

      {entry.syntax && (
        <Section title="How to write it">
          <CodeView code={entry.syntax} label="Syntax" className="py-3" />
        </Section>
      )}

      {(entry.parameters?.length || entry.accepts) && (
        <Section title="What it takes">
          {entry.parameters && (
            <dl className="space-y-3">
              {entry.parameters.map((p) => (
                <div key={p.name} className="rounded-2xl border-2 bg-card px-4 py-3">
                  <dt className="flex items-center gap-2">
                    <code className="inline-code font-bold">{p.name}</code>
                    {p.optional && <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-bold text-muted-foreground">optional</span>}
                  </dt>
                  <dd className="mt-1 text-sm">
                    <RichTextView text={p.description} />
                  </dd>
                </div>
              ))}
            </dl>
          )}
          {entry.accepts && (
            <p className="mt-3">
              <RichTextView text={entry.accepts} />
            </p>
          )}
        </Section>
      )}

      {callable && (
        <Section title="What happens when you call it">
          <p className="text-sm text-muted-foreground">These are three different things. A call can do any mix of them.</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <Outcome kind="returns" icon={<CornerDownLeft className="h-4 w-4" />} title="Gives back" hint="its return value" text={entry.returns} />
            <Outcome kind="prints" icon={<Printer className="h-4 w-4" />} title="Prints" hint="on the screen" text={entry.prints} />
            <Outcome kind="changes" icon={<Shuffle className="h-4 w-4" />} title="Changes" hint="objects you gave it" text={entry.changes} />
          </div>
        </Section>
      )}

      {entry.examples?.length ? (
        <Section title={entry.examples.length === 1 ? "Example" : "Examples"}>
          {entry.examples.map((x, i) => (
            <Example key={i} example={x} language={entry.scope === "java" ? "java" : "python"} />
          ))}
        </Section>
      ) : null}

      {entry.mistakes?.length ? (
        <Section title="Common mistakes">
          <div className="space-y-4">
            {entry.mistakes.map((m, i) => (
              <Mistake key={i} mistake={m} />
            ))}
          </div>
        </Section>
      ) : null}

      {methods.length > 0 && (
        <Section title={`Methods of ${entry.title}`}>
          <EntryList entries={methods} />
        </Section>
      )}

      {related.length > 0 && (
        <Section title="Related">
          <EntryList entries={related} />
        </Section>
      )}
    </article>
  );
}

function categoryLabel(entry: ReferenceEntry) {
  if (entry.scope === "concept") return "Programming concept";
  const label = CATEGORY_TITLES[entry.category];
  return label.endsWith("s") ? label.slice(0, -1) : label; // "Built-in Functions" → "Built-in Function"
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="reference-section">
      <h2 className="text-xl font-extrabold">{title}</h2>
      <div className="lesson-prose mt-3">{children}</div>
    </section>
  );
}

function Outcome({ kind, icon, title, hint, text }: { kind: string; icon: ReactNode; title: string; hint: string; text?: string }) {
  return (
    <div className={`outcome outcome-${kind} rounded-2xl border-2 p-4`} role="group" aria-label={title}>
      <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide">
        <span aria-hidden>{icon}</span> {title}
      </p>
      <p className="text-[11px] opacity-75">{hint}</p>
      <p className="mt-2 text-sm">
        <RichTextView text={text ?? "Nothing."} />
      </p>
    </div>
  );
}

function Example({ example, language }: { example: ReferenceExample; language: "python" | "java" }) {
  const block: CodeBlock = {
    type: "code",
    language,
    code: example.code,
    output: example.output?.length ? example.output : undefined,
    caption: example.caption,
    walkthrough: example.walkthrough,
  };
  return (
    <div className="reference-example">
      {example.input && (
        <p className="-mb-4 mt-6 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
          <Keyboard className="h-3.5 w-3.5" aria-hidden /> When the user types: {example.input.map((t) => `"${t}"`).join(", ")}
        </p>
      )}
      {/* Manual examples don't count as lesson activity. */}
      <CodeExample block={block} onActivity={() => {}} />
      {example.call && (
        <figure className="-mt-3 mb-7 rounded-3xl border-2 bg-card p-5">
          <FunctionView call={example.call} />
          <figcaption className="mt-3 text-center text-xs text-muted-foreground">
            What goes in, and what comes out. Returned values, printed text and changes are kept apart.
          </figcaption>
        </figure>
      )}
    </div>
  );
}

function Mistake({ mistake }: { mistake: ReferenceMistake }) {
  return (
    <div className="mistake rounded-3xl border-2 border-coral/30 bg-coral/5 p-4">
      <p className="flex items-start gap-2 font-bold">
        <TriangleAlert className="mt-1 h-4 w-4 shrink-0 text-coral" aria-hidden />
        <RichTextView text={mistake.title} />
      </p>
      {mistake.code && <CodeView code={mistake.code} label="Code with the mistake" className="mt-3 py-3" />}
      {mistake.error && (
        <div className="mt-2 rounded-2xl border-2 border-coral/40 bg-card px-4 py-2" role="group" aria-label="What Python prints">
          <p className="text-xs font-bold uppercase tracking-wide text-coral-ink">What Python prints</p>
          <pre className="whitespace-pre-wrap font-mono text-sm">{mistake.error}</pre>
        </div>
      )}
      {mistake.output && (
        <div className="mt-2 rounded-2xl border-2 bg-card px-4 py-2" role="group" aria-label="What it prints">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">What it prints</p>
          <pre className="whitespace-pre-wrap font-mono text-sm">{mistake.output.length ? mistake.output.join("\n") : "(nothing)"}</pre>
        </div>
      )}
      {mistake.neverEnds && <p className="mt-2 text-sm font-semibold text-coral-ink">This program never finishes.</p>}
      <p className="mt-2">
        <RichTextView text={mistake.explanation} />
      </p>
    </div>
  );
}

/** A link to another entry's page. Uses the navigation context, so it works with or without a router. */
export function EntryLink({
  id,
  children,
  className,
  current,
  onNavigate,
}: {
  id: string;
  children: ReactNode;
  className?: string;
  current?: boolean;
  onNavigate?: () => void;
}) {
  const nav = useReferenceNavigation();
  return (
    <a
      href={nav.hrefFor(id)}
      aria-current={current ? "page" : undefined}
      className={className ?? "underline decoration-dotted underline-offset-4 hover:text-foreground"}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        if (nav.open?.(id)) e.preventDefault();
        onNavigate?.();
      }}
    >
      {children}
    </a>
  );
}

export function EntryList({ entries }: { entries: ReferenceEntry[] }) {
  return (
    <ul className="entry-list grid gap-2 sm:grid-cols-2">
      {entries.map((e) => (
        <li key={e.id} className="!mt-0">
          <EntryLink id={e.id} className="block h-full rounded-2xl border-2 bg-card px-4 py-3 transition-colors hover:border-primary">
            <span className={`font-bold ${e.scope === "concept" ? "" : "font-mono"}`}>{e.parent ? e.title : navTitle(e)}</span>
            <span className="mt-0.5 block text-sm text-muted-foreground">
              <RichTextView text={e.summary} />
            </span>
          </EntryLink>
        </li>
      ))}
    </ul>
  );
}
