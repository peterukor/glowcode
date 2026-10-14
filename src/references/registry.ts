/**
 * The reference registry: every manual entry, looked up by stable id.
 *
 * ID convention: <scope>.<group>.<name>, e.g.
 *   concept.variable  ·  python.builtins.print  ·  python.types.str.upper
 * Methods live under their type (python.types.list.append), matching the manual's tree.
 *
 * Plain data and pure functions only (no React), so lessons, the manual pages and a
 * future code editor can all use it.
 */
import { conceptEntries } from "./entries/concepts";
import { pythonEntries } from "./entries/python";
import type { ReferenceCategory, ReferenceEntry, ReferenceScope } from "./types";

export type { ReferenceCategory, ReferenceEntry, ReferenceScope } from "./types";

/** Reference ids are plain strings; `validateReferences()` and the content tests catch unknown ones. */
export type ReferenceId = string;

const entries: readonly ReferenceEntry[] = [...conceptEntries, ...pythonEntries];
const byId = new Map<string, ReferenceEntry>(entries.map((e) => [e.id, e]));

export const allReferences: readonly ReferenceEntry[] = entries;

export function getReference(id: string): ReferenceEntry | undefined {
  return byId.get(id);
}

/** Where an entry's full page lives. */
export const referencePath = (id: string) => `/reference/${encodeURIComponent(id)}`;

/** The methods that belong to a type, in authored order. */
export function methodsOf(typeId: string): ReferenceEntry[] {
  return entries.filter((e) => e.parent === typeId);
}

// ----------------------------------------------------------------- navigation tree

export const SCOPE_TITLES: Record<ReferenceScope, string> = {
  concept: "Programming Concepts",
  python: "Python",
  java: "Java",
};

export const CATEGORY_TITLES: Record<ReferenceCategory, string> = {
  concept: "Concepts",
  "data-type": "Data Types",
  "built-in": "Built-in Functions",
  method: "Methods",
  keyword: "Control Flow",
  operator: "Operators",
  error: "Errors",
};

/** Order of groups inside a language. Methods aren't a group: they sit under their type. */
const CATEGORY_ORDER: ReferenceCategory[] = ["concept", "data-type", "built-in", "keyword", "operator", "error"];
const SCOPE_ORDER: ReferenceScope[] = ["concept", "python", "java"];

export type ReferenceTreeItem = { entry: ReferenceEntry; children: ReferenceEntry[] };
export type ReferenceTreeGroup = { category: ReferenceCategory; title: string; items: ReferenceTreeItem[] };
export type ReferenceTreeSection = { scope: ReferenceScope; title: string; groups: ReferenceTreeGroup[] };

/**
 * The manual's navigation, derived from the entries: scope → category → entries, with
 * methods nested under their type. Adding an entry never means editing a menu.
 */
export function referenceTree(list: readonly ReferenceEntry[] = entries): ReferenceTreeSection[] {
  return SCOPE_ORDER.flatMap((scope) => {
    const inScope = list.filter((e) => e.scope === scope);
    const groups = CATEGORY_ORDER.flatMap((category) => {
      const items = inScope
        .filter((e) => e.category === category && !e.parent)
        .map((entry) => ({ entry, children: inScope.filter((c) => c.parent === entry.id) }));
      return items.length ? [{ category, title: scope === "concept" ? SCOPE_TITLES.concept : CATEGORY_TITLES[category], items }] : [];
    });
    return groups.length ? [{ scope, title: SCOPE_TITLES[scope], groups }] : [];
  });
}

/** Short label for navigation: methods show as `upper()` under their type. */
export const navTitle = (entry: ReferenceEntry) => (entry.parent ? entry.title.slice(entry.title.indexOf(".") + 1) : entry.title);

/** "Python › Data Types › str" for an entry's breadcrumb. */
export function breadcrumb(entry: ReferenceEntry): string[] {
  const parent = entry.parent ? getReference(entry.parent) : undefined;
  const top = SCOPE_TITLES[entry.scope];
  const group = CATEGORY_TITLES[(parent ?? entry).category];
  return entry.scope === "concept" ? [top] : parent ? [top, group, parent.title] : [top, group];
}
