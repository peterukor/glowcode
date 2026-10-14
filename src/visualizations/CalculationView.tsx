import type { Variables } from "@/types/python";
import type { CalcEvent, ExprNode } from "@/types/trace";
import { arrowHead, CHAR_W, roundedPath } from "./flow/geometry";
import { formatValue } from "./values";

/** Python's arithmetic operators. Every other part is an operand: a name or a literal like `1`. */
const OPERATORS = new Set(["+", "-", "*", "/", "//", "%", "**"]);

const TITLE: Record<CalcEvent["phase"], string> = {
  read: "Look up the values",
  calculate: "Work out the right side",
  assign: "Store the result",
};

/**
 * `total = total + 1` drawn as values read → operation → result → name. Every part is on
 * screen from the first event of the line; only what glows changes:
 * - read: the names on the right and their current values glow. The result is still "?".
 * - calculate: the operands, the operator and the result glow. The name on the left still
 *   refers to its old value, which is shown, so the student never sees a state Python isn't in.
 * - assign: the result, the arrow and the name glow. The name now refers to the result.
 * Each part also carries a text caption, so the state doesn't depend on color.
 */
export function CalculationView({ calc, vars }: { calc: CalcEvent; vars: Variables }) {
  const { phase } = calc;
  const reading = phase === "read";
  const assigning = phase === "assign";
  const current = vars[calc.target];
  const exprCode = calc.parts.map((p) => p.code).join(" ");
  const isName = (p: CalcEvent["parts"][number]) => p.value !== undefined && p.value !== p.code;
  const treeDone = !!calc.tree && calc.done?.[calc.tree.id] !== undefined;

  return (
    <div className="calc mb-5" data-phase={phase} role="group" aria-label={`Assignment: ${calc.target} = ${exprCode}`}>
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
        {reading && !calc.parts.some(isName) ? "Read the expression" : TITLE[phase]}
      </p>

      {calc.tree && (
        // A tree needs its own row: the result and the name follow underneath, not squeezed beside it.
        <ExpressionTree tree={calc.tree} active={calc.active} done={calc.done ?? {}} reading={reading} flowing={treeDone && !reading} />
      )}
      <div className="flex flex-wrap items-center gap-2 font-mono" aria-hidden>
        {!calc.tree &&
        calc.parts.map((part, i) =>
          OPERATORS.has(part.code) ? (
            <span key={i} className="calc-node calc-op" data-on={phase === "calculate" || undefined}>
              {part.code}
            </span>
          ) : (
            <span key={i} className="calc-node calc-operand" data-on={(reading ? isName(part) : phase === "calculate") || undefined}>
              {isName(part) && <span className="calc-caption">{reading ? `reading ${part.code}` : part.code}</span>}
              <span className="font-bold">{part.value ?? part.code}</span>
            </span>
          ),
        )}
        {/* Each arrow stays with the box it points to, so a wrapped row never ends in a bare arrow. */}
        <span className="inline-flex items-center gap-2">
          {!calc.tree && (
            <span className="calc-arrow" data-on={phase === "calculate" || undefined}>
              →
            </span>
          )}
          <span className="calc-node calc-result" data-on={(!reading && (!calc.tree || assigning || treeDone)) || undefined}>
            <span className="calc-caption">{reading ? "result" : assigning ? "result" : "result, not stored yet"}</span>
            <span className="font-bold">{reading || (calc.tree && phase === "calculate" && !treeDone) ? "?" : calc.result}</span>
          </span>
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="calc-arrow" data-on={assigning || undefined}>
            →
          </span>
          <span className="calc-node calc-target" data-on={assigning || undefined}>
            <span className="calc-caption">{assigning ? "now refers to" : current ? "still refers to" : "doesn't exist yet"}</span>
            <span className="font-bold">
              {calc.target}
              {current && <span className="font-normal text-muted-foreground"> → {formatValue(current)}</span>}
            </span>
          </span>
        </span>
      </div>

      <p className="sr-only">
        {assigning
          ? `${calc.target} now refers to ${calc.result}.`
          : reading
            ? `Python looks up the values it needs for ${exprCode}${usedValues(calc)}. Nothing has been calculated yet.`
            : calc.tree && calc.active
              ? `Python works out ${findCode(calc.tree, calc.active) ?? exprCode}${calc.done?.[calc.active] !== undefined ? `, which is ${calc.done[calc.active]}` : ""}.`
              : `Python works out ${exprCode}${usedValues(calc)}. The result is ${calc.result}. ${
                current ? `${calc.target} still refers to ${formatValue(current)}.` : `${calc.target} doesn't exist yet.`
              }`}
      </p>
    </div>
  );
}

/**
 * An expression as a small tree, drawn as a flowchart: the values at the top flow down along
 * lines into their operator, and each operator's answer flows down into the next one, so the
 * order Python works things out (precedence, brackets) is visible. In `4 + 3 * 2` the `*` has
 * to finish before its answer can flow into the `+`. An operator shows its answer once it has
 * been worked out; it and the lines into it glow while it's being worked out.
 */
function ExpressionTree({ tree, active, done, reading, flowing }: { tree: ExprNode; active?: string; done: Record<string, string>; reading: boolean; flowing: boolean }) {
  const laid = layoutTree(tree, done);
  const stateOf = (n: ExprNode) => (active === n.id ? "active" : done[n.id] !== undefined ? "done" : "idle");
  const root = laid.nodes.find((n) => n.node === tree)!;
  const height = laid.height + 34;
  return (
    <div className="flow expr-svg mb-1" aria-hidden>
      <svg viewBox={`0 0 ${laid.width} ${height}`} width={laid.width} className="flow-svg block h-auto max-w-full">
        {laid.nodes.map((n) =>
          n.parent ? (
            <g key={`e-${n.node.id}`} className="flow-edge" data-look={stateOf(n.parent.node) === "active" ? "lit" : stateOf(n.parent.node) === "done" ? "done" : "idle"}>
              <path d={roundedPath(elbow(n, n.parent))} className="flow-edge-line" />
              {stateOf(n.parent.node) === "active" && <path d={roundedPath(elbow(n, n.parent))} className="flow-edge-spark" />}
            </g>
          ) : null,
        )}
        {laid.nodes.map((n) => {
          const { node } = n;
          if (!("op" in node)) {
            const isName = node.value !== undefined && node.value !== node.code;
            return (
              <g key={node.id} className="flow-block expr-leaf-svg" data-look={reading && isName ? "lit" : "idle"}>
                <rect x={n.x - n.w / 2} y={n.y} width={n.w} height={n.h} rx={10} className="flow-block-box" />
                {isName && (
                  <text x={n.x} y={n.y + 13} className="flow-caption expr-caption">
                    {node.code}
                  </text>
                )}
                <text x={n.x} y={n.y + (isName ? 30 : n.h / 2 + 1)} className="expr-value">
                  {node.value ?? node.code}
                </text>
              </g>
            );
          }
          const state = stateOf(node);
          const look = state === "active" ? "lit" : state === "done" ? "done" : "idle";
          return (
            <g key={node.id} className="flow-block expr-op-svg" data-look={look} data-current={state === "active" || undefined}>
              <rect x={n.x - n.w / 2} y={n.y} width={n.w} height={n.h} rx={n.h / 2} className="flow-block-box" />
              <text x={n.x} y={n.y + n.h / 2 + 1} className="expr-value">
                <tspan className="expr-symbol-svg">{node.op}</tspan>
                {done[node.id] !== undefined && <tspan className="expr-result-svg"> = {done[node.id]}</tspan>}
              </text>
            </g>
          );
        })}
        <g className="flow-edge" data-look={flowing ? "lit" : "idle"}>
          <path d={`M${root.x} ${root.y + root.h}L${root.x} ${height - 2}`} className="flow-edge-line" />
          <path d={arrowHead([{ x: root.x, y: root.y + root.h }, { x: root.x, y: height - 2 }])} className="flow-arrow" />
        </g>
      </svg>
    </div>
  );
}

type Laid = { node: ExprNode; x: number; y: number; w: number; h: number; parent?: Laid };

const ROW = 70;
const NODE_H = 40;
const LEAF_GAP = 14;

/** Leaves left to right, each parent centred over its children, the root at the bottom. */
function layoutTree(tree: ExprNode, done: Record<string, string>) {
  const depthOf = (n: ExprNode): number => ("op" in n ? 1 + Math.max(depthOf(n.left), depthOf(n.right)) : 0);
  const maxDepth = depthOf(tree);
  const nodes: Laid[] = [];
  let cursor = 12;
  const widthOf = (n: ExprNode) => {
    if (!("op" in n)) {
      const name = n.value !== undefined && n.value !== n.code;
      return Math.max((n.value ?? n.code).length * CHAR_W + 28, name ? n.code.length * 6.4 + 20 : 0, 44);
    }
    // Room for "= result" from the start, so nodes never resize from one step to the next.
    return Math.max(56, (n.op.length + 3 + Math.max(3, (done[n.id] ?? "").length)) * CHAR_W + 28);
  };
  // `depth` counts down from the root, which sits at the bottom.
  const visit = (n: ExprNode, depth: number, parent?: Laid): Laid => {
    const w = widthOf(n);
    const laid: Laid = { node: n, x: 0, y: 12 + (maxDepth - depth) * ROW, w, h: NODE_H + ("op" in n ? 0 : n.value !== undefined && n.value !== n.code ? 6 : 0), parent };
    nodes.push(laid);
    if ("op" in n) {
      const l = visit(n.left, depth + 1, laid);
      const r = visit(n.right, depth + 1, laid);
      laid.x = (l.x + r.x) / 2;
    } else {
      laid.x = cursor + w / 2;
      cursor += w + LEAF_GAP;
    }
    return laid;
  };
  visit(tree, 0);
  const width = Math.max(cursor - LEAF_GAP + 12, ...nodes.map((n) => n.x + n.w / 2 + 12));
  return { nodes, width, height: 12 + maxDepth * ROW + NODE_H + 6 };
}

function elbow(child: Laid, parent: Laid) {
  const midY = parent.y - 16;
  return [
    { x: child.x, y: child.y + child.h },
    { x: child.x, y: midY },
    { x: parent.x, y: midY },
    { x: parent.x, y: parent.y },
  ];
}

function findCode(node: ExprNode, id: string): string | undefined {
  if (node.id === id) return node.code;
  return "op" in node ? (findCode(node.left, id) ?? findCode(node.right, id)) : undefined;
}

function usedValues(calc: CalcEvent) {
  const used = calc.parts.filter((p) => p.value !== undefined && p.value !== p.code);
  return used.length ? `, using ${used.map((p) => `${p.code} = ${p.value}`).join(" and ")}` : "";
}
