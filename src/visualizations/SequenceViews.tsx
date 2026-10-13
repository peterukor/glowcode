import { pyItem } from "./values";

/** A list as a row of indexed boxes. */
export function ListView({ name, items, activeIndex }: { name: string; items: (string | number)[]; activeIndex?: number }) {
  return (
    <div>
      <div className="mb-2 font-mono text-sm font-bold text-t-list">{name}</div>
      <div className="flex flex-wrap gap-2">
        {items.map((item, i) => (
          <div key={i} className="animate-pop text-center" style={{ animationDelay: `${i * 60}ms` }}>
            <div
              className={`min-w-14 rounded-xl border-2 px-3 py-1.5 font-mono font-bold transition-all ${
                activeIndex === i
                  ? "scale-110 border-sun bg-sun/25 text-foreground"
                  : `border-t-list bg-t-list/10 ${typeof item === "string" ? "text-t-str" : "text-t-int"}`
              }`}
            >
              {pyItem(item)}
            </div>
            <div className="mt-1 font-mono text-xs text-muted-foreground">[{i}]</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** A string as a row of characters with their indexes. */
export function StringView({ name, text, activeIndex }: { name: string; text: string; activeIndex?: number }) {
  return (
    <div>
      <div className="mb-2 font-mono text-sm font-bold text-t-str">{name}</div>
      <div className="flex flex-wrap gap-1">
        {[...text].map((ch, i) => (
          <div key={i} className="text-center">
            <div
              className={`grid h-10 w-9 place-items-center rounded-lg border-2 font-mono text-lg font-bold ${
                activeIndex === i ? "border-sun bg-sun/25" : "border-t-str bg-t-str/10 text-t-str"
              }`}
            >
              {ch}
            </div>
            <div className="mt-1 font-mono text-xs text-muted-foreground">{i}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
