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

## Future visualization integration

A code example opts in with `walkthrough: Walkthrough` (`src/types/trace.ts`):

```ts
Walkthrough = { id, title, language, code, visualizations: VisualizationKind[], steps: TraceStep[], ifChain? }
TraceStep   = { line, vars, output?, note, highlight?, evaluation?, returned?, loopIndex?, ifChain?, calc?, call?, checkpoint? }
```

Design rules that keep this extensible without a giant schema:

- **One step = one small execution event.** A line can appear in many steps (loops) and one line
  can take several steps (`age = age + 1` is "evaluate `age + 1` → 13 + 1 → 14", then "assign").
- **Before/after state** comes from consecutive steps: `vars` is the state after the step.
- **Core fields stay small; each visualization adds its own optional payload.** The conditional
  flow tree already works this way (`ifChain` structure on the walkthrough + `ifChain` results
  on each step, including short-circuited comparisons). Function-call diagrams (arguments →
  name → return / printed / mutated / `None`) and loop iteration views should follow the same
  pattern. `calc` (old value → operation → result → assignment) and `call` (inputs →
  function → returns / prints / changes → stored in) are drawn by `CalculationView` and
  `FunctionView`; the conditional flow uses `ifChain`; loops use `loopItems` + `loopIndex`.
- **Predictions are data, not a separate player.** A step's `checkpoint` makes the player
  stop on the previous step (`usePlayback`'s `isBlocked`), ask, and reveal on request.
  Answers live in the player's state while it's open; they aren't saved to progress.
- **Diagrams keep their shape.** Within one call, calculation or if-chain, every part is
  drawn from the first step; steps only change what glows (`data-on` / `data-look`).
- Visualization components live in `src/visualizations/` and receive data; they never contain
  lesson content.

`WalkthroughPlayer` (`src/components/walkthrough/`) is the one read-only player, used by both
the playground and lessons: Previous / Next / Reset first, optional autoplay and speed; code with
line numbers, the current line highlighted and its position ("Running line 3 · same line,
next step"), plus the printed output, on the left; a value a step returns (`returned`) is shown
as its own "Returned" chip, never mixed into printed output; the visualization,
the evaluation chain and the explanation on the right; a variables card under non-variable views.
Arrow keys step through. It never edits or runs code.

In a lesson, "Walk through code" expands the player **inside the page**, in place of the snippet,
so the reading position never moves. It breaks out of the ~68ch text width to use the whole
reading column (`.breakout`, sized with container query units). The player lays itself out by
its own width (a CSS container query), not the window's: side by side when it has at least
40rem, otherwise stacked as code → visualization → console. "Close" collapses it and returns
focus to the button that opened it.

The playground (`/playground`, `src/data/examples.ts`) keeps the existing demos (variables,
if/else, elif, and/or, loop, lists, functions). They already use the `Walkthrough` shape, so they
can move into lessons as those lessons are written.

### Not supported yet

These need new data or views, so walkthroughs explain them in the note text instead of drawing
them: nested calls (`print(len(word))` as one diagram), a call stack for functions that call
functions, `while` loops in the loop view (it shows `for` laps over known items), objects
shared between two names (aliasing of lists), and the collections view still reads a few
demo-specific details. The diagrams also don't animate values travelling along arrows; parts
light up instead.

## Manual / reference integration

`src/references/registry.ts` holds a minimal set of entries (`id`, `title`, `category`, `summary`).
IDs follow `<language|concept>.<category>.<name>`, with methods under their type, e.g.
`python.types.list.append`, matching the planned manual tree (Data Types → Lists → append()).

Lessons link terms inline with `[label](ref:id)` and list related entries in
`lesson.references`; `ReferenceId` is a union of known ids, so a typo in `references` is a type
error, and inline typos fail `validateCourses`. `ReferenceLink` shows the summary on hover,
keyboard focus or tap. Phase 3 adds full reference pages and a "See more" link in the tooltip.

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
