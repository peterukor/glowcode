/**
 * Geometry for loop flowcharts (`for` and `while`), drawn with the same parts as the
 * if-chain flow tree: boxes, a decision, routed connectors with rounded corners and pills.
 *
 *            header (the iterable, or setup lines)
 *                 │
 *          ◇ question ◇ ───No───┐
 *                 │ Yes          │
 *          [ loop variable ]     │      (for loops only)
 *     ┌──▶        │              │
 *     │    ┌body──┴───────┐      │
 *     │    │ [ line 1 ]   │      │
 *     │    │ [ line 2 ]   │      │
 *     │    └──────┬───────┘      │
 *     └───────────┘              │
 *              [ after ] ◀───────┘
 *
 * Pure geometry, no React, so it can be tested and reused.
 */
import { CHAR_W, arrowHead, roundedPath, type Box, type Point } from "../flow/geometry";

const PAD = 14;
const LANE_L = 46; // room left of the column for the loop-back line
const LANE_R = 58; // room right of the column for the exit line and its pill
const BOX_H = 40;
const BOX_PAD_X = 16;
const TARGET_H = 54;
const DECISION_H = 92;
const FEED = 58;
const YES = 44;
const LINK = 24;
const BODY_GAP = 16;
const FRAME_PAD = 14;
const TAB_H = 22;
const SETUP_GAP = 22;
const BACK_DROP = 22;
const AFTER_GAP = 30;
const MIN_COL = 168;

export type LoopEdgeId = "feed" | "yes" | "into-body" | "back" | "exit" | `body-${number}` | `setup-${number}`;

export type LoopEdge = {
  id: LoopEdgeId;
  d: string;
  /** Arrowhead at the end of the line, so direction never depends on colour or motion. */
  arrow: string;
  label?: Point & { text: string };
};

export type LoopLayout = {
  width: number;
  height: number;
  /** Where the header (the iterable diagram) goes; setup lines are boxes instead. */
  header?: Box;
  setup: Box[];
  decision: Box;
  target?: Box;
  frame: Box;
  tab: Box;
  body: Box[];
  after: Box;
  edges: LoopEdge[];
};

export type LoopSpec = {
  /** Size of a custom header drawn above the decision (the iterable for `for` loops). */
  header?: { w: number; h: number };
  /** Lines that run once before the loop (`count = 1`). */
  setup?: string[];
  question: string;
  yes: string;
  no: string;
  /** The longest text the loop-variable box will show, if there is one (`number = 10`). */
  target?: string;
  body: string[];
  after: string;
  backLabel: string;
};

const codeW = (text: string) => text.length * CHAR_W + BOX_PAD_X * 2;

export function layoutLoop(spec: LoopSpec): LoopLayout {
  const decisionW = Math.max(spec.question.length * CHAR_W + 84, 196);
  const bodyW = Math.max(...spec.body.map(codeW));
  const colW = Math.max(MIN_COL, decisionW, spec.target ? codeW(spec.target) + 8 : 0, bodyW + FRAME_PAD * 2, codeW(spec.after), ...(spec.setup ?? []).map(codeW));
  const flowW = LANE_L + colW + LANE_R;
  const width = Math.max(flowW, (spec.header?.w ?? 0)) + PAD * 2;
  // Centre the column; the lanes keep their sizes even when the header is wider.
  const cx = PAD + LANE_L + colW / 2 + Math.max(0, (width - PAD * 2 - flowW) / 2);
  const colLeft = cx - colW / 2;
  const colRight = cx + colW / 2;
  const centred = (w: number, y: number, h: number): Box => ({ x: cx - w / 2, y, w, h });

  const edges: LoopEdge[] = [];
  const edge = (id: LoopEdgeId, points: Point[], label?: LoopEdge["label"]) =>
    edges.push({ id, d: roundedPath(points), arrow: arrowHead(points), ...(label ? { label } : {}) });

  let y = PAD;
  let header: Box | undefined;
  const setup: Box[] = [];
  if (spec.header) {
    header = { x: cx - spec.header.w / 2, y, w: spec.header.w, h: spec.header.h };
    y += spec.header.h;
  }
  (spec.setup ?? []).forEach((line, i) => {
    if (i > 0) {
      edge(`setup-${i}`, [{ x: cx, y }, { x: cx, y: y + SETUP_GAP }]);
      y += SETUP_GAP;
    }
    const box = centred(codeW(line), y, BOX_H);
    setup.push(box);
    y += BOX_H;
  });

  const feedFrom = y;
  y += header || setup.length ? FEED : 0;
  const decision = centred(decisionW, y, DECISION_H);
  if (header || setup.length) edge("feed", [{ x: cx, y: feedFrom }, { x: cx, y: decision.y }]);
  y += DECISION_H;
  const decCy = decision.y + DECISION_H / 2;

  const yesFrom = y;
  y += YES;
  let target: Box | undefined;
  if (spec.target) {
    target = centred(colW - 8, y, TARGET_H);
    edge("yes", [{ x: cx, y: yesFrom }, { x: cx, y }], { x: cx, y: yesFrom + YES / 2, text: spec.yes });
    y += TARGET_H;
  }

  // The body sits in a frame with a folder tab, like the branches of an if.
  const intoFrom = y;
  if (target) y += LINK;
  const tab: Box = { x: colLeft + 14, y, w: 4 * CHAR_W + 22, h: TAB_H };
  y += TAB_H;
  const frameTop = y;
  y += FRAME_PAD;
  if (target) edge("into-body", [{ x: cx, y: intoFrom }, { x: cx, y }]);
  else edge("yes", [{ x: cx, y: yesFrom }, { x: cx, y }], { x: cx, y: yesFrom + YES / 2, text: spec.yes });
  const body: Box[] = [];
  spec.body.forEach((_, i) => {
    if (i > 0) {
      edge(`body-${i}`, [{ x: cx, y }, { x: cx, y: y + BODY_GAP }]);
      y += BODY_GAP;
    }
    body.push(centred(bodyW, y, BOX_H));
    y += BOX_H;
  });
  y += FRAME_PAD;
  const frame: Box = { x: colLeft, y: frameTop, w: colW, h: y - frameTop };

  // Back to the question: down out of the body, left along the lane, up, into the diamond.
  const lastBottom = body.at(-1)!.y + BOX_H;
  const backY = y + BACK_DROP;
  const laneX = colLeft - LANE_L / 2 - 4;
  const decLeft = decision.x;
  edge("back", [
    { x: cx, y: lastBottom },
    { x: cx, y: backY },
    { x: laneX, y: backY },
    { x: laneX, y: decCy },
    { x: decLeft, y: decCy },
  ]);
  const back = edges.at(-1)!;
  back.label = { x: (cx + laneX) / 2, y: backY, text: spec.backLabel };
  y = backY;

  // The other way out: right from the diamond, down the right lane, into the line after.
  y += AFTER_GAP;
  const after = centred(codeW(spec.after), y, BOX_H);
  const exitX = colRight + LANE_R / 2 - 2;
  const afterCy = after.y + BOX_H / 2;
  edge("exit", [
    { x: decision.x + decisionW, y: decCy },
    { x: exitX, y: decCy },
    { x: exitX, y: afterCy },
    { x: after.x + after.w, y: afterCy },
  ], { x: exitX, y: decCy + 48, text: spec.no });
  y += BOX_H + PAD;

  return { width, height: y, header, setup, decision, target, frame, tab, body, after, edges };
}
