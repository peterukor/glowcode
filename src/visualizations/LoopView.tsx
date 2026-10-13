/** A for-loop as a row of laps; the current lap glows, finished laps turn teal. */
export function LoopView({ items, current }: { items: number[]; current?: number }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3 pb-6">
      {items.map((item, i) => {
        const done = current !== undefined && i < current;
        const now = current === i;
        return (
          <div key={i} className="flex items-center gap-3">
            <div
              className={`relative grid h-14 w-14 place-items-center rounded-full border-4 font-mono text-xl font-bold transition-all ${
                now
                  ? "animate-ring scale-110 border-sun bg-sun/25"
                  : done
                    ? "border-teal bg-teal/20 text-teal"
                    : "border-border text-muted-foreground"
              }`}
            >
              {item}
              <span className="absolute -bottom-6 text-[10px] font-bold uppercase text-muted-foreground">lap {i + 1}</span>
            </div>
            {i < items.length - 1 && <span className={`text-2xl ${done || now ? "text-primary" : "text-border"}`}>→</span>}
          </div>
        );
      })}
      <span className="ml-1 text-3xl text-primary" aria-hidden>
        ↺
      </span>
    </div>
  );
}
