# Glowcode Product Roadmap & Decision Log

Status: living planning document. Last reviewed: 2026-10-14.
Purpose: source of truth for development prompts, scope decisions and future reviews. Update this document when the product decisions change; never silently reinterpret a previous decision.

## Product vision

Glowcode teaches beginners *why code works* through approachable, technically accurate lessons and interactive, visual-first execution walkthroughs. The aim is to teach programming mindset throughout the course: understand a problem, predict behavior, observe execution, explain it, debug mistakes, and apply the concept.

Courses are independent and incrementally published alongside a live bootcamp. Planned courses: Python Fundamentals (first), Version Control (Git/GitHub), Computer Fundamentals (binary/bytes/memory and concepts needed for Java), and Java Fundamentals with IntelliJ IDEA. No global prerequisite ladder.

## Current product contract (read before each phase)

- Desktop lessons: collapsible course contents on the left; textbook-style lesson content in the center; collapsible contextual Ask Glow placeholder on the right. Responsive/mobile layout.
- Interactive content distributed throughout lessons, not only a quiz at the end: predictions, debugging, reflections and practice with explanatory feedback.
- **Initial walkthrough experience is read-only.** Course-authored code appears at left, corresponding visualization at right. Students control Previous, Next, Reset. The current *execution event*, not merely the next physical source line, determines highlighting; a line may recur in a loop or have multiple substeps.
- Show the full relevant diagram from the start and highlight/glow only the currently active nodes, bubbles, connections and paths. Update values accurately. Conditionals should show full branches and real short-circuit/skipped operations. Reassignment should distinguish reading old value, computing new value and rebinding the name.
- Function/method visualization: inputs/arguments -> labeled function -> clearly differentiated return value, printed output and/or mutation. A function may both print and return; Python print returns None, list.append mutates and returns None.
- Curated execution steps must be accurate and tested against language behavior. Do not pretend they are automatically executing arbitrary user code.
- **An editable IDE/playground is DEFERRED, NOT CANCELED.** Preserve integration seams so it can be added later without rewriting course content, lesson routes, reference system or read-only walkthrough components. The future IDE is a *separate mode* from guided read-only walkthroughs. Do not add editing, Run, Pyodide, interpreter/backend sandbox or automatic arbitrary-code tracing until a dedicated phase is authorized.
- Future IDE direction (to revisit and design explicitly): code editor on left, live visualization on right, console and separate Run versus Visualize actions; language-specific execution/trace engine behind reusable presentation components. Python first, Java later. These are intentions, not current build requirements.
- Future documentation/manual: searchable concepts, Python types, built-ins, operators, keywords, methods grouped under types; inline tooltip/link from lessons.
- Future Ask Glow: contextual AI tutor in right panel, implemented via a secure backend proxy, not frontend API secrets.
- Progress: initial local versioned storage, independent per course; explicitly completed lessons distinguished from visits/attempts. Accounts/cloud sync later.
- Visual style: Glowcode's colorful, friendly, modern design; accessible contrast/keyboard navigation/reduced motion.
- Respect existing components and architecture; no gratuitous refactors or filler curriculum.

## Roadmap and gates

1. **Course infrastructure — implemented, subject to periodic review.** Dashboard, course registry, structured lessons, routes, three-column page, navigation, progress and docs.
2. **Lesson experience and teaching framework — work on feat/lesson-experience.** Strong writing, reusable content blocks, meaningful predictions/debugging/practice, authoring guidelines; polish benchmark lessons.
2.1 **Interactive learning integration — next scoped refinement.** Embed curated prediction checkpoints into walkthroughs, improve synchronized code/diagram stepping and lesson integration; do not build arbitrary-code execution. Test three accurate examples: reassignment, conditional, simple function.
3. **Manual/glossary and contextual reference help.** Searchable documentation; methods under their types; lesson and future IDE extension points.
4. **Reusable read-only walkthrough engine.** Strong typed step data/events, full-diagram and active-node highlighting, controls, authoring/testing utilities.
5. **Python-specific visualization primitives.** Variables, operations, branches/short circuit, loops, strings/lists, function/method input-return-print-mutation. Build on Phase 4 rather than duplicate. (Earlier phases may contain prototypes; migrate carefully.)
6. **Incrementally publish Python Fundamentals content.** Quality and correctness over volume; bootcamp order may change.
7. **Richer active learning and progress.** More reasoning activities and optional milestones; keep guided source code read-only.
8. **Ask Glow.** Secure contextual tutor, when backend and cost/privacy plan are approved.
9. **Editable IDE / sandboxed code execution — future dedicated planning and build phase.** Reassess after guided experience matures. Preserve architecture now; don't silently insert IDE scope into earlier phases.

Phase numbers are sequencing guidance, not inflexible launch dates. New course content can be introduced incrementally, and future Git/Computer/Java visualization needs may lead to planned extensions.

## Workflow to prevent scope drift

Before writing a Claude implementation prompt or reviewing a phase:
1. Read this file plus GLOWCODE_ARCHITECTURE.md and TEACHING_GUIDELINES.md, then inspect the actual current branch/code.
2. State the phase's scope, out-of-scope items, and which existing modules should be reused.
3. Do not silently change prior decisions. Propose changes explicitly, explain the tradeoff, and obtain approval before editing the roadmap.
4. Implement on a feature branch; run tests/typecheck/build and browser checks when available; report actual verification accurately.
5. Review the pushed SHA against acceptance criteria before moving to the next phase.
6. Update this roadmap when a decision is approved or a milestone is confirmed. Keep a dated decision note.

## Decision log

- 2026-10-13: Replace initial editable IDE-first experience with curated **read-only** code + visualization guided walkthroughs for the first release. No arbitrary student code editing or execution in current walkthroughs.
- 2026-10-13: Entire diagram remains visible; active operations and paths glow by execution event. Function diagrams show input, function and printed/returned/mutated effects.
- 2026-10-13: Teach through inline interactions and curated prediction checkpoints, without turning every line into a quiz.
- 2026-10-13: Confirm editable IDE is a **future feature**, not canceled. Maintain compatibility and extension points; implementation requires its own approved phase.
- 2026-10-14 (Phase 6, from the approved Phase 6 brief): Python Fundamentals outline is ten chapters: Getting Started with Programming; Variables, Values & Data Types; Operators & Expressions; Making Decisions with Conditionals; Repetition with Loops; Strings; Lists & Collections; Functions; Errors & Debugging; Putting It Together. Only Chapter 1 is written; Chapters 3–10 are shown as **planned** (no placeholder lessons) and Chapter 2 keeps its one existing lesson. No chapter locking. Details and status in COURSE_OUTLINE.md. Later changes to this order are proposed and logged here first.
- 2026-10-14 (Phase 6): Lessons end with a short "Key ideas" list (the Phase 6 brief asks for a concise recap). This replaces the earlier "no recap" guideline; TEACHING_GUIDELINES.md section 13 is updated.
- 2026-10-14 (Phase 6): "Arrange in order" activities use multiple-choice orders for now. A drag-to-reorder activity is a candidate for phase 7, not built yet.
