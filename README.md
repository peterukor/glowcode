# Glowcode

An interactive, visual-first platform that teaches complete beginners to program and to think
like programmers. Students read short, friendly lessons, answer prediction and debugging
questions, and step through code walkthroughs that show what every line does.

Courses are independent and grow alongside a live bootcamp:

| Course | Status |
| --- | --- |
| Python Fundamentals | Active (2 sample lessons) |
| Version Control with Git & GitHub | Coming soon |
| Computer Fundamentals | Coming soon |
| Java Fundamentals | Coming soon |

## Setup

```sh
bun install      # or npm install
bun run dev      # http://localhost:5173
```

| Script | What it does |
| --- | --- |
| `dev` | Start the dev server (also regenerates `src/routeTree.gen.ts`) |
| `build` | Type-check, then build a static site into `dist/` |
| `preview` | Serve the production build locally |
| `test` | Unit tests (Vitest): content validation, progress, navigation, flow tree, routing |
| `typecheck` / `lint` / `format` | TypeScript, ESLint, Prettier |

Stack: React 19, Vite, TanStack Router (file routes), Tailwind CSS v4, lucide icons. No backend,
no database, no accounts: progress is saved in the browser. When hosting, serve `index.html` for
unknown paths so deep links like `/courses/python-fundamentals/why-variables-exist` work.

## Structure

```
src/
  courses/        course content (TypeScript) + registry + validation
  progress/       student progress: pure logic, versioned storage, React hooks
  references/     the reference manual: entries, search, safe code links, inline explanations
  routes/         pages: /, /courses, /courses/:course, /courses/:course/:lesson, /reference, /reference/:entry, /playground
  components/     course/ (cards, sidebar), lesson/ (layout, blocks, Ask Glow), reference/ (manual pages),
                  walkthrough/ (the step-by-step player shared with the playground), shared UI
  visualizations/ variable boxes, conditional flow tree, loops, lists, functions
  types/          Python values, walkthrough and trace-step contracts
  data/           playground demo walkthroughs
```

The full explanation is in [GLOWCODE_ARCHITECTURE.md](GLOWCODE_ARCHITECTURE.md). What makes a
good lesson is in [TEACHING_GUIDELINES.md](TEACHING_GUIDELINES.md), and how to add one, step by
step, is in [LESSON_AUTHORING.md](LESSON_AUTHORING.md).

## Development workflow

**Add a lesson:** follow [LESSON_AUTHORING.md](LESSON_AUTHORING.md). In short: create
`src/courses/<course>/chapters/<chapter>/lessons/<lesson-id>.ts`, add it to that chapter's
`lessons` array, keep it `draft` while writing, then publish it.
Run `bun run test`; the content validator catches duplicate ids, broken reference links,
wrong answer keys and broken walkthroughs. Then run `bun run check:python`, which runs every
example in real Python (needs `python3`) and checks the output, variables and error messages
match what the lesson shows. CI runs both.

**Add a course:** create `src/courses/<course-id>/course.ts` and add it to
`src/courses/registry.ts`.

Neither needs a new page, route or component.

**Walkthroughs:** attach `walkthrough: { id, title, language, code, visualizations, steps }` to a
code block and the lesson gets a "Walk through code" button that opens the step-by-step player
right there in the lesson. Verify every step by hand: the walkthrough must show exactly what
Python does.

**Who can add content:** courses and lessons live in this repository, so only people who can
change the code and deploy can add or edit them. There is no in-app editor for students.

## Commits and branches

Commits follow [Conventional Commits](https://www.conventionalcommits.org): `type: short summary`
in the imperative, lowercase, no period.

| Type | Use for |
| --- | --- |
| `feat` | a new feature students or authors can see |
| `fix` | a bug fix |
| `content` | adding or editing course and lesson content |
| `refactor` | code changes that don't change behavior |
| `style` | formatting only |
| `docs` | documentation |
| `test` | adding or fixing tests |
| `ci` | GitHub Actions and other automation |
| `chore` | dependencies, config and other upkeep |

Add a scope when it helps: `feat(playground): add Python tracer`, `content(python): add loops lesson`.

Branches use the same types: `feat/python-tracer`, `fix/sidebar-focus`, `content/python-loops`,
`chore/update-deps`. Snapshots of past versions live on `release/<version>` branches
(`release/v0.1.0` is the playground before the courses system).
