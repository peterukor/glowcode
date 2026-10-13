# Glowcode

A visual Python playground for beginners. Students step through small programs and watch
variables, decisions, loops, lists and functions animate one line at a time.

Today every program replays a hand-written demo trace. Real Python execution, step-by-step
tracing and more languages (Java) are planned; the code is organized so they slot in without
touching the visualizations.

## Run it

```sh
bun install      # or npm install
bun run dev      # http://localhost:5173
```

| Script | What it does |
| --- | --- |
| `dev` | Start the dev server |
| `build` | Type-check, then build to `dist/` (a static site, host it anywhere) |
| `preview` | Serve the production build locally |
| `test` | Run the unit tests (Vitest) |
| `typecheck` / `lint` / `format` | TypeScript, ESLint, Prettier |

Stack: React 19, Vite, TanStack Router (file-based routes), Tailwind CSS v4, lucide icons.
No backend.

## Project layout

```
src/
  main.tsx                 app entry: creates the router
  routes/                  one file per page (TanStack file routes)
  components/              app UI: header, code viewer, playback controls
  hooks/usePlayback.ts     play / pause / step / speed over a trace
  data/
    examples.ts            demo programs + their hand-written traces
    lessons.ts             the lesson path
  types/
    python.ts              Python values (int, str, list, ...)
    trace.ts               TraceStep / Example: the contract a tracer must produce
    conditional.ts         if / elif / else structure + its per-step trace
  visualizations/
    ExampleVisualization.tsx   picks the right view for an example
    VariableBox.tsx            compact, color-coded variable boxes
    SequenceViews.tsx          lists and strings
    LoopView.tsx, FunctionView.tsx
    conditional/
      state.ts             Python's rules: evaluate and/or (with short-circuit), which branch runs
      layout.ts            pure geometry: boxes and connector paths for the flow tree
      ConditionalFlow.tsx  renders layout + state as SVG; styles live in styles.css (.flow)
  styles.css               design tokens, utilities, variable-box and flow-tree styles
```

## How the conditional flow tree works

An `if / elif / else` chain is drawn as one connected tree:

- each `if` / `elif` is a frame with a keyword tab; a single comparison sits inside it, while
  `and` / `or` conditions show each comparison as its own box feeding into an operator node
- every decision splits into a **True** line (to its block) and a **False** line (to the next
  `elif`, the `else`, or straight past the chain)
- all paths meet again at the first line after the chain

Three layers keep it simple to change:

1. **Structure** (`IfChain` in `types/conditional.ts`): what the code looks like.
2. **Trace** (`IfChainTrace`): which comparisons Python evaluated and where it is now. Missing
   results mean "not evaluated", so short-circuiting shows up as skipped boxes for free.
3. **Derived state** (`state.ts`) → **looks** (`ConditionalFlow.tsx`): `idle`, `true`, `false`,
   `lit` (the path Python took, glowing) and `dim` (skipped). The CSS for each look is in
   `styles.css` under `.flow`.

## Adding a real tracer later

A tracer (Pyodide in the browser, or a server for Java) only has to output `TraceStep[]`
from `types/trace.ts`. For `if` statements it also reports the `IfChain` structure, which can
be built from Python's `ast` module (`If`, `BoolOp`, `Compare` nodes), and the comparison
results per step. Nothing in `visualizations/` needs to change.
