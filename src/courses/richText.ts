import type { RichText } from "./types";

/**
 * The inline markup lesson text supports, kept deliberately tiny:
 *   `code`                         -> inline code
 *   **bold**                       -> emphasis
 *   [label](ref:reference.id)      -> reference link (label may itself be `code`)
 */
export type Inline =
  | { kind: "text"; text: string }
  | { kind: "code"; text: string }
  | { kind: "bold"; text: string }
  | { kind: "ref"; id: string; label: string; code: boolean };

const TOKEN = /\[([^\]]+)\]\(ref:([a-z0-9._-]+)\)|`([^`]+)`|\*\*(.+?)\*\*/gi;

export function parseRichText(text: RichText): Inline[] {
  const out: Inline[] = [];
  let last = 0;
  for (const m of text.matchAll(TOKEN)) {
    const at = m.index ?? 0;
    if (at > last) out.push({ kind: "text", text: text.slice(last, at) });
    const [, refLabel, refId, code, bold] = m;
    if (refLabel !== undefined && refId !== undefined) {
      const isCode = refLabel.startsWith("`") && refLabel.endsWith("`") && refLabel.length > 2;
      out.push({ kind: "ref", id: refId, label: isCode ? refLabel.slice(1, -1) : refLabel, code: isCode });
    } else if (code !== undefined) {
      out.push({ kind: "code", text: code });
    } else if (bold !== undefined) {
      out.push({ kind: "bold", text: bold });
    }
    last = at + m[0].length;
  }
  if (last < text.length) out.push({ kind: "text", text: text.slice(last) });
  return out;
}

/** Every reference id mentioned inline, for validation. */
export function referencesIn(text: RichText): string[] {
  return parseRichText(text).flatMap((i) => (i.kind === "ref" ? [i.id] : []));
}
