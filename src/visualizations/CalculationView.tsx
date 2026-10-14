import type { Variables } from "@/types/python";
import type { CalcEvent } from "@/types/trace";
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

  return (
    <div className="calc mb-5" data-phase={phase} role="group" aria-label={`Assignment: ${calc.target} = ${exprCode}`}>
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">{TITLE[phase]}</p>

      <div className="flex flex-wrap items-stretch gap-2 font-mono" aria-hidden>
        {calc.parts.map((part, i) =>
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
        <span className="calc-arrow" data-on={phase === "calculate" || undefined}>
          →
        </span>
        <span className="calc-node calc-result" data-on={!reading || undefined}>
          <span className="calc-caption">{reading ? "result" : assigning ? "result" : "result, not stored yet"}</span>
          <span className="font-bold">{reading ? "?" : calc.result}</span>
        </span>
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
      </div>

      <p className="sr-only">
        {assigning
          ? `${calc.target} now refers to ${calc.result}.`
          : reading
            ? `Python looks up the values it needs for ${exprCode}${usedValues(calc)}. Nothing has been calculated yet.`
            : `Python works out ${exprCode}${usedValues(calc)}. The result is ${calc.result}. ${
                current ? `${calc.target} still refers to ${formatValue(current)}.` : `${calc.target} doesn't exist yet.`
              }`}
      </p>
    </div>
  );
}

function usedValues(calc: CalcEvent) {
  const used = calc.parts.filter((p) => p.value !== undefined && p.value !== p.code);
  return used.length ? `, using ${used.map((p) => `${p.code} = ${p.value}`).join(" and ")}` : "";
}
