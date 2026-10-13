import type { Example, PyType, PyValue, Step, Vars } from "@/lib/examples";

export const typeStyle: Record<PyType, { bg: string; text: string; border: string; label: string }> = {
  int: { bg: "bg-t-int/15", text: "text-t-int", border: "border-t-int", label: "int" },
  float: { bg: "bg-t-float/15", text: "text-t-float", border: "border-t-float", label: "float" },
  str: { bg: "bg-t-str/15", text: "text-t-str", border: "border-t-str", label: "str" },
  bool: { bg: "bg-t-bool/20", text: "text-t-bool", border: "border-t-bool", label: "bool" },
  list: { bg: "bg-t-list/15", text: "text-t-list", border: "border-t-list", label: "list" },
  None: { bg: "bg-t-none/15", text: "text-t-none", border: "border-t-none", label: "None" },
};

export function formatValue(v: PyValue) {
  if (v.type === "str") return `"${v.value}"`;
  if (v.type === "bool") return v.value ? "True" : "False";
  if (v.type === "list") return `[${(v.value as (string | number)[]).map((x) => (typeof x === "string" ? `"${x}"` : x)).join(", ")}]`;
  if (v.type === "None") return "None";
  return String(v.value);
}

export function TypeLegend() {
  return (
    <div className="flex flex-wrap gap-2">
      {(Object.keys(typeStyle) as PyType[]).map((t) => (
        <span key={t} className={`rounded-full border-2 px-2.5 py-0.5 font-mono text-xs font-bold ${typeStyle[t].border} ${typeStyle[t].bg} ${typeStyle[t].text}`}>{t}</span>
      ))}
    </div>
  );
}

/** A variable shown as a labeled container. */
export function VarBox({ name, value, active }: { name: string; value: PyValue; active?: boolean }) {
  const st = typeStyle[value.type];
  return (
    <div key={formatValue(value)} className={`animate-pop relative rounded-2xl border-2 bg-card p-3 pt-5 shadow-soft transition-transform ${st.border} ${active ? "scale-105 animate-ring" : ""}`}>
      <span className={`absolute -top-3 left-3 rounded-full px-2.5 py-0.5 font-mono text-xs font-bold ${st.bg} ${st.text} border-2 ${st.border} bg-card`}>{name}</span>
      <div className={`truncate font-mono text-lg font-bold ${st.text}`}>{formatValue(value)}</div>
      <div className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{st.label}</div>
    </div>
  );
}

export function VariablesPanel({ vars, highlight }: { vars: Vars; highlight?: string }) {
  const entries = Object.entries(vars);
  if (!entries.length) return <p className="text-sm text-muted-foreground">No variables yet — step forward to watch them appear.</p>;
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-4 pt-2">
      {entries.map(([k, v]) => <VarBox key={k} name={k} value={v} active={highlight === k} />)}
    </div>
  );
}

/** List as indexed boxes. */
export function ListViz({ name, items, activeIndex }: { name: string; items: (string | number)[]; activeIndex?: number }) {
  return (
    <div>
      <div className="mb-2 font-mono text-sm font-bold text-t-list">{name}</div>
      <div className="flex flex-wrap gap-2">
        {items.map((it, idx) => (
          <div key={idx} className="animate-pop text-center" style={{ animationDelay: `${idx * 60}ms` }}>
            <div className={`min-w-16 rounded-xl border-2 px-3 py-2 font-mono font-bold ${activeIndex === idx ? "border-sun bg-sun/25 text-foreground scale-110" : `border-t-list bg-t-list/10 ${typeof it === "string" ? "text-t-str" : "text-t-int"}`} transition-all`}>
              {typeof it === "string" ? `"${it}"` : it}
            </div>
            <div className="mt-1 font-mono text-xs text-muted-foreground">[{idx}]</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** String as character sequence. */
export function StringViz({ name, text, activeIndex }: { name: string; text: string; activeIndex?: number }) {
  return (
    <div>
      <div className="mb-2 font-mono text-sm font-bold text-t-str">{name}</div>
      <div className="flex gap-1">
        {text.split("").map((ch, idx) => (
          <div key={idx} className="text-center">
            <div className={`grid h-11 w-10 place-items-center rounded-lg border-2 font-mono text-lg font-bold ${activeIndex === idx ? "border-sun bg-sun/25" : "border-t-str bg-t-str/10 text-t-str"}`}>{ch}</div>
            <div className="mt-1 font-mono text-xs text-muted-foreground">{idx}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Conditional as a branching flowchart. */
export function Flowchart({ condition, yes, no, branch }: { condition: string; yes: string; no: string; branch?: "yes" | "no" }) {
  const path = (b: "yes" | "no") => branch === b ? "stroke-primary" : branch ? "stroke-border opacity-50" : "stroke-muted-foreground";
  const node = (b: "yes" | "no") => branch === b ? (b === "yes" ? "border-teal bg-teal/20 scale-105" : "border-coral bg-coral/20 scale-105") : branch ? "border-border opacity-50" : "border-border";
  return (
    <div className="relative mx-auto w-full max-w-md">
      <div className={`mx-auto w-fit rotate-0 rounded-2xl border-2 px-5 py-3 text-center font-mono text-sm font-bold shadow-soft ${branch ? "border-sun bg-sun/20" : "border-primary bg-card"}`}>
        {condition} ?
      </div>
      <svg viewBox="0 0 300 70" className="h-16 w-full" fill="none" strokeWidth="3" strokeLinecap="round">
        <path d="M150 0 C150 35, 60 30, 60 70" className={`${path("yes")} transition-all`} strokeDasharray={branch === "yes" ? "0" : "6 6"} />
        <path d="M150 0 C150 35, 240 30, 240 70" className={`${path("no")} transition-all`} strokeDasharray={branch === "no" ? "0" : "6 6"} />
      </svg>
      <div className="grid grid-cols-2 gap-6">
        {(["yes", "no"] as const).map((b) => (
          <div key={b} className={`rounded-2xl border-2 bg-card p-3 text-center transition-all ${node(b)}`}>
            <div className={`text-xs font-bold uppercase ${b === "yes" ? "text-teal" : "text-coral"}`}>{b === "yes" ? "True" : "False"}</div>
            <div className="mt-1 font-mono text-sm">{b === "yes" ? yes : no}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** For-loop iteration sequence. */
export function LoopViz({ items, current }: { items: number[]; current?: number }) {
  return (
    <div className="flex items-center justify-center gap-3">
      {items.map((it, idx) => {
        const done = current !== undefined && idx < current;
        const now = current === idx;
        return (
          <div key={idx} className="flex items-center gap-3">
            <div className={`relative grid h-16 w-16 place-items-center rounded-full border-4 font-mono text-xl font-bold transition-all ${now ? "border-sun bg-sun/25 scale-115 animate-ring" : done ? "border-teal bg-teal/20 text-teal" : "border-border text-muted-foreground"}`}>
              {it}
              <span className="absolute -bottom-6 text-[10px] font-bold uppercase text-muted-foreground">lap {idx + 1}</span>
            </div>
            {idx < items.length - 1 && <span className={`text-2xl ${done || now ? "text-primary" : "text-border"}`}>→</span>}
          </div>
        );
      })}
      <span className="ml-1 text-3xl text-primary">↺</span>
    </div>
  );
}

/** Function call: inputs → body → output. */
export function FunctionViz({ name, input, output, stage }: { name: string; input?: string; output?: string; stage: number }) {
  const box = (on: boolean) => `rounded-2xl border-2 p-3 text-center transition-all ${on ? "border-primary bg-primary/10 scale-105" : "border-border bg-card"}`;
  return (
    <div className="grid grid-cols-[1fr_auto_1.3fr_auto_1fr] items-center gap-2">
      <div className={box(stage === 1)}><div className="text-xs font-bold uppercase text-muted-foreground">input</div><div className="font-mono text-t-str">{input ?? "—"}</div></div>
      <span className="text-2xl text-primary">→</span>
      <div className={`${box(stage === 2)} bg-brand/0`}>
        <div className="font-display text-lg font-bold">⚙️ {name}()</div>
        <div className="text-xs text-muted-foreground">runs the body</div>
      </div>
      <span className="text-2xl text-primary">→</span>
      <div className={box(stage === 3)}><div className="text-xs font-bold uppercase text-muted-foreground">return</div><div className="font-mono text-t-str">{output ?? "—"}</div></div>
    </div>
  );
}

/** Renders the right visualization for an example at a given step. */
export function ExampleViz({ example, step, kind }: { example: Example; step: Step; kind: string }) {
  const v = step.vars;
  if (kind === "variables") return <VariablesPanel vars={v} highlight={step.highlight} />;
  if (kind === "flowchart") return <Flowchart condition="score >= 70" yes='result = "pass"' no='result = "try again"' branch={step.branch} />;
  if (kind === "loop") return <div className="py-6"><LoopViz items={[3, 5, 7]} current={step.loopIndex ?? (step.line === 4 ? 3 : undefined)} /></div>;
  if (kind === "function") {
    const stage = step.line === 5 && !v.text ? 1 : step.line === 2 ? 2 : step.line === 3 || v.text ? 3 : 0;
    return <FunctionViz name="greet" input={stage ? '"Sam"' : undefined} output={stage >= 3 ? '"Hi, Sam"' : undefined} stage={stage} />;
  }
  if (kind === "collections") {
    const fruits = v.fruits?.value as string[] | undefined;
    const word = v.word?.value as string | undefined;
    return (
      <div className="space-y-6">
        {fruits && <ListViz name="fruits" items={fruits} activeIndex={step.line === 2 ? fruits.length - 1 : step.line === 5 ? 2 : undefined} />}
        {word && <StringViz name="word" text={word} activeIndex={step.line >= 4 ? 0 : undefined} />}
      </div>
    );
  }
  return <p className="text-sm text-muted-foreground">This view isn't available for this example.</p>;
}
