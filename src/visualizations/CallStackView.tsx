import type { CSSProperties } from "react";
import type { Variables } from "@/types/python";
import type { TraceStep } from "@/types/trace";
import { arrowHead, CHAR_W } from "./flow/geometry";
import { formatValue } from "./values";

const frameTitle = (name: string) => (name === "<module>" ? "main program" : `${name}()`);

type Frame = { name: string; vars: Variables; calling?: string; active: boolean };

const PAD = 12;
const CARD_X = 10;
const HEAD_H = 34;
const VARS_H = 40;
const GAP = 52;
const SANS_W = 6.9;

const varText = (name: string, v: Variables[string]) => `${name} = ${formatValue(v)}`;

/**
 * The call stack as stacked frame cards, newest call on top, the main program at the bottom.
 * Each card holds only its own variables. Between two cards, an arrow up says which call the
 * lower frame made ("calls add_one(n)"); when the top frame returns, an arrow down carries
 * the value back. A frame that just finished stays for one step as a faded outline, so the
 * student sees it leave and its variables go with it. A picture of who is waiting for whom.
 */
export function CallStackView({ step, previous }: { step: TraceStep; previous?: TraceStep }) {
  const frames: Frame[] = [
    ...(step.callers ?? []).map((c) => ({ ...c, active: false })),
    { name: step.frame ?? "<module>", vars: step.vars, active: true },
  ];
  const depth = frames.length;
  const previousDepth = previous ? (previous.callers?.length ?? 0) + 1 : depth;
  const isNew = previousDepth < depth;
  const finished = previous && previousDepth > depth ? { name: previous.frame ?? "<module>", vars: previous.vars } : undefined;
  const returning = step.call?.phase === "result" && step.call.returns !== undefined && step.frame ? step.call.returns : undefined;
  const handedBack = finished && step.call?.returns !== undefined ? step.call.returns : undefined;

  // Top to bottom: the finished frame (ghost), then newest to oldest.
  const cards = [...(finished ? [{ ...finished, ghost: true, active: false, calling: undefined }] : []), ...[...frames].reverse().map((f) => ({ ...f, ghost: false }))];
  const statusOf = (c: (typeof cards)[number]) =>
    c.ghost ? "finished: its variables are gone" : c.active ? (isNew ? "new call, running" : "running") : `waiting for ${c.calling}`;
  const cardW = Math.max(268, ...cards.map((c) => Math.max((frameTitle(c.name).length + 1.5) * CHAR_W + statusOf(c).length * SANS_W + 32, varsWidth(c.vars) + 28)));
  const width = CARD_X * 2 + cardW;
  const cardH = HEAD_H + VARS_H;
  const height = PAD * 2 + cards.length * cardH + (cards.length - 1) * GAP;
  const top = (i: number) => PAD + i * (cardH + GAP);

  return (
    <div className="flow stack-svg overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} width={width} className="flow-svg mx-auto block h-auto max-w-full" style={{ "--flow-w": `${width}px`, minWidth: `min(${width}px, 17rem)` } as CSSProperties} aria-hidden>
        {cards.map((card, i) => {
          if (i === 0) return null;
          // The link between card i-1 (above) and card i (below).
          const above = cards[i - 1]!;
          const yTop = top(i - 1) + cardH;
          const yBottom = top(i);
          if (above.ghost) {
            const ret = [{ x: CARD_X + cardW - 34, y: yTop }, { x: CARD_X + cardW - 34, y: yBottom }];
            return (
              <g key={`link${i}`} className="flow-edge stack-link" data-look="lit">
                <path d={`M${ret[0]!.x} ${ret[0]!.y}L${ret[1]!.x} ${ret[1]!.y}`} className="flow-edge-line" />
                <path d={`M${ret[0]!.x} ${ret[0]!.y}L${ret[1]!.x} ${ret[1]!.y}`} className="flow-edge-spark" />
                <path d={arrowHead(ret)} className="flow-arrow" />
                {handedBack && <Pill x={ret[0]!.x} y={(yTop + yBottom) / 2} text={`returns ${handedBack}`} tone="lit" />}
              </g>
            );
          }
          const up = [{ x: CARD_X + 44, y: yBottom }, { x: CARD_X + 44, y: yTop }];
          const callLook = above.active && isNew ? "lit" : "done";
          const down = [{ x: CARD_X + cardW - 34, y: yTop }, { x: CARD_X + cardW - 34, y: yBottom }];
          return (
            <g key={`link${i}`}>
              <g className="flow-edge stack-link" data-look={callLook}>
                <path d={`M${up[0]!.x} ${up[0]!.y}L${up[1]!.x} ${up[1]!.y}`} className="flow-edge-line" />
                {callLook === "lit" && <path d={`M${up[0]!.x} ${up[0]!.y}L${up[1]!.x} ${up[1]!.y}`} className="flow-edge-spark" />}
                <path d={arrowHead(up)} className="flow-arrow" />
                <Pill x={up[0]!.x} y={(yTop + yBottom) / 2} text={`calls ${card.calling ?? ""}`} tone={callLook === "lit" ? "lit" : "neutral"} anchor="start" />
              </g>
              {above.active && returning && (
                <g className="flow-edge stack-link stack-return" data-look="lit">
                  <path d={`M${down[0]!.x} ${down[0]!.y}L${down[1]!.x} ${down[1]!.y}`} className="flow-edge-line" />
                  <path d={`M${down[0]!.x} ${down[0]!.y}L${down[1]!.x} ${down[1]!.y}`} className="flow-edge-spark" />
                  <path d={arrowHead(down)} className="flow-arrow" />
                  <Pill x={down[0]!.x} y={(yTop + yBottom) / 2} text={`returns ${returning}`} tone="lit" />
                </g>
              )}
            </g>
          );
        })}

        {cards.map((card, i) => {
          const y = top(i);
          const look = card.ghost ? "ghost" : card.active ? "lit" : "waiting";
          const status = statusOf(card);
          let vx = CARD_X + 14;
          const entries = Object.entries(card.vars);
          return (
            <g key={`${i}-${card.name}-${card.ghost}`} className="stack-card" data-look={look}>
              <rect x={CARD_X} y={y} width={cardW} height={cardH} rx={14} className="stack-card-box" />
              <text x={CARD_X + 14} y={y + HEAD_H / 2 + 2} className="stack-title">
                {frameTitle(card.name)}
              </text>
              <text x={CARD_X + 14 + (frameTitle(card.name).length + 1.5) * CHAR_W} y={y + HEAD_H / 2 + 2} className="stack-status">
                {status}
              </text>
              {entries.map(([name, value]) => {
                const t = varText(name, value);
                const w = t.length * 7.8 + 18;
                const x = vx;
                vx += w + 8;
                return (
                  <g key={name} className="stack-var">
                    <rect x={x} y={y + HEAD_H} width={w} height={26} rx={13} className="stack-var-box" />
                    <text x={x + w / 2} y={y + HEAD_H + 14} className="stack-var-text">
                      {t}
                    </text>
                  </g>
                );
              })}
              {!entries.length && (
                <text x={CARD_X + 14} y={y + HEAD_H + 13} className="stack-status">
                  no variables yet
                </text>
              )}
            </g>
          );
        })}
      </svg>
      {/* The same picture in words, one item per frame, for screen readers. */}
      <ul className="sr-only" aria-label="Call stack, newest call first">
        {finished && (
          <li>
            {frameTitle(finished.name)} finished{handedBack !== undefined ? ` and returned ${handedBack}` : ""}; its variables are gone.
          </li>
        )}
        {[...frames].reverse().map((f, i) => (
          <li key={i}>
            {frameTitle(f.name)}, {f.active ? "running" : `waiting for ${f.calling}`}: {Object.entries(f.vars).map(([k, v]) => varText(k, v)).join(", ") || "no variables"}
            {f.active && returning ? `; returns ${returning}` : ""}
          </li>
        ))}
      </ul>
    </div>
  );
}

const varsWidth = (vars: Variables) => Object.entries(vars).reduce((s, [k, v]) => s + varText(k, v).length * 7.8 + 26, 0);

function Pill({ x, y, text, tone, anchor = "middle" }: { x: number; y: number; text: string; tone: "lit" | "neutral"; anchor?: "start" | "middle" }) {
  const w = text.length * SANS_W + 20;
  const left = anchor === "start" ? x + 10 : x - w / 2;
  return (
    <g className="flow-label stack-pill" data-tone={tone}>
      <rect x={left} y={y - 11} width={w} height={22} rx={11} />
      <text x={left + w / 2} y={y + 1}>
        {text}
      </text>
    </g>
  );
}
