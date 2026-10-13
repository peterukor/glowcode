import type { CSSProperties } from "react";
import type { PyType, PyValue, Variables } from "@/types/python";
import { formatValue, typeStyle } from "./values";

/**
 * A variable as a small labeled container: name and type on top, value below.
 * The label sits inside the box (not on its border), so no outline ever runs through it.
 */
export function VariableBox({ name, value, active }: { name: string; value: PyValue; active?: boolean }) {
  const st = typeStyle[value.type];
  return (
    <div
      className={`var-box animate-pop inline-flex min-w-24 max-w-full flex-col gap-0.5 rounded-xl border-2 px-3 py-1.5 ${st.border} ${st.tint}`}
      data-active={active || undefined}
      style={{ "--glow": `var(--t-${value.type})` } as CSSProperties}
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-mono text-xs font-bold text-foreground">{name}</span>
        <span className={`text-[10px] font-bold uppercase tracking-wider ${st.text}`}>{value.type}</span>
      </div>
      <div className={`truncate font-mono text-base font-bold leading-snug ${st.text}`}>{formatValue(value)}</div>
    </div>
  );
}

export function VariablesPanel({ vars, highlight }: { vars: Variables; highlight?: string }) {
  const entries = Object.entries(vars);
  if (!entries.length) {
    return <p className="text-sm text-muted-foreground">No variables yet. Step forward to watch them appear.</p>;
  }
  return (
    <div className="flex flex-wrap gap-3">
      {entries.map(([name, value]) => (
        // Keyed by value so the box pops again whenever its value changes.
        <VariableBox key={`${name}=${formatValue(value)}`} name={name} value={value} active={highlight === name} />
      ))}
    </div>
  );
}

export function TypeLegend() {
  return (
    <div className="flex flex-wrap gap-1.5">
      {(Object.keys(typeStyle) as PyType[]).map((t) => (
        <span
          key={t}
          className={`rounded-full border px-2 py-px font-mono text-[11px] font-bold ${typeStyle[t].border} ${typeStyle[t].tint} ${typeStyle[t].text}`}
        >
          {t}
        </span>
      ))}
    </div>
  );
}
