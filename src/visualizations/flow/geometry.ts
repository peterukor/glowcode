/**
 * Small geometry helpers shared by the flowchart-style diagrams (the if-chain flow tree and
 * the loop flowcharts). Sizes are SVG user units, which match CSS pixels at 100% scale.
 */

export type Point = { x: number; y: number };
export type Box = { x: number; y: number; w: number; h: number };

/** Width of one character of JetBrains Mono at 14px, for sizing boxes around code. */
export const CHAR_W = 8.4;

/** An orthogonal polyline with rounded corners, as an SVG path. */
export function roundedPath(points: Point[], r = 12): string {
  const [first, ...rest] = points;
  if (!first) return "";
  let d = `M${first.x} ${first.y}`;
  for (let i = 0; i < rest.length; i++) {
    const prev = points[i]!;
    const cur = rest[i]!;
    const next = rest[i + 1];
    if (!next) {
      d += `L${cur.x} ${cur.y}`;
      break;
    }
    const inLen = Math.hypot(cur.x - prev.x, cur.y - prev.y);
    const outLen = Math.hypot(next.x - cur.x, next.y - cur.y);
    const rr = Math.min(r, inLen / 2, outLen / 2);
    const a = { x: cur.x - Math.sign(cur.x - prev.x) * rr, y: cur.y - Math.sign(cur.y - prev.y) * rr };
    const b = { x: cur.x + Math.sign(next.x - cur.x) * rr, y: cur.y + Math.sign(next.y - cur.y) * rr };
    d += `L${a.x} ${a.y}Q${cur.x} ${cur.y} ${b.x} ${b.y}`;
  }
  return d;
}

/**
 * A small filled arrowhead whose tip sits at the last point of `points`, pointing along the
 * last segment. Drawn as its own path (not an SVG marker) so it follows the line's colour
 * and glow transitions in every browser.
 */
export function arrowHead(points: Point[], size = 7): string {
  const tip = points.at(-1)!;
  const from = points.at(-2) ?? tip;
  const len = Math.hypot(tip.x - from.x, tip.y - from.y) || 1;
  const ux = (tip.x - from.x) / len;
  const uy = (tip.y - from.y) / len;
  const bx = tip.x - ux * size * 1.3;
  const by = tip.y - uy * size * 1.3;
  return `M${tip.x} ${tip.y}L${bx - uy * size * 0.75} ${by + ux * size * 0.75}L${bx + uy * size * 0.75} ${by - ux * size * 0.75}Z`;
}

/** The point halfway along an orthogonal polyline (for placing a label on it). */
export function midpoint(points: Point[]): Point {
  const segs = points.slice(1).map((p, i) => ({ a: points[i]!, b: p, len: Math.hypot(p.x - points[i]!.x, p.y - points[i]!.y) }));
  let left = segs.reduce((s, x) => s + x.len, 0) / 2;
  for (const { a, b, len } of segs) {
    if (left <= len) return { x: a.x + ((b.x - a.x) * left) / (len || 1), y: a.y + ((b.y - a.y) * left) / (len || 1) };
    left -= len;
  }
  return points.at(-1)!;
}
