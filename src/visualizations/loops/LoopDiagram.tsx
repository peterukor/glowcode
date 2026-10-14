import type { CSSProperties, ReactNode } from "react";
import { useOverflows } from "@/hooks/useOverflows";
import type { Box, Point } from "../flow/geometry";
import type { LoopEdgeId, LoopLayout } from "./loopLayout";

/**
 * How a part of the flowchart looks right now. The same words the if-chain flow tree uses:
 *  idle – not reached yet            lit  – what Python is doing now (glows, sparkles)
 *  true / false – a decision's answer  done – ran earlier            dim – skipped
 */
export type Look = "idle" | "lit" | "true" | "false" | "done" | "dim";

export type LoopLooks = {
  nodes: Partial<Record<string, Look>>;
  edges: Partial<Record<LoopEdgeId, Look>>;
  /** The node Python is at; it breathes gently. */
  current?: string;
};

/** A value travelling along the flowchart, e.g. the item a for loop just picked. */
export type TravellingChip = { key: string; text: string; from: Point; to: Point };

const EDGE_ORDER: Record<Look, number> = { dim: 0, idle: 1, done: 1, false: 2, true: 3, lit: 4 };
/**
 * The Yes / No labels only take a colour when that way out was chosen: the label of the way
 * Python went is coloured, the other one fades. Until then both stay neutral, so a label is
 * never mistaken for an answer.
 */
function labelTone(id: LoopEdgeId, look: Look, answer?: { positive: boolean }): "true" | "false" | "idle" | "dim" | "neutral" {
  if (id === "yes") {
    if (answer?.positive === false || look === "dim") return "dim";
    return answer?.positive || look === "lit" || look === "done" ? "true" : "idle";
  }
  if (id === "exit") {
    if (answer?.positive) return "dim";
    return answer?.positive === false || look === "lit" ? "false" : "idle";
  }
  return "neutral";
}

/** The lines inside the decision diamond. */
function decisionLines(caption: string | undefined, question: string, answer?: { text: string; positive: boolean }) {
  return [
    ...(caption ? [{ kind: "caption", text: caption }] : []),
    { kind: "question", text: question },
    ...(answer ? [{ kind: "answer", text: `${answer.positive ? "✓" : "✗"} ${answer.text}` }] : []),
  ];
}

function Rect({ box, r = 10, className }: { box: Box; r?: number; className: string }) {
  return <rect x={box.x} y={box.y} width={box.w} height={box.h} rx={r} className={className} />;
}

function CodeBox({ id, box, code, looks }: { id: string; box: Box; code: string; looks: LoopLooks }) {
  return (
    <g className="flow-block loop-node" data-node={id} data-look={looks.nodes[id] ?? "idle"} data-current={looks.current === id || undefined}>
      <Rect box={box} className="flow-block-box" />
      <text x={box.x + 16} y={box.y + box.h / 2 + 1} className="flow-code">
        {code}
      </text>
    </g>
  );
}

/**
 * Draws a loop flowchart laid out by `layoutLoop` in the flow tree's visual language.
 * Renderers decide the looks from the trace; this component only draws them.
 */
export function LoopDiagram({
  layout,
  looks,
  header,
  setup = [],
  question,
  questionCaption,
  answer,
  target,
  body,
  after,
  chip,
  label,
}: {
  layout: LoopLayout;
  looks: LoopLooks;
  /** Drawn at `layout.header` (the iterable). */
  header?: ReactNode;
  setup?: string[];
  question: string;
  questionCaption?: string;
  answer?: { text: string; positive: boolean };
  /** The loop variable box's content, for `for` loops. */
  target?: { caption: string; content: ReactNode };
  body: string[];
  after: string;
  chip?: TravellingChip;
  label: string;
}) {
  const [scrollRef, overflows] = useOverflows<HTMLDivElement>();
  const { decision: dec, frame, tab } = layout;
  const edges = [...layout.edges].sort((a, b) => EDGE_ORDER[looks.edges[a.id] ?? "idle"] - EDGE_ORDER[looks.edges[b.id] ?? "idle"]);
  const decLook = looks.nodes.decision ?? "idle";
  const diamond = `M${dec.x + dec.w / 2} ${dec.y}L${dec.x + dec.w} ${dec.y + dec.h / 2}L${dec.x + dec.w / 2} ${dec.y + dec.h}L${dec.x} ${dec.y + dec.h / 2}Z`;

  return (
    <div
      ref={scrollRef}
      className="flow loopflow overflow-x-auto"
      tabIndex={overflows ? 0 : undefined}
      role={overflows ? "region" : undefined}
      aria-label={overflows ? "Loop diagram, scrolls sideways" : undefined}
    >
      <svg
        viewBox={`0 0 ${layout.width} ${layout.height}`}
        width={layout.width}
        className="flow-svg mx-auto block h-auto max-w-full"
        style={{ "--flow-w": `${layout.width}px`, minWidth: `min(${layout.width}px, 17rem)` } as CSSProperties}
        role="img"
        aria-label={label}
      >
        {/* The body's frame, with a folder tab like an if branch. */}
        <g className="flow-frame loop-frame" data-look={looks.nodes.frame ?? "idle"}>
          <Rect box={frame} r={16} className="flow-frame-box" />
          <path
            className="flow-frame-tab"
            d={`M${tab.x} ${tab.y + tab.h}V${tab.y + 8}Q${tab.x} ${tab.y} ${tab.x + 8} ${tab.y}H${tab.x + tab.w - 8}Q${tab.x + tab.w} ${tab.y} ${tab.x + tab.w} ${tab.y + 8}V${tab.y + tab.h}Z`}
          />
          <text x={tab.x + tab.w / 2} y={tab.y + tab.h / 2 + 1} className="flow-keyword">
            body
          </text>
        </g>

        {edges.map((e) => {
          const look = looks.edges[e.id] ?? "idle";
          return (
            <g key={e.id} className="flow-edge loop-edge" data-edge={e.id} data-look={look}>
              <path d={e.d} className="flow-edge-line" />
              {look === "lit" && <path d={e.d} className="flow-edge-spark" />}
              <path d={e.arrow} className="flow-arrow" />
            </g>
          );
        })}

        {header && layout.header && <g transform={`translate(${layout.header.x} ${layout.header.y})`}>{header}</g>}
        {layout.setup.map((box, i) => (
          <CodeBox key={`s${i}`} id={`setup-${i}`} box={box} code={setup[i] ?? ""} looks={looks} />
        ))}

        <g className="flow-decision loop-node" data-node="decision" data-look={decLook} data-current={looks.current === "decision" || undefined}>
          <path d={diamond} className="flow-decision-shape" />
          {/* Inside the diamond, top to bottom: which check this is, the question, its answer. */}
          {decisionLines(questionCaption, question, answer).map((line, i, all) => (
            <text
              key={line.kind}
              x={dec.x + dec.w / 2}
              y={dec.y + dec.h / 2 + 1 + (i - (all.length - 1) / 2) * 17}
              className={line.kind === "question" ? "flow-code flow-decision-text" : line.kind === "answer" ? "flow-decision-answer" : "flow-caption flow-decision-caption"}
              data-tone={line.kind === "answer" ? (answer!.positive ? "true" : "false") : undefined}
            >
              {line.text}
            </text>
          ))}
        </g>

        {layout.target && target && (
          <g className="flow-block loop-node loop-target" data-node="target" data-look={looks.nodes.target ?? "idle"} data-current={looks.current === "target" || undefined}>
            <Rect box={layout.target} className="flow-block-box" />
            <text x={layout.target.x + 16} y={layout.target.y + 16} className="flow-caption">
              {target.caption}
            </text>
            <text x={layout.target.x + 16} y={layout.target.y + 37} className="flow-code">
              {target.content}
            </text>
          </g>
        )}

        {layout.body.map((box, i) => (
          <CodeBox key={`b${i}`} id={`body-${i}`} box={box} code={body[i] ?? ""} looks={looks} />
        ))}
        <CodeBox id="after" box={layout.after} code={after} looks={looks} />

        {edges.map((e) => {
          if (!e.label) return null;
          const look = looks.edges[e.id] ?? "idle";
          const w = e.label.text.length * 6.6 + 18;
          return (
            <g key={`l-${e.id}`} className="flow-label" data-tone={labelTone(e.id, look, answer)} data-look={look}>
              <rect x={e.label.x - w / 2} y={e.label.y - 10} width={w} height={20} rx={10} />
              <text x={e.label.x} y={e.label.y + 1}>
                {e.label.text}
              </text>
            </g>
          );
        })}

        {chip && (
          <g
            key={chip.key}
            className="loop-chip"
            style={{ "--fx": `${chip.from.x}px`, "--fy": `${chip.from.y}px`, "--tx": `${chip.to.x}px`, "--ty": `${chip.to.y}px` } as CSSProperties}
            aria-hidden
          >
            <rect x={-(chip.text.length * CHAR_CHIP + 22) / 2} y={-15} width={chip.text.length * CHAR_CHIP + 22} height={30} rx={15} className="loop-chip-box" />
            <text x={0} y={1} className="loop-chip-text">
              {chip.text}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}

const CHAR_CHIP = 8.4;
