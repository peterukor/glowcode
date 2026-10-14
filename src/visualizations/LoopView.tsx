import { pyItem } from "./values";

/**
 * A for-loop as a row of laps. The current lap glows, finished laps turn teal, and once
 * every item has been used the "loop ends" marker lights up.
 * `current` is the lap index; a value equal to the number of items means the loop is over.
 */
export function LoopView({ items, current }: { items: (string | number)[]; current?: number }) {
  const finished = current !== undefined && current >= items.length;
  return (
    <div className="flex flex-wrap items-center justify-center gap-3 pb-6" role="group" aria-label="Loop laps">
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
              aria-current={now ? "step" : undefined}
            >
              {pyItem(item)}
              <span className="absolute -bottom-6 whitespace-nowrap text-[10px] font-bold uppercase text-muted-foreground">
                lap {i + 1}
                {now ? " · now" : done ? " ✓" : ""}
              </span>
            </div>
            <span className={`text-2xl ${done || now ? "text-primary" : "text-border"}`} aria-hidden>
              →
            </span>
          </div>
        );
      })}
      <span
        className={`rounded-full border-2 px-3 py-1 text-xs font-bold uppercase tracking-wide transition-all ${
          finished ? "border-primary bg-primary/10 text-primary" : "border-dashed border-border text-muted-foreground"
        }`}
      >
        {finished ? "No items left: loop ends" : "loop ends"}
      </span>
      <p className="sr-only">
        {current === undefined
          ? "The loop hasn't started."
          : finished
            ? "Every item has been used, so the loop has ended."
            : `Lap ${current + 1} of ${items.length}, using ${pyItem(items[current]!)}.`}
      </p>
    </div>
  );
}
