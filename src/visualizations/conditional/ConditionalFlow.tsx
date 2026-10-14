import { useMemo, type CSSProperties } from "react";
import { useOverflows } from "@/hooks/useOverflows";
import type { IfChain, IfChainTrace } from "@/types/conditional";
import { layoutIfChain, type Box, type EdgeSource, type FlowEdge, type FlowNode } from "./layout";
import { deriveChainState, type ChainState, type ConditionState } from "./state";

/**
 * Visual states, shared by boxes and connectors (styled in styles.css under `.flow`):
 *  idle  – not reached yet        lit   – the path Python actually took (glows)
 *  true  – evaluated to True      false – evaluated to False
 *  dim   – skipped / not taken
 */
type Look = "idle" | "lit" | "true" | "false" | "dim";

const fromCondition = (s: ConditionState | undefined): Look =>
  s === "true" ? "true" : s === "false" ? "false" : s === "skipped" ? "dim" : "idle";

function edgeLook(source: EdgeSource, s: ChainState): Look {
  const reachedAfter = s.at?.kind === "after";
  switch (source.kind) {
    case "operand":
      return fromCondition(s.conditions[source.condition]);
    case "result":
      return fromCondition(s.decisions[source.branch]);
    case "true":
    case "false": {
      const d = s.decisions[source.branch];
      if (d === "idle" || d === undefined) return "idle";
      return d === source.kind ? "lit" : "dim";
    }
    case "exit":
      if (s.taken === source.block) return reachedAfter ? "lit" : "idle";
      return s.taken ? "dim" : "idle";
    case "after":
      return reachedAfter ? "lit" : "idle";
  }
}

function blockLook(key: string, s: ChainState): Look {
  if (s.taken === key) return "lit";
  return s.taken ? "dim" : "idle";
}

function isCurrent(node: FlowNode, s: ChainState): boolean {
  const at = s.at;
  if (!at) return false;
  if (node.type === "frame") return at.kind === "test" && at.branch === node.key;
  if (node.type === "block") {
    return node.key === "else" ? at.kind === "else" : at.kind === "body" && at.branch === node.key;
  }
  if (node.type === "after") return at.kind === "after";
  return false;
}

const MARK: Record<Look, string> = { idle: "", lit: "", true: "✓", false: "✗", dim: "" };
const SPLIT_MARK: Record<Look, string> = { idle: "?", lit: "?", true: "✓", false: "✗", dim: "·" };

function Rect({ box, r = 10, className }: { box: Box; r?: number; className: string }) {
  return <rect x={box.x} y={box.y} width={box.w} height={box.h} rx={r} className={className} />;
}

function Node({ node, s }: { node: FlowNode; s: ChainState }) {
  const current = isCurrent(node, s) || undefined;

  switch (node.type) {
    case "frame": {
      const look = node.key === "else" ? blockLook("else", s) : fromCondition(s.decisions[node.key]);
      const { tab } = node;
      return (
        <g className="flow-frame" data-look={look} data-current={current}>
          <Rect box={node.box} r={16} className="flow-frame-box" />
          {/* Folder-style tab that sits on top of the frame instead of crossing its border. */}
          <path
            className="flow-frame-tab"
            d={`M${tab.x} ${tab.y + tab.h}V${tab.y + 8}Q${tab.x} ${tab.y} ${tab.x + 8} ${tab.y}H${tab.x + tab.w - 8}Q${tab.x + tab.w} ${tab.y} ${tab.x + tab.w} ${tab.y + 8}V${tab.y + tab.h}Z`}
          />
          <text x={tab.x + tab.w / 2} y={tab.y + tab.h / 2 + 1} className="flow-keyword">
            {node.keyword}
          </text>
        </g>
      );
    }
    case "comparison": {
      const look = fromCondition(s.conditions[node.id]);
      const { box } = node;
      return (
        <g className="flow-condition" data-look={look}>
          <Rect box={box} className="flow-condition-box" />
          <text x={box.x + 16} y={box.y + box.h / 2 + 1} className="flow-code">
            {node.code}
          </text>
          <text x={box.x + box.w - 18} y={box.y + box.h / 2 + 1} className="flow-mark">
            {MARK[look]}
          </text>
        </g>
      );
    }
    case "operator": {
      const look = fromCondition(s.conditions[node.id]);
      const { box, caption } = node;
      return (
        <g className="flow-operator" data-look={look}>
          <Rect box={box} r={box.h / 2} className="flow-operator-box" />
          <text x={box.x + box.w / 2} y={box.y + box.h / 2 + 1} className="flow-keyword">
            {node.op}
          </text>
          {caption && (
            <text x={caption.x} y={caption.y + 1} className="flow-caption">
              {caption.text}
            </text>
          )}
        </g>
      );
    }
    case "split": {
      const look = fromCondition(s.decisions[node.branch]);
      return (
        <g className="flow-split" data-look={look}>
          <circle cx={node.center.x} cy={node.center.y} r={node.r} className="flow-split-dot" />
          <text x={node.center.x} y={node.center.y + 1} className="flow-split-mark">
            {SPLIT_MARK[look]}
          </text>
        </g>
      );
    }
    case "block":
      return (
        <g className="flow-block" data-look={blockLook(node.key, s)} data-current={current}>
          <Rect box={node.box} className="flow-block-box" />
          {node.lines.map((line, i) => (
            <text key={i} x={node.box.x + 16} y={node.box.y + 12 + 11 + i * 22 + 1} className="flow-code">
              {line}
            </text>
          ))}
        </g>
      );
    case "merge":
      return (
        <circle
          cx={node.center.x}
          cy={node.center.y}
          r={5}
          className="flow-merge"
          data-look={s.at?.kind === "after" ? "lit" : "idle"}
        />
      );
    case "after": {
      const look = s.at?.kind === "after" ? "lit" : "idle";
      return (
        <g className="flow-block" data-look={look} data-current={current}>
          <Rect box={node.box} className="flow-block-box" />
          <text x={node.box.x + 16} y={node.box.y + node.box.h / 2 + 1} className="flow-code">
            {node.code}
          </text>
        </g>
      );
    }
  }
}

const EDGE_ORDER: Record<Look, number> = { dim: 0, idle: 1, false: 2, true: 3, lit: 4 };

function Edge({ edge, look }: { edge: FlowEdge; look: Look }) {
  return (
    <g className="flow-edge" data-look={look}>
      <path d={edge.d} className="flow-edge-line" />
      {/* A moving sparkle on the path Python took, so the direction reads at a glance. */}
      {look === "lit" && <path d={edge.d} className="flow-edge-spark" />}
    </g>
  );
}

function EdgeLabel({ edge, look }: { edge: FlowEdge; look: Look }) {
  if (!edge.label) return null;
  const { x, y, text } = edge.label;
  const w = text.length * 7 + 14;
  return (
    <g className="flow-label" data-tone={text === "True" ? "true" : "false"} data-look={look}>
      <rect x={x - w / 2} y={y - 10} width={w} height={20} rx={10} />
      <text x={x} y={y + 1}>
        {text}
      </text>
    </g>
  );
}

export function ConditionalFlow({ chain, trace }: { chain: IfChain; trace?: IfChainTrace }) {
  const layout = useMemo(() => layoutIfChain(chain), [chain]);
  const state = deriveChainState(chain, trace);
  const [scrollRef, overflows] = useOverflows<HTMLDivElement>();

  const edges = layout.edges
    .map((edge) => ({ edge, look: edgeLook(edge.source, state) }))
    .sort((a, b) => EDGE_ORDER[a.look] - EDGE_ORDER[b.look]);

  // Frames go first so boxes and lines inside them are drawn on top.
  const frames = layout.nodes.filter((n) => n.type === "frame");
  const others = layout.nodes.filter((n) => n.type !== "frame");

  return (
    // Wide charts keep a readable minimum size and scroll sideways on narrow screens
    // instead of shrinking until the labels can't be read.
    <div
      ref={scrollRef}
      className="flow overflow-x-auto"
      tabIndex={overflows ? 0 : undefined}
      role={overflows ? "region" : undefined}
      aria-label={overflows ? "Flow diagram, scrolls sideways" : undefined}
    >
      <svg
        viewBox={`0 0 ${layout.width} ${layout.height}`}
        width={layout.width}
        className="flow-svg mx-auto block h-auto max-w-full"
        style={{ "--flow-w": `${layout.width}px`, minWidth: `min(${layout.width}px, 30rem)` } as CSSProperties}
        role="img"
        aria-label="Flow of the if statement: which conditions were True or False and which block ran"
      >
        {frames.map((n, i) => (
          <Node key={`f${i}`} node={n} s={state} />
        ))}
        {edges.map(({ edge, look }) => (
          <Edge key={edge.id} edge={edge} look={look} />
        ))}
        {others.map((n, i) => (
          <Node key={`n${i}`} node={n} s={state} />
        ))}
        {edges.map(({ edge, look }) => (
          <EdgeLabel key={`l-${edge.id}`} edge={edge} look={look} />
        ))}
      </svg>
    </div>
  );
}

export function FlowLegend() {
  const item = "inline-flex items-center gap-1.5";
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-semibold text-muted-foreground">
      <span className={item}>
        <span className="h-1 w-6 rounded-full bg-primary shadow-[0_0_8px_var(--primary)]" /> Path Python took
      </span>
      <span className={item}>
        <span className="h-3 w-3 rounded-[4px] border-2 border-teal bg-teal/15" /> True
      </span>
      <span className={item}>
        <span className="h-3 w-3 rounded-[4px] border-2 border-coral bg-coral/10" /> False
      </span>
      <span className={item}>
        <span className="h-0 w-6 border-t-2 border-dashed border-muted-foreground/60" /> Skipped
      </span>
    </div>
  );
}
