import { Keyboard } from "lucide-react";

/**
 * Sample user input for a read-only program that calls input(). Always labelled as a sample:
 * Glowcode never runs the student's typing, so the page must not suggest they typed it.
 * `variant="code"` sits inside a dark code panel; `"card"` sits on a light card.
 */
export function SampleInput({ lines, variant = "card" }: { lines: string[]; variant?: "code" | "card" }) {
  const dark = variant === "code";
  return (
    <div
      role="group"
      aria-label="Sample user input"
      className={
        dark
          ? "border-t border-code-line/30 px-4 py-3 font-mono text-sm text-code-fg"
          : "rounded-2xl border-2 border-dashed border-sky/50 bg-sky/8 px-4 py-3 text-sm"
      }
    >
      <div className={`mb-1 flex flex-wrap items-center gap-x-1.5 font-sans text-xs font-semibold ${dark ? "text-code-fg/75" : "text-sky-ink"}`}>
        <Keyboard className="h-3.5 w-3.5" aria-hidden /> Sample user input
        <span className="font-normal">· a pretend answer so this program can run here. You don't type anything.</span>
      </div>
      <ol className="font-mono">
        {lines.map((line, i) => (
          <li key={i}>
            <span className={dark ? "text-sky" : "text-sky-ink"} aria-hidden>
              ⌨{" "}
            </span>
            <span className="font-bold">{line}</span>
            {lines.length > 1 && <span className={`ml-2 font-sans text-xs ${dark ? "text-code-fg/75" : "text-muted-foreground"}`}>(answer {i + 1})</span>}
          </li>
        ))}
      </ol>
    </div>
  );
}
