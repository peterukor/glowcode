import type { Variables } from "@/types/python";
import type { CalcEvent } from "@/types/trace";
import { formatValue } from "./values";

/**
 * `total = total + 1` as previous value → operation → result → name.
 * The layout is the same in both phases; only what glows changes:
 * - calculate: the operands, the operator and the result glow. The name still refers to
 *   its old value, which is shown, so the student never sees a state Python isn't in.
 * - assign: the result, the arrow and the name glow. The name now refers to the result.
 */
export function CalculationView({ calc, vars }: { calc: CalcEvent; vars: Variables }) {
  const assigning = calc.phase === "assign";
  const current = vars[calc.target];
  const exprCode = calc.parts.map((p) => p.code).join(" ");

  return (
    <div className="calc mb-5" data-phase={calc.phase} role="group" aria-label={`Assignment: ${calc.target} = ${exprCode}`}>
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
        {assigning ? "Then: store the result" : "First: work out the right side"}
      </p>

      <div className="flex flex-wrap items-stretch gap-2 font-mono" aria-hidden>
        {calc.parts.map((part, i) =>
          part.value === undefined ? (
            <span key={i} className="calc-node calc-op" data-on={!assigning || undefined}>
              {part.code}
            </span>
          ) : (
            <span key={i} className="calc-node calc-operand" data-on={!assigning || undefined}>
              {part.code !== part.value && <span className="calc-caption">{part.code}</span>}
              <span className="font-bold">{part.value}</span>
            </span>
          ),
        )}
        <span className="calc-arrow" data-on={!assigning || undefined}>
          →
        </span>
        <span className="calc-node calc-result" data-on>
          <span className="calc-caption">{assigning ? "result" : "result, not stored yet"}</span>
          <span className="font-bold">{calc.result}</span>
        </span>
        <span className="calc-arrow" data-on={assigning || undefined}>
          →
        </span>
        <span className="calc-node calc-target" data-on={assigning || undefined}>
          <span className="calc-caption">
            {assigning ? "now refers to" : current ? "still refers to" : "doesn't exist yet"}
          </span>
          <span className="font-bold">
            {calc.target}
            {current && <span className="font-normal text-muted-foreground"> → {formatValue(current)}</span>}
          </span>
        </span>
      </div>

      <p className="sr-only">
        {assigning
          ? `${calc.target} now refers to ${calc.result}.`
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
