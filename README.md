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
  references/     reference / glossary entries and the inline term tooltip
  routes/         pages: /, /courses, /courses/:course, /courses/:course/:lesson, /playground
  components/     course/ (cards, sidebar), lesson/ (layout, blocks, Ask Glow),
                  walkthrough/ (the step-by-step player shared with the playground), shared UI
  visualizations/ variable boxes, conditional flow tree, loops, lists, functions
  types/          Python values, walkthrough and trace-step contracts
  data/           playground demo walkthroughs
```

The full explanation is in [GLOWCODE_ARCHITECTURE.md](GLOWCODE_ARCHITECTURE.md). How lessons
should be written is in [TEACHING_GUIDELINES.md](TEACHING_GUIDELINES.md).

## Development workflow

**Add a lesson:** create `src/courses/<course>/chapters/<chapter>/lessons/<lesson-id>.ts`,
add it to that chapter's `lessons` array, keep it `draft` while writing, then publish it.
Run `bun run test`; the content validator catches duplicate ids, broken reference links,
wrong answer keys and walkthrough steps that point at missing lines.

**Add a course:** create `src/courses/<course-id>/course.ts` and add it to
`src/courses/registry.ts`.

Neither needs a new page, route or component.

**Walkthroughs:** attach `walkthrough: { id, title, language, code, visualizations, steps }` to a
code block and the lesson gets a "Walk through code" button that opens the step-by-step player
right there in the lesson. Verify every step by hand: the walkthrough must show exactly what
Python does.

**Who can add content:** courses and lessons live in this repository, so only people who can
change the code and deploy can add or edit them. There is no in-app editor for students.
