import type { Variables } from "@/types/python";
import type { CalcEvent, ExprNode } from "@/types/trace";
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
        <div className="expr-tree font-mono" aria-hidden>
          <ExpressionTree node={calc.tree} active={calc.active} done={calc.done ?? {}} reading={reading} />
          <span className="expr-down" data-on={(treeDone && !reading) || undefined}>
            ↓
          </span>
        </div>
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
 * An expression as a small tree drawn top-down like a flowchart: the values at the top flow
 * down along lines into their operator, and each operator's answer flows into the next one,
 * so the order Python works things out (precedence, brackets) is visible. In `4 + 3 * 2` the
 * `*` has to finish before its answer can flow down into the `+`. An operator shows its
 * answer once it has been worked out; the lines into it glow while it's being worked out.
 */
function ExpressionTree({ node, active, done, reading }: { node: ExprNode; active?: string; done: Record<string, string>; reading: boolean }) {
  if (!("op" in node)) {
    const isName = node.value !== undefined && node.value !== node.code;
    return (
      <span className="calc-node calc-operand expr-leaf" data-on={(reading && isName) || undefined}>
        {isName && <span className="calc-caption">{reading ? `reading ${node.code}` : node.code}</span>}
        <span className="font-bold">{node.value ?? node.code}</span>
      </span>
    );
  }
  const state = active === node.id ? "active" : done[node.id] !== undefined ? "done" : "idle";
  const value = done[node.id];
  return (
    <div className="expr-node" data-state={state}>
      <div className="expr-children">
        <div className="expr-child">
          <ExpressionTree node={node.left} active={active} done={done} reading={reading} />
        </div>
        <div className="expr-child">
          <ExpressionTree node={node.right} active={active} done={done} reading={reading} />
        </div>
      </div>
      <span className="expr-stem" />
      <span className="calc-node calc-op expr-op" data-on={state === "active" || undefined}>
        <span className="calc-caption">{state === "active" ? "working out" : state === "done" ? "done" : "waits"}</span>
        <span className="expr-op-line">
          <span className="expr-symbol">{node.op}</span>
          {value !== undefined && <span className="expr-result">= {value}</span>}
        </span>
      </span>
    </div>
  );
}

function findCode(node: ExprNode, id: string): string | undefined {
  if (node.id === id) return node.code;
  return "op" in node ? (findCode(node.left, id) ?? findCode(node.right, id)) : undefined;
}

function usedValues(calc: CalcEvent) {
  const used = calc.parts.filter((p) => p.value !== undefined && p.value !== p.code);
  return used.length ? `, using ${used.map((p) => `${p.code} = ${p.value}`).join(" and ")}` : "";
}
