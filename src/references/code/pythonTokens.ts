/**
 * A small line-by-line Python tokenizer for short, read-only beginner snippets. It's used
 * for syntax colouring and for spotting reference links safely. It is not a full Python
 * lexer: triple-quoted strings that span lines aren't recognised (snippets don't use them).
 */
export type TokenKind = "comment" | "string" | "number" | "name" | "op" | "space";
export type Token = { text: string; kind: TokenKind; start: number };

const PATTERN =
  /(#.*$)|((?:[rRbBuUfF]{1,2})?(?:"(?:\\.|[^"\\])*"?|'(?:\\.|[^'\\])*'?))|(\d+(?:\.\d+)?)|([A-Za-z_]\w*)|(\s+)|(==|!=|<=|>=|:=|\*\*=?|\/\/=?|[+\-*/%]=|->|[^\s\w])/gy;

export function tokenizeLine(line: string): Token[] {
  const tokens: Token[] = [];
  PATTERN.lastIndex = 0;
  let m: RegExpExecArray | null;
  while (PATTERN.lastIndex < line.length && (m = PATTERN.exec(line))) {
    const [text, comment, str, num, name] = m;
    const kind: TokenKind = comment ? "comment" : str ? "string" : num ? "number" : name ? "name" : /^\s+$/.test(text) ? "space" : "op";
    tokens.push({ text, kind, start: m.index });
  }
  return tokens;
}

/** Tokens that matter for meaning: no spaces, no comments. */
export const significant = (tokens: Token[]) => tokens.filter((t) => t.kind !== "space" && t.kind !== "comment");
