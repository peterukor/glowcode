import type { CSSProperties } from "react";
import type { CallEvent } from "@/types/trace";
import { arrowHead, CHAR_W, roundedPath, type Point } from "./flow/geometry";
import type { Look } from "./loops/LoopDiagram";

const ORDER: Record<CallEvent["phase"], number> = { call: 0, run: 1, result: 2, assign: 3 };
const PAD = 12;

/**
 * A call drawn as a small flowchart, top to bottom:
 *
 *            [ inputs ]
 *                │
 *          [ ⚙ len() ]
 *         ┌──────┼───────┐
 *     [Returns] [Prints] [Changes]
 *         │
 *    [ stored in length ]  /  [ goes into print() ]
 *
 * Every part is on screen from the first event of the call; only what glows changes, and the
 * outputs stay "?" until Python has produced them. What comes out is split on purpose:
 *   Returns  – the value handed back to the code that called it
 *   Prints   – text shown on the screen
 *   Changes  – an object the call modified (like a list after append)
 */
export function FunctionView({ call }: { call: CallEvent }) {
  const at = ORDER[call.phase];
  const done = at >= ORDER.result;
  const label = `${call.receiver ? `${call.receiver}.` : ""}${call.name}()`;

  // Inputs as pills: the receiver, then each argument (with its parameter name if known).
  const pills = [
    ...(call.receiver ? [{ text: `${call.receiver}${call.receiverValue ? ` = ${call.receiverValue}` : ""}`, note: undefined as string | undefined }] : []),
    ...call.args.map((a, i) => ({ text: `${call.params?.[i] ? `${call.params[i]} = ` : ""}${a}`, note: call.argFrom?.[i] ? `returned by ${call.argFrom[i]}` : undefined })),
  ];
  const pillW = (p: { text: string; note?: string }) => Math.max(p.text.length * CHAR_W + 22, p.note ? p.note.length * 6.2 + 12 : 0);
  const hasNotes = pills.some((p) => p.note);
  const inputCaption = call.receiver ? (call.args.length ? "called on, with" : "called on") : call.params?.length ? (call.args.length === 1 ? "argument → parameter" : "arguments → parameters") : call.args.length === 1 ? "input" : call.args.length ? "inputs" : "no inputs";
  const inputW = Math.max(inputCaption.length * 6.4 + 28, pills.reduce((s, p) => s + pillW(p) + 8, 0) + 20, 140);
  const inputH = pills.length ? (hasNotes ? 80 : 66) : 46;

  type Slot = { kind: "returns" | "prints" | "changes"; title: string; hint: string; value: string };
  const slots: Slot[] = [
    ...(call.returns !== undefined ? [{ kind: "returns" as const, title: "Returns", hint: "handed back", value: call.returns }] : []),
    ...(call.prints ? [{ kind: "prints" as const, title: "Prints", hint: "on screen", value: call.prints.join("\n") }] : []),
    ...(call.changes !== undefined ? [{ kind: "changes" as const, title: "Changes", hint: call.receiver ?? "its object", value: call.changes }] : []),
  ];
  const slotW = (s: Slot) => Math.max((s.title.length + s.hint.length + 3) * 6.4 + 24, Math.max(...s.value.split("\n").map((l) => l.length)) * CHAR_W + 28, 112);
  const slotH = (s: Slot) => 44 + s.value.split("\n").length * 20;
  const SLOT_GAP = 14;
  const slotsW = slots.reduce((sum, s) => sum + slotW(s), 0) + SLOT_GAP * Math.max(0, slots.length - 1);
  const fnW = Math.max(label.length * 10 + 70, 150);

  const tail = call.feeds ? { caption: done ? "the returned value goes into" : "its result will go into", text: call.feeds } : call.assignTo ? { caption: at === 3 ? "now refers to the returned value" : "will store the returned value", text: `${call.assignTo}${at === 3 && call.returns !== undefined ? ` → ${call.returns}` : ""}` } : undefined;
  const tailW = tail ? Math.max(tail.caption.length * 6.4 + 28, tail.text.length * CHAR_W + 28) : 0;

  const width = Math.max(inputW, fnW, slotsW, tailW) + PAD * 2;
  const cx = width / 2;
  let y = PAD;
  const input = { x: cx - inputW / 2, y, w: inputW, h: inputH };
  y += inputH + 34;
  const fn = { x: cx - fnW / 2, y, w: fnW, h: 52 };
  y += 52 + 44;
  let sx = cx - slotsW / 2;
  const slotBoxes = slots.map((s) => {
    const box = { x: sx, y, w: slotW(s), h: slotH(s) };
    sx += box.w + SLOT_GAP;
    return { ...s, box };
  });
  y += Math.max(0, ...slotBoxes.map((s) => s.box.h));
  const returnsBox = slotBoxes.find((s) => s.kind === "returns")?.box;
  let tailBox: { x: number; y: number; w: number; h: number } | undefined;
  if (tail) {
    y += 40;
    tailBox = { x: cx - tailW / 2, y, w: tailW, h: 54 };
    y += 54;
  }
  const height = y + PAD;

  // Looks by phase.
  const inLook: Look = at === 0 ? "lit" : "done";
  const fnLook: Look = at <= 1 ? "lit" : "done";
  const outLook: Look = at === 2 ? "lit" : at === 3 ? "done" : "idle";
  const tailLook: Look = (call.feeds && at === 2) || at === 3 ? "lit" : "idle";

  const edges: { id: string; points: Point[]; look: Look }[] = [
    { id: "in", points: [{ x: cx, y: input.y + input.h }, { x: cx, y: fn.y }], look: at <= 1 ? "lit" : "done" },
    ...slotBoxes.map((s) => {
      const sxc = s.box.x + s.box.w / 2;
      const mid = fn.y + fn.h + 22;
      return {
        id: `out-${s.kind}`,
        points: Math.abs(sxc - cx) < 1 ? [{ x: cx, y: fn.y + fn.h }, { x: cx, y: s.box.y }] : [{ x: cx, y: fn.y + fn.h }, { x: cx, y: mid }, { x: sxc, y: mid }, { x: sxc, y: s.box.y }],
        look: outLook,
      };
    }),
    ...(tailBox && returnsBox
      ? [
          {
            id: "tail",
            points:
              Math.abs(returnsBox.x + returnsBox.w / 2 - cx) < 1
                ? [{ x: cx, y: returnsBox.y + returnsBox.h }, { x: cx, y: tailBox.y }]
                : [
                    { x: returnsBox.x + returnsBox.w / 2, y: returnsBox.y + returnsBox.h },
                    { x: returnsBox.x + returnsBox.w / 2, y: tailBox.y - 18 },
                    { x: cx, y: tailBox.y - 18 },
                    { x: cx, y: tailBox.y },
                  ],
            look: tailLook,
          },
        ]
      : []),
  ];

  let px = cx - (pills.reduce((s, p) => s + pillW(p) + 8, 0) - 8) / 2;
  return (
    <div className="flow fn-svg overflow-x-auto" role="group" aria-label={`Function call: ${label}`}>
      <svg viewBox={`0 0 ${width} ${height}`} width={width} className="flow-svg mx-auto block h-auto max-w-full" style={{ "--flow-w": `${width}px`, minWidth: `min(${width}px, 17rem)` } as CSSProperties} aria-hidden>
        {edges.map((e) => (
          <g key={e.id} className="flow-edge" data-look={e.look}>
            <path d={roundedPath(e.points)} className="flow-edge-line" />
            {e.look === "lit" && <path d={roundedPath(e.points)} className="flow-edge-spark" />}
            <path d={arrowHead(e.points)} className="flow-arrow" />
          </g>
        ))}

        <g className="flow-block fn-input" data-look={inLook}>
          <rect x={input.x} y={input.y} width={input.w} height={input.h} rx={12} className="flow-block-box" />
          <text x={cx} y={input.y + 15} className="flow-caption fn-caption-svg">
            {inputCaption}
          </text>
          {pills.map((p, i) => {
            const w = pillW(p);
            const x = px;
            px += w + 8;
            return (
              <g key={i} className="fn-arg">
                <rect x={x} y={input.y + 26} width={w} height={28} rx={14} className="fn-arg-box" />
                <text x={x + w / 2} y={input.y + 41} className="fn-arg-text">
                  {p.text}
                </text>
                {p.note && (
                  <text x={x + w / 2} y={input.y + 67} className="flow-caption fn-caption-svg">
                    {p.note}
                  </text>
                )}
              </g>
            );
          })}
        </g>

        <g className="flow-block fn-machine" data-look={fnLook} data-current={call.phase === "run" || undefined}>
          <rect x={fn.x} y={fn.y} width={fn.w} height={fn.h} rx={fn.h / 2} className="flow-block-box" />
          <text x={cx} y={fn.y + fn.h / 2 + 1} className="fn-name">
            {label}
          </text>
          {call.phase === "run" && (
            <text x={cx} y={fn.y + fn.h + 12} className="flow-caption fn-caption-svg">
              running…
            </text>
          )}
        </g>

        {slotBoxes.map((s) => {
          const look: Look = s.kind === "returns" && at === 3 && call.assignTo ? "lit" : outLook;
          return (
            <g key={s.kind} className="flow-block fn-out" data-kind={s.kind} data-look={look} data-shown={done || undefined}>
              <rect x={s.box.x} y={s.box.y} width={s.box.w} height={s.box.h} rx={12} className="flow-block-box" />
              <text x={s.box.x + 14} y={s.box.y + 16} className="flow-caption">
                <tspan className="fn-slot-title">{s.title}</tspan> ({s.hint})
              </text>
              {(done ? s.value.split("\n") : ["?"]).map((line, i) => (
                <text key={i} x={s.box.x + 14} y={s.box.y + 38 + i * 20} className="flow-code fn-slot-value">
                  {line}
                </text>
              ))}
            </g>
          );
        })}

        {tail && tailBox && (
          <g className="flow-block fn-tail" data-look={tailLook}>
            <rect x={tailBox.x} y={tailBox.y} width={tailBox.w} height={tailBox.h} rx={12} className="flow-block-box" />
            <text x={cx} y={tailBox.y + 16} className="flow-caption fn-caption-svg">
              {tail.caption}
            </text>
            <text x={cx} y={tailBox.y + 37} className="flow-code fn-tail-text">
              {tail.text}
            </text>
          </g>
        )}
      </svg>
      <p className="sr-only">{describe(call, label, done)}</p>
    </div>
  );
}

function describe(call: CallEvent, label: string, done: boolean) {
  const inputs = [call.receiver, ...call.args].filter(Boolean).join(", ") || "nothing";
  if (!done) return `${label} is called with ${inputs}.`;
  const parts = [
    call.returns !== undefined && `returns ${call.returns}`,
    call.prints && `prints ${call.prints.join(", ")}`,
    call.changes !== undefined && `changes ${call.receiver ?? "its object"} to ${call.changes}`,
  ].filter(Boolean);
  const stored = call.phase === "assign" && call.assignTo ? ` ${call.assignTo} now refers to ${call.returns}.` : "";
  const feeds = call.feeds ? ` The returned value becomes the argument of ${call.feeds}.` : "";
  return `${label} with ${inputs} ${parts.join(" and ")}.${stored}${feeds}`;
}
