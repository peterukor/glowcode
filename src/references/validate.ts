import { referencesIn } from "@/courses/richText";
import { validateWalkthrough } from "@/walkthrough/validate";
import type { ReferenceCategory, ReferenceEntry, ReferenceScope } from "./types";

const SCOPES: ReferenceScope[] = ["concept", "python", "java"];
const CATEGORIES: ReferenceCategory[] = ["concept", "data-type", "built-in", "method", "keyword", "operator", "error"];
const CALLABLE: ReferenceCategory[] = ["built-in", "method"];

/**
 * Checks the reference entries for mistakes students would hit: duplicate or malformed ids,
 * methods not attached to their type, broken related links and inline links, callables that
 * don't say what they return / print / change, and walkthroughs that don't match their example.
 * Run by the test suite. Example output is checked against real Python by `check:python`.
 */
export function validateReferences(entries: readonly ReferenceEntry[]): string[] {
  const problems: string[] = [];
  const ids = new Map<string, ReferenceEntry>();
  for (const e of entries) {
    if (ids.has(e.id)) problems.push(`Duplicate reference id "${e.id}"`);
    ids.set(e.id, e);
  }

  for (const e of entries) {
    const say = (msg: string) => problems.push(`${e.id}: ${msg}`);
    if (!SCOPES.includes(e.scope)) say(`unknown scope "${e.scope}"`);
    if (!CATEGORIES.includes(e.category)) say(`unknown category "${e.category}"`);
    if (!e.id.startsWith(`${e.scope}.`) || !/^[a-z]+(\.[A-Za-z0-9_-]+)+$/.test(e.id)) {
      say(`id must look like ${e.scope}.<group>.<name>`);
    }
    if (!e.summary.trim() || e.summary.length > 220) say("summary must be one or two short sentences");
    // Summaries appear inside links (search results, related cards, popups), so no links in them.
    if (referencesIn(e.summary).length) say("summary can't contain reference links");
    if (!e.explanation.length) say("needs an explanation");

    if (e.category === "method") {
      const parent = e.parent ? ids.get(e.parent) : undefined;
      if (!parent) say(`method needs a parent type that exists (got "${e.parent ?? ""}")`);
      else if (parent.category !== "data-type" || parent.scope !== e.scope) say(`parent "${parent.id}" must be a ${e.scope} data type`);
      else if (!e.id.startsWith(`${parent.id}.`)) say(`method ids live under their type: ${parent.id}.<name>`);
    } else if (e.parent) {
      say("only methods have a parent");
    }

    if (CALLABLE.includes(e.category) && (e.returns === undefined || e.prints === undefined || e.changes === undefined)) {
      say("functions and methods must say what they return, print and change");
    }

    const related = e.related ?? [];
    if (new Set(related).size !== related.length) say("related lists an entry twice");
    for (const r of related) {
      if (r === e.id) say("relates to itself");
      else if (!ids.has(r)) say(`related entry "${r}" doesn't exist`);
    }

    const texts = [
      ...e.explanation,
      e.accepts,
      e.returns,
      e.prints,
      e.changes,
      ...(e.parameters ?? []).map((p) => p.description),
      ...(e.examples ?? []).map((x) => x.caption),
      ...(e.mistakes ?? []).flatMap((m) => [m.title, m.explanation]),
    ].filter((t): t is string => !!t);
    for (const id of texts.flatMap(referencesIn)) if (!ids.has(id)) say(`links to unknown reference "${id}"`);

    for (const x of e.examples ?? []) {
      if (x.walkthrough) {
        if (x.walkthrough.code !== x.code) say(`example walkthrough "${x.walkthrough.id}" shows different code than the example`);
        problems.push(...validateWalkthrough(x.walkthrough).map((p) => `${e.id}: ${p}`));
      }
    }
    for (const m of e.mistakes ?? []) {
      if (m.code && !m.error && !m.output && !m.neverEnds) say(`mistake "${m.title}" shows code but not what happens`);
    }
  }
  return problems;
}
