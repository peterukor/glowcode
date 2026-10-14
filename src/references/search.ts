/**
 * Local, ranked search over reference entries. No index server, no dependency: the
 * manual is small enough to score every entry on each keystroke.
 *
 * Every word of the query must match somewhere in an entry (its title, aliases, keywords,
 * summary, or for methods its type's name), so "string uppercase" finds str.upper() and
 * "list add item" finds list.append(). Matches in the title rank highest, then aliases,
 * then keywords, then the summary.
 */
import { allReferences, getReference } from "./registry";
import type { ReferenceEntry } from "./types";

export type SearchResult = { entry: ReferenceEntry; score: number };

const normalize = (text: string) =>
  text
    .toLowerCase()
    .replace(/[()[\]{}'"`,:;!?]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** "strings" and "string" should match each other; so should "items" and "item". */
const stem = (word: string) => (word.length > 3 && word.endsWith("s") && !word.endsWith("ss") ? word.slice(0, -1) : word);
const words = (text: string) => normalize(text).split(" ").filter(Boolean).map(stem);

type Field = { text: string; weight: number };

function fieldsOf(entry: ReferenceEntry): Field[] {
  const parent = entry.parent ? getReference(entry.parent) : undefined;
  return [
    { text: entry.title, weight: 10 },
    // For methods, "upper" alone and the type's names ("string") count as title words.
    ...(parent ? [parent.title, ...(parent.aliases ?? [])].map((t) => ({ text: t, weight: 6 })) : []),
    ...(entry.aliases ?? []).map((t) => ({ text: t, weight: 8 })),
    ...(entry.keywords ?? []).map((t) => ({ text: t, weight: 5 })),
    { text: entry.summary, weight: 1 },
  ];
}

/** How well one query word matches one field: whole word beats prefix beats substring. */
function wordScore(word: string, fieldWords: string[]): number {
  if (fieldWords.includes(word)) return 3;
  if (fieldWords.some((w) => w.startsWith(word))) return 2;
  if (word.length >= 3 && fieldWords.some((w) => w.includes(word))) return 1;
  return 0;
}

export function scoreEntry(entry: ReferenceEntry, query: string): number {
  const q = normalize(query);
  const qWords = words(query);
  if (!qWords.length) return 0;
  const fields = fieldsOf(entry).map((f) => ({ ...f, norm: normalize(f.text), words: words(f.text) }));

  let total = 0;
  for (const word of qWords) {
    const best = Math.max(...fields.map((f) => wordScore(word, f.words) * f.weight));
    if (best === 0) return 0; // every word has to match somewhere
    total += best;
  }
  // Bonus for an exact or leading match on the whole query ("print" → print(), "not defined" → NameError).
  for (const f of fields) {
    if (f.weight < 5) continue;
    if (f.norm === q) total += 40 * f.weight;
    else if (f.norm.startsWith(q)) total += 6 * f.weight;
    else if (qWords.length > 1 && f.norm.includes(q)) total += 4 * f.weight;
  }
  return total;
}

/** Entries matching the query, best first. Ties keep the manual's order. */
export function searchReferences(query: string, entries: readonly ReferenceEntry[] = allReferences, limit = 20): SearchResult[] {
  return entries
    .map((entry, index) => ({ entry, index, score: scoreEntry(entry, query) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, limit)
    .map(({ entry, score }) => ({ entry, score }));
}
