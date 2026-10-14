/**
 * Turns an if / elif / else chain into positioned boxes and connector paths.
 * Pure geometry, no React: easy to test and to reuse for other flow-style views.
 *
 *   ┌if──────────────┐
 *   │ [A]      [B]   │      A and B feed into one operator node (the sketch)
 *   │    ╲    ╱      │
 *   │    (and)       │
 *   └───────┬────────┘
 *           ◯ ──True──▶ [ if block ]────┐
 *           │False                       │
 *   ┌elif───┴────────┐                   │
 *   │   ...          │                   │
 *           ...                          │
 *           ● ◀──────────────────────────┘   every path meets again
 *           │
 *   [ line after the chain ]
 */
import type { Condition, IfChain } from "@/types/conditional";
import { roundedPath, type Box, type Point } from "../flow/geometry";

// All sizes are SVG user units (≈ CSS px at 100% scale).
const CHAR_W = 8.4; // JetBrains Mono at 14px
const LEAF_H = 40;
const LEAF_PAD_X = 16;
const LEAF_ICON_W = 22; // reserved for the ✓ / ✗ mark so boxes never resize mid-animation
const OPERAND_GAP = 28;
const OP_W = 52;
const OP_H = 28;
const OP_GAP_Y = 46;
const CAPTION_CHAR_W = 6.4;
const GROUP_PAD = 20;
const GROUP_MIN_W = 190;
const TAB_H = 24;
const TAB_PAD_X = 12;
const TAB_INSET = 16;
const SPLIT_R = 12;
const SPLIT_GAP = 34;
const FALSE_LEN = 72;
const BODY_LINE_H = 22;
const BODY_PAD_Y = 12;
const BODY_PAD_X = 16;
const BODY_GAP_X = 96;
const BODY_GAP_Y = 20;
const RAIL_GAP = 24;
const MERGE_GAP = 44;
const AFTER_GAP = 40;
const MARGIN = 20;

export type { Box, Point };

export type FrameNode = { type: "frame"; key: string; keyword: "if" | "elif" | "else"; box: Box; tab: Box };

export type FlowNode =
  | { type: "comparison"; id: string; code: string; box: Box }
  | { type: "operator"; id: string; op: "and" | "or"; box: Box; caption?: Point & { text: string } }
  | FrameNode
  | { type: "split"; branch: string; center: Point; r: number }
  | { type: "block"; key: string; lines: string[]; box: Box }
  | { type: "merge"; center: Point }
  | { type: "after"; code: string; box: Box };

/** What an edge's look depends on; the renderer maps this to a visual state. */
export type EdgeSource =
  | { kind: "operand"; condition: string }
  | { kind: "result"; branch: string }
  | { kind: "true"; branch: string }
  | { kind: "false"; branch: string }
  | { kind: "exit"; block: string }
  | { kind: "after" };

export type FlowEdge = {
  id: string;
  d: string;
  source: EdgeSource;
  label?: Point & { text: "True" | "False" };
};

export type FlowLayout = { width: number; height: number; nodes: FlowNode[]; edges: FlowEdge[] };

// ---------------------------------------------------------------------------
// Condition trees (the inside of an if / elif frame)

type Laid = { w: number; h: number; out: Point; nodes: FlowNode[]; edges: FlowEdge[] };

const shiftBox = (b: Box, dx: number, dy: number): Box => ({ ...b, x: b.x + dx, y: b.y + dy });

function shiftNode(n: FlowNode, dx: number, dy: number): FlowNode {
  switch (n.type) {
    case "split":
    case "merge":
      return { ...n, center: { x: n.center.x + dx, y: n.center.y + dy } };
    case "frame":
      return { ...n, box: shiftBox(n.box, dx, dy), tab: shiftBox(n.tab, dx, dy) };
    case "operator":
      return {
        ...n,
        box: shiftBox(n.box, dx, dy),
        ...(n.caption && { caption: { ...n.caption, x: n.caption.x + dx, y: n.caption.y + dy } }),
      };
    default:
      return { ...n, box: shiftBox(n.box, dx, dy) };
  }
}

/** Translates an SVG path made only of absolute M/L/C/Q/H/V commands. */
function shiftPath(d: string, dx: number, dy: number): string {
  return d.replace(/([MLCQHV])([^MLCQHV]*)/g, (_, cmd: string, args: string) => {
    const nums = args.trim().split(/[\s,]+/).filter(Boolean).map(Number);
    if (cmd === "H") return `H${nums.map((n) => n + dx).join(" ")}`;
    if (cmd === "V") return `V${nums.map((n) => n + dy).join(" ")}`;
    return cmd + nums.map((n, i) => (i % 2 === 0 ? n + dx : n + dy)).join(" ");
  });
}

function shiftEdge(e: FlowEdge, dx: number, dy: number): FlowEdge {
  return {
    ...e,
    d: shiftPath(e.d, dx, dy),
    ...(e.label && { label: { ...e.label, x: e.label.x + dx, y: e.label.y + dy } }),
  };
}

function shiftLaid(l: Laid, dx: number, dy: number): Laid {
  return {
    ...l,
    out: { x: l.out.x + dx, y: l.out.y + dy },
    nodes: l.nodes.map((n) => shiftNode(n, dx, dy)),
    edges: l.edges.map((e) => shiftEdge(e, dx, dy)),
  };
}

export const OPERATOR_CAPTION = { and: "both must be True", or: "one True is enough" } as const;

function layoutCondition(condition: Condition, topLevel: boolean): Laid {
  if (condition.kind === "compare") {
    const w = condition.code.length * CHAR_W + LEAF_PAD_X * 2 + LEAF_ICON_W;
    return {
      w,
      h: LEAF_H,
      out: { x: w / 2, y: LEAF_H },
      nodes: [{ type: "comparison", id: condition.id, code: condition.code, box: { x: 0, y: 0, w, h: LEAF_H } }],
      edges: [],
    };
  }

  // Operands side by side, then curves down into one operator node.
  const children: Laid[] = [];
  let x = 0;
  for (const operand of condition.operands) {
    const child = layoutCondition(operand, false);
    children.push(shiftLaid(child, x, 0));
    x += child.w + OPERAND_GAP;
  }
  const rowW = Math.max(x - OPERAND_GAP, OP_W);
  const rowH = Math.max(...children.map((c) => c.h));
  const op: Box = { x: rowW / 2 - OP_W / 2, y: rowH + OP_GAP_Y, w: OP_W, h: OP_H };

  const edges: FlowEdge[] = children.flatMap((c) => c.edges);
  children.forEach((child, i) => {
    const operand = condition.operands[i]!;
    const endX = op.x + (OP_W * (i + 1)) / (children.length + 1);
    const midY = (child.out.y + op.y) / 2;
    edges.push({
      id: `operand-${operand.id}`,
      d: `M${child.out.x} ${child.out.y}C${child.out.x} ${midY} ${endX} ${midY} ${endX} ${op.y}`,
      source: { kind: "operand", condition: operand.id },
    });
  });

  const text = OPERATOR_CAPTION[condition.op];
  const caption = topLevel ? { x: op.x + OP_W + 12, y: op.y + OP_H / 2, text } : undefined;
  const w = caption ? Math.max(rowW, caption.x + text.length * CAPTION_CHAR_W) : rowW;

  return {
    w,
    h: op.y + OP_H,
    out: { x: op.x + OP_W / 2, y: op.y + OP_H },
    nodes: [
      ...children.flatMap((c) => c.nodes),
      { type: "operator", id: condition.id, op: condition.op, box: op, ...(caption && { caption }) },
    ],
    edges,
  };
}

// ---------------------------------------------------------------------------
// Helpers for the outer flow

const tabWidth = (keyword: string) => keyword.length * CHAR_W + TAB_PAD_X * 2;

function blockSize(lines: string[]) {
  const longest = Math.max(...lines.map((l) => l.length), 4);
  return { w: longest * CHAR_W + BODY_PAD_X * 2, h: lines.length * BODY_LINE_H + BODY_PAD_Y * 2 };
}

/** A keyword frame (if / elif / else) wrapping some content, centered on `centerX`. */
function frameAround(key: string, keyword: "if" | "elif" | "else", content: Laid, centerX: number, top: number) {
  // Center the content's output point so the line leaving the frame is straight.
  const half = Math.max(content.out.x, content.w - content.out.x) + GROUP_PAD;
  const w = Math.max(half * 2, GROUP_MIN_W, tabWidth(keyword) + TAB_INSET * 2);
  const frameTop = top + TAB_H;
  const box: Box = { x: centerX - w / 2, y: frameTop, w, h: content.h + GROUP_PAD * 2 };
  const placed = shiftLaid(content, centerX - content.out.x, frameTop + GROUP_PAD);
  const tab: Box = { x: box.x + TAB_INSET, y: top, w: tabWidth(keyword), h: TAB_H };
  const frame: FrameNode = { type: "frame", key, keyword, box, tab };
  return { frame, placed, bottom: box.y + box.h, width: w };
}

// ---------------------------------------------------------------------------

export function layoutIfChain(chain: IfChain): FlowLayout {
  const nodes: FlowNode[] = [];
  const edges: FlowEdge[] = [];

  // Pass 1: lay out each condition so we know how wide the left column must be.
  const conditions = chain.branches.map((b) => layoutCondition(b.condition, true));
  const elseSize = chain.elseBody ? blockSize(chain.elseBody) : undefined;
  const halfWidths = [
    ...conditions.map((c) => Math.max(c.out.x, c.w - c.out.x) + GROUP_PAD),
    ...chain.branches.map((b) => tabWidth(b.keyword) / 2 + TAB_INSET),
    elseSize ? elseSize.w / 2 + GROUP_PAD : 0,
    GROUP_MIN_W / 2,
  ];
  const colHalf = Math.max(...halfWidths);
  const cx = MARGIN + colHalf;
  const blocksX = cx + colHalf + BODY_GAP_X;

  // Pass 2: stack the decisions top to bottom; their blocks go in the right column.
  let cursor = MARGIN;
  let lastBlockBottom = -Infinity;
  let incoming: { from: Point; branch: string } | undefined;
  const blockExits: { key: string; box: Box }[] = [];

  chain.branches.forEach((branch, i) => {
    const content = conditions[i]!;
    const size = blockSize(branch.body);

    // Push this row down if its block would collide with the previous one.
    const provisional = frameAround(branch.id, branch.keyword, content, cx, cursor);
    const splitY0 = provisional.bottom + SPLIT_GAP;
    const overlap = lastBlockBottom + BODY_GAP_Y - (splitY0 - size.h / 2);
    if (overlap > 0) cursor += overlap;

    const { frame, placed, bottom } = frameAround(branch.id, branch.keyword, content, cx, cursor);
    nodes.push(frame, ...placed.nodes);
    edges.push(...placed.edges);

    if (incoming) {
      edges.push({
        id: `false-${incoming.branch}`,
        d: roundedPath([incoming.from, { x: cx, y: frame.box.y }]),
        source: { kind: "false", branch: incoming.branch },
        label: { x: cx, y: (incoming.from.y + cursor + TAB_H) / 2, text: "False" },
      });
    }

    const split = { x: cx, y: bottom + SPLIT_GAP };
    nodes.push({ type: "split", branch: branch.id, center: split, r: SPLIT_R });
    edges.push({
      id: `result-${branch.id}`,
      d: `M${placed.out.x} ${placed.out.y}L${split.x} ${split.y - SPLIT_R}`,
      source: { kind: "result", branch: branch.id },
    });

    const block: Box = { x: blocksX, y: split.y - size.h / 2, ...size };
    nodes.push({ type: "block", key: branch.id, lines: branch.body, box: block });
    edges.push({
      id: `true-${branch.id}`,
      d: `M${split.x + SPLIT_R} ${split.y}L${block.x} ${split.y}`,
      source: { kind: "true", branch: branch.id },
      label: { x: (split.x + SPLIT_R + block.x) / 2, y: split.y, text: "True" },
    });
    blockExits.push({ key: branch.id, box: block });
    lastBlockBottom = block.y + block.h;

    incoming = { from: { x: cx, y: split.y + SPLIT_R }, branch: branch.id };
    cursor = split.y + SPLIT_R + FALSE_LEN;
  });

  // The else frame (or nothing) at the bottom of the left column.
  let leftBottom: Point;
  if (chain.elseBody && elseSize) {
    const inner: Laid = {
      w: elseSize.w,
      h: elseSize.h,
      out: { x: elseSize.w / 2, y: elseSize.h },
      nodes: [{ type: "block", key: "else", lines: chain.elseBody, box: { x: 0, y: 0, ...elseSize } }],
      edges: [],
    };
    const { frame, placed, bottom } = frameAround("else", "else", inner, cx, cursor);
    nodes.push(frame, ...placed.nodes);
    if (incoming) {
      edges.push({
        id: `false-${incoming.branch}`,
        d: roundedPath([incoming.from, { x: cx, y: cursor + TAB_H }]),
        source: { kind: "false", branch: incoming.branch },
        label: { x: cx, y: (incoming.from.y + cursor + TAB_H) / 2, text: "False" },
      });
    }
    leftBottom = { x: cx, y: bottom };
    blockExits.push({ key: "else", box: frame.box });
  } else {
    // No else: a False result skips straight to where the paths meet.
    leftBottom = incoming ? incoming.from : { x: cx, y: cursor };
  }

  // Where every path meets again.
  const mergeY = Math.max(leftBottom.y + MERGE_GAP, lastBlockBottom + MERGE_GAP);
  const merge = { x: cx, y: mergeY };
  const railX = Math.max(...blockExits.filter((b) => b.key !== "else").map((b) => b.box.x + b.box.w)) + RAIL_GAP;

  for (const exit of blockExits) {
    if (exit.key === "else") {
      edges.push({ id: "exit-else", d: roundedPath([leftBottom, merge]), source: { kind: "exit", block: "else" } });
    } else {
      const y = exit.box.y + exit.box.h / 2;
      edges.push({
        id: `exit-${exit.key}`,
        d: roundedPath([{ x: exit.box.x + exit.box.w, y }, { x: railX, y }, { x: railX, y: mergeY }, merge]),
        source: { kind: "exit", block: exit.key },
      });
    }
  }
  if (!chain.elseBody && incoming) {
    edges.push({
      id: `false-${incoming.branch}`,
      d: roundedPath([incoming.from, merge]),
      source: { kind: "false", branch: incoming.branch },
      label: { x: cx, y: (incoming.from.y + mergeY) / 2, text: "False" },
    });
  }
  nodes.push({ type: "merge", center: merge });

  const afterCode = chain.after ?? "# done";
  const afterSize = blockSize([afterCode]);
  const after: Box = { x: cx - afterSize.w / 2, y: mergeY + AFTER_GAP, ...afterSize };
  nodes.push({ type: "after", code: afterCode, box: after });
  edges.push({ id: "after", d: `M${cx} ${mergeY}L${cx} ${after.y}`, source: { kind: "after" } });

  const right = Math.max(railX, after.x + after.w, ...nodes.map((n) => ("box" in n ? n.box.x + n.box.w : 0)));
  return { width: right + MARGIN, height: after.y + after.h + MARGIN, nodes, edges };
}
