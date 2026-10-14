# Glowcode Architecture

This describes the code as it exists after Phase 1. Content is plain TypeScript data;
React components only decide how it looks.

```
src/
  courses/                      ← all course content + the rules for reading it
    types.ts                    Course, Chapter, Lesson, blocks, publication status
    registry.ts                 the list of courses (dashboard order)
    queries.ts                  pure helpers: published lessons, neighbors, validation
    richText.ts                 inline markup parser (`code`, **bold**, [term](ref:id))
    python-fundamentals/
      course.ts
      chapters/<chapter-id>/chapter.ts
      chapters/<chapter-id>/lessons/<lesson-id>.ts
    version-control/course.ts   ┐
    computer-fundamentals/…     ├ Coming Soon, no chapters yet
    java-fundamentals/…         ┘
  progress/
    progress.ts                 progress data + pure functions (visit, complete, summarize)
    storage.ts                  versioned localStorage store (swappable)
    useProgress.ts              the app's stores + React hooks
  references/
    registry.ts                 minimal reference entries with stable ids
    ReferenceLink.tsx           hover / focus / tap definition for a term
  routes/                       TanStack file routes (see Routing)
  components/
    course/                     CourseCard, CourseProgress, CourseSidebar, theme
    lesson/                     LessonLayout, LessonHeader, LessonBody (+ blocks),
                                CodeExample, QuestionActivity, PracticeActivity,
                                LessonNavigation, AssistantPanel, RelatedReferences, RichTextView
    walkthrough/                WalkthroughPlayer (shared by lessons and the playground)
    Drawer.tsx, CodeView.tsx, PlaybackControls.tsx, SiteHeader.tsx
  types/                        Python values, trace steps, walkthroughs, if-chains
  visualizations/               existing visual components (variables, flow tree, loops…)
  data/examples.ts              playground demos (walkthroughs not yet tied to lessons)
```

## Course architecture

`Course → Chapter[] → Lesson[] → LessonSection[] → Block[]` (`src/courses/types.ts`).

- **IDs** are stable, lowercase-with-dashes strings. They're used in URLs and progress, and must
  never change once students have progress. Array indexes are never stored anywhere.
- **Order** is array order. Reordering lessons is safe because nothing persists positions.
- **Publication status** applies to courses and lessons:

  | status | listed? | openable? |
  | --- | --- | --- |
  | `published` | yes | yes |
  | `coming-soon` | yes (dimmed, "Soon") | no |
  | `draft` | no | no, not even by URL |

  A course that isn't `published` has no openable lessons, whatever its lessons say.

- **Blocks** a lesson can use:
  - `text`, `list`
  - `callout` with a tone: real-world, execution, mindset, tip, careful, other-languages
  - `code`: read-only snippet with language label, line numbers, optional `highlightLines`,
    caption, printed `output` and `walkthrough`
  - `figure`: a static illustration (`variables` boxes, `names` pointing at values, or a
    `sequence` of steps)
  - `question` (predict or debug): per-choice feedback, optional hint and `errorOutput`,
    retry, and an explanation revealed after a correct answer or on request
  - `reflect`: an open "think it through" prompt with a model explanation to compare with
  - `practice`: goal, context, self-check list, progressive hints, a gated sample solution,
    the reasoning behind it and alternative approaches. Nothing is run or auto-checked.

  Activities (`question`, `reflect`, `practice`) carry ids unique within their lesson.
  Attempting an activity records it for "resume"; only "Mark complete" completes a lesson.
- **Inline text** uses a tiny markup: `` `code` ``, `**bold**`, `[label](ref:reference.id)`.
  This is the only parsing in the content system; MDX wasn't worth its build complexity yet.

## Content registry and validation

`courses/registry.ts` lists every course. `courses/queries.ts` answers questions about content
(`publishedLessons`, `findPublishedLesson`, `lessonNeighbors`, `visibleChapters`,
`walkthroughsIn`, `activitiesIn`) and checks it:

`validateCourses()` reports duplicate ids (courses, chapters, lessons, sections, activities,
walkthroughs), non-URL-safe ids, unknown reference ids (in `references` or inline text),
answers that aren't among a question's choices, duplicate choice ids, highlighted lines
outside the snippet, walkthrough code that differs from the code
shown, and walkthrough steps pointing at lines that don't exist. The test suite fails on any
problem, so broken content never ships.

## Routing

| URL | File | What it does |
| --- | --- | --- |
| `/` | `routes/index.tsx` | landing page |
| `/courses` | `routes/courses.index.tsx` | course dashboard |
| `/courses/:courseId` | `routes/courses.$courseId.index.tsx` | redirects to the last visited lesson (at the last activity) or the first published lesson; Coming Soon courses render a friendly page |
| `/courses/:courseId/:lessonId` | `routes/courses.$courseId.$lessonId.tsx` | **every** lesson, rendered from its content |
| `/playground` | `routes/playground.tsx` | the existing demo player |
| `/reference` | `routes/reference.index.tsx` | the manual's home: search (`?q=` keeps the query for Back / Forward) and browse |
| `/reference/:entryId` | `routes/reference.$entryId.tsx` | **every** manual entry, rendered from its data; unknown ids get a "did you mean" page |

Unknown courses, unknown lessons, drafts and lessons of unpublished courses all show not-found.
`src/routeTree.gen.ts` is generated by the TanStack Router Vite plugin; don't edit it by hand.

## Lesson rendering

`LessonPage` (the lesson route) loads the course and lesson, records the visit, and composes:

```
LessonLayout
├─ left:   CourseSidebar        chapters, lessons, current + completed marks, progress
├─ center: LessonHeader         chapter, title, objectives
│          LessonBody           sections → blocks (RichTextView, CodeExample, QuestionActivity…)
│                               CodeExample expands into a WalkthroughPlayer in place
│          RelatedReferences    "Look it up"
│          LessonNavigation     Mark complete, Previous / Next
└─ right:  AssistantPanel       Ask Glow (visual shell)
```

**Layout:** from 1280px the page is three columns. Each side panel independently collapses to a
slim rail and reopens; the center column widens (the grid animates its columns). Text stays at a
comfortable ~68 characters per line. Panel choices persist (`glowcode:prefs`). Below 1280px both
panels become native `<dialog>` drawers (focus trap, Escape, backdrop), opened from a toolbar.

## Progress model

Stored per course id (`src/progress/progress.ts`):

```ts
{ lastLessonId?, lastActivity?: { lessonId, activityId }, lastVisitedAt?, completed: { [lessonId]: isoTime } }
```

- Opening a lesson updates `lastLessonId` / `lastVisitedAt`. It never completes it.
- Answering a question, opening a practice hint/solution, or opening a walkthrough records
  `lastActivity`.
- Completion is explicit ("Mark lesson complete") and keeps its first timestamp when revisited.
- Percentages count **published lessons only**. Completed ids for lessons that are unpublished
  or not added yet are kept, never erased, and simply don't count.
- Resume: the course link and "Continue learning" go to the last lesson, scrolled to the last
  activity (`#activity-<id>`) if it was in that lesson; otherwise the first published lesson.

**Storage** (`src/progress/storage.ts`): `createVersionedStore` saves `{ version, data }` under
`glowcode:progress`. Corrupted JSON, unknown shapes and data from a *newer* version are backed up to
`glowcode:progress:backup` and replaced with empty progress instead of crashing. Older versions
pass through `parse(data, fromVersion)`, which is where migrations go. `parseProgress` keeps every
valid entry and drops malformed ones. Other tabs are kept in sync via the `storage` event.

To move progress to accounts later, replace the store behind `progressState` in
`useProgress.ts`; components only use the hooks and `progressActions`.

## Visualization engine

One read-only engine plays every walkthrough: lessons, the playground, the manual and the
developer showcase. How to write walkthroughs is in
[`VISUALIZATION_AUTHORING.md`](./VISUALIZATION_AUTHORING.md); this section is how it fits
together.

It has three layers, each in its own place:

| Layer | Where | Responsibility |
| --- | --- | --- |
| A. Execution data | `src/types/trace.ts` | What happened: a `Walkthrough` is code plus a list of `TraceStep` events. Each event holds the full state *after* it (line, variables, output so far) plus focused extensions for the diagram it feeds. |
| B. Playback controller | `src/walkthrough/controller.ts`, `src/hooks/usePlayback.ts` | Which event is on screen and what the student did at predictions. A pure reducer (`next`, `prev`, `reset`, `check`, `reveal`) and `viewPlayback()`, which derives everything a screen needs. The hook adds optional autoplay. |
| C. Renderers | `src/visualizations/`, `src/components/walkthrough/` | Draw one event. `WalkthroughPlayer` lays out code, output, diagram and explanation; `ExampleVisualization` picks the renderer for a view. Renderers receive data and never interpret code. |

**Events, not lines.** A step is one execution event. `count = count + 2` is three events on
line 2 (read the value, calculate, rebind); a loop revisits its lines; `linePosition()` tells
the student when the line didn't simply move on.

**Deterministic screens.** Every event carries complete state, and the screen is derived from
`walkthrough.steps[index]` plus checkpoint records. Nothing accumulates while stepping, so
Previous, Next and Reset always reproduce the same picture; tests compare the markup.

**Focused extensions, explicit active state.** Each diagram reads its own extension, and what
glows is derived from that state, never from note text or line numbers:

| Extension | Shape (on the walkthrough) | State (on each step) | Renderer |
| --- | --- | --- | --- |
| variables | | `vars`, `highlight`; reading names come from `calc` | `VariablesPanel` (names → values; "reading", "changed", "was 3", "changed in place"; names sharing an object drawn together) |
| calculation | | `calc` (`read` / `calculate` / `assign`; `tree`, `active`, `done` for precedence) | `CalculationView` (an SVG expression tree when `tree` is set) |
| function call | | `call` (`call` / `run` / `result` / `assign`; `params`, `argFrom`, `feeds` for nested calls) | `FunctionView` (SVG flow: inputs → function → returns, prints and changes in separate slots) |
| if / elif / else | `ifChain` (branches, `and` / `or` trees with condition ids) | `ifChain.results` (only what Python evaluated) + `at` | `ConditionalFlow` (full tree; `state.ts` derives taken, skipped and short-circuited parts) |
| for loop | `forLoop` (target, iterable, kind, items, body, after) | `forLoop` (`next` / `assign` / `body` / `exit`, `index`, `bodyLine`) | `ForLoopView` (SVG flowchart joined to the iterable; the picked value travels) |
| while loop | `whileLoop` (setup, condition, body, after) | `whileLoop` (`checks`, `at`, `result`, `bodyLine`) | `WhileLoopView` (same flowchart parts) |
| older for loops | `loopItems` | `loopIndex` | `LoopView` |
| collections | | `element`, `slice`, `mutation`, `membership`; object ids in `vars` | `CollectionsView` (SVG: name tags with arrows into lists, tuples, dicts, sets) |
| call stack | | `frame`, `callers` | `CallStackView` (stacked frame cards, call and return arrows) |
| prediction | | `checkpoint` (asked before the step is shown) | `WalkthroughCheckpoint` |

**Full diagram, nothing premature.** Each renderer draws the whole structure from the first
event and changes only what glows (`data-on`, `data-look`, `data-skipped`). Results appear only
in the event that produces them: a calculation shows `?` while reading, a call's outputs stay
`?` until `result`, a while check shows True/False only once checked, and the flowchart marks
comparisons only once they're in `results`.

**One visual language.** Every diagram sits on one dark stage (`.viz-stage`, the code editor's
ink, in both themes) and is SVG built from the flow tree's parts: boxes, frames with tabs,
routed connectors with arrowheads, pills on lines, a decision diamond. Looks are shared
(`data-look`: `idle`, `lit`, `true`, `false`, `done`, `dim`): what Python is doing glows with a
moving sparkle, earlier work stays solid, skipped parts are dashed and faded. Every state also
has words (✓ / ✗, "check 2", "waiting for double(4)", "was 0"), so nothing relies on color.
Geometry is pure and shared (`src/visualizations/flow/geometry.ts`, `loops/loopLayout.ts`).
Long sequences show a five-item window derived from the focus (`collectionWindow.ts`). Motion
explains a change (a value travelling, an item lifting out, a frame leaving), uses strong
custom curves, and becomes a fade under `prefers-reduced-motion`. Diagrams keep a readable
minimum size and scroll sideways in a focusable region on narrow phones.

**Checking walkthroughs.** `validateWalkthrough()` (`src/walkthrough/validate.ts`) checks the
data itself: structure, views that have their data, notes, values, no change before an assign
event, stored values that match results, Python's evaluation order and short-circuiting, and
loop progress. `validateWalkthroughs()` adds app-wide unique ids, and a test runs it over every
walkthrough (`src/walkthrough/catalog.ts`). `bun run check:python` replays each walkthrough
against a line-by-line recording of the real run (`src/walkthrough/replay.ts`), including
inside functions and generators: lines in order, state after every event, which names share
one object (Python's `id()`), every frame on the call stack, calculations, expression-tree
nodes, operand values, membership tests and every condition.

**Developer showcase.** `/dev/visualizations` plays every real walkthrough with the student
player and shows whether its data validates. It isn't linked from student pages.

**The future editor.** The editable IDE is postponed, not canceled. Renderers already depend
only on `Walkthrough` / `TraceStep` data, and notes are optional, so a language tracer can feed
the same player. A Python tracer would record line events (as `scripts/check-python.ts` already
does, with frames and object ids) and turn them into steps: `vars` and `output` directly,
`calc` for assignments, `ifChain` results from evaluated comparisons, `forLoop` / `whileLoop`
from loop events, `call`, `frame` and `callers` from call and return events, `mutation` from
method calls on collections. `replay.ts` shows how recorded events line up with steps. Java would get its own
tracer producing the same shape. Nothing in the engine edits or runs code today.

In a lesson, "Walk through code" expands the player **inside the page**, in place of the snippet,
so the reading position never moves. It breaks out of the ~68ch text width to use the whole
reading column (`.breakout`, sized with container query units). The player lays itself out by
its own width (a CSS container query), not the window's: side by side when it has at least
40rem, otherwise stacked as code → visualization → console. "Close" collapses it and returns
focus to the button that opened it.

### Not supported yet

Classes and objects, imports, exceptions inside walkthroughs, recursion deeper than a few
frames, and nested collections (a list inside a list is shown as its printed value). Walkthroughs
with `input()` are checked against Python by their final state only.

## Reference manual

The manual answers quick questions ("what does `.upper()` return?") while lessons teach in
order. It shares the lesson page's layout (`LessonLayout`: contents left, Ask Glow right,
drawers on mobile) and adds no new layout system.

**Registry** (`src/references/`, plain data and pure functions, no React):

| File | What it holds |
| --- | --- |
| `types.ts` | `ReferenceEntry`: required `id`, `scope`, `category`, `title`, `summary`, `explanation`; optional `aliases`, `keywords`, `parent`, `syntax`, `parameters`, `accepts`, `returns`, `prints`, `changes`, `examples`, `mistakes`, `related`. Fields that don't apply are left out. |
| `entries/concepts.ts`, `entries/python.ts` | the content, one file per scope |
| `registry.ts` | `getReference(id)`, `allReferences`, `methodsOf(typeId)`, `referenceTree()` (scope → category → entries, methods nested under their type), `breadcrumb()`, `referencePath()` |
| `validate.ts` | `validateReferences()`: ids, scopes, categories, methods attached to an existing type of the same language, callables stating returns / prints / changes, related and inline links that resolve, walkthroughs that match their example |
| `search.ts` | `searchReferences(query)`: local ranked search |
| `codeLinks.ts`, `code/pythonTokens.ts` | `findCodeReferences(code, language)`: which words in a snippet safely link to an entry |
| `navigation.ts` | `ReferenceNavigationContext` (how "See more" opens a page) and the `from` / `hops` origin carried in the URL |

**IDs** follow `<scope>.<group>.<name>`: `concept.variable`, `python.builtins.print`,
`python.keywords.if`, `python.errors.NameError`. Methods live under their type,
`python.types.str.upper`, and set `parent: "python.types.str"`, so the navigation, breadcrumbs
and "Methods of str" lists all come from the data. IDs used before the manual existed are
unchanged.

**Search** scores every entry on each keystroke (the manual is small; no index or dependency).
Each query word must match a title, alias, keyword, the summary, or for a method its type's
names, so "string uppercase" finds `str.upper()` and "list add item" finds `list.append()`.
Whole-word matches beat prefixes, which beat substrings; title > alias > keyword > summary; an
exact or leading match of the whole query gets a bonus. Simple plurals match singulars.

**Explanations inside lessons.** `ReferenceLink` (used for `[label](ref:id)` in any rich text)
opens a small card on hover, keyboard focus or tap, with the title, summary and "See more". The
card is portalled with fixed positioning, so text never shifts and scrolling code doesn't clip
it; Escape or a tap elsewhere closes it and returns focus. Screen readers get the summary as
the term's description. Unknown ids render as plain text (tests catch them).

**Code examples** link words through `findCodeReferences`, which is deliberately conservative:
a built-in only when it's called, isn't after a dot, and the snippet never binds that name
(`print = 5`, `def print`, loop variables, `import *` all switch it off); a keyword only at the
start of a statement (`else` only when it closes an `if`); a method only when the receiver's
type is certain (a string literal, or a name whose every assignment is a literal, `input()` or
`str()`). Strings and comments never link. Anything uncertain stays plain text. It's a small
tokenizer, not a parser; that's enough for read-only beginner snippets.

**Navigation and coming back.** The root route provides a `ReferenceNavigationContext` that
turns "See more" and related links into client-side navigations carrying `?from=<lesson
path>&hops=<n>`. "Back to <lesson>" goes back `hops` steps in history, which restores the
lesson's scroll position; for a shared link with no history it opens the lesson. `from` only
accepts `/courses/<course>/<lesson>` paths. Reading the manual never records lesson activity or
completion: manual examples pass a no-op activity handler.

**Visualizations** are reused, not rebuilt: an example's `call` is drawn by `FunctionView`
(returns, prints and changes in separate slots), and an example can embed an existing curated
walkthrough (the `len`, `reassign`, `if-else`, `elif` and `loop` demos) by reference. The
validator checks the walkthrough's code matches the example; `check:python` runs every example
and every mistake's code in real Python.

**Java later.** Add `entries/java.ts` with `scope: "java"` entries (`java.types.String.toUpperCase`
with `parent: "java.types.String"`), include it in `registry.ts`, and add a `java` branch to
`findCodeReferences` when Java snippets need links. Scopes, categories, the tree, search and
pages need no changes. Categories are shared; add one to `ReferenceCategory` only if Java needs
a group Python doesn't have.

**The future IDE** can reuse the registry as-is: `getReference(id)` and `searchReferences()`
for a help panel, `findCodeReferences(code, language)` for hover help over editor text (it works
on plain text, offsets per line), and `ReferenceLink` / `ReferenceEntryView` inside any React
host that provides a `ReferenceNavigationContext` (or none, for plain hrefs). Nothing in the
reference system depends on the lesson renderer or the router.

## Ask Glow

`AssistantPanel` is the visual shell. It's honest that the assistant isn't available, and it
receives an `AssistantContext` (course, lesson, objectives, and the walkthrough when one is open).
To switch it on later, implement `AskGlow = (question, context) => Promise<string>` and pass it as
`onAsk`; the suggestions and input enable themselves.

## How to add a course

1. Create `src/courses/<course-id>/course.ts` exporting a `Course` with `status: "coming-soon"`
   and `chapters: []`.
2. Add it to `courses` in `src/courses/registry.ts`.
3. When its first lesson is ready, add a chapter (below) and set the course to `"published"`.

## How to add a chapter or lesson

See [`LESSON_AUTHORING.md`](./LESSON_AUTHORING.md) for the full guide, with a complete example
and the four lesson patterns, and [`TEACHING_GUIDELINES.md`](./TEACHING_GUIDELINES.md) for the
writing standard. In short: create the lesson file, add it to its chapter's `lessons`, keep it
`draft` while writing, and run `bun run test`.

No new page, route, component or progress change is needed.
