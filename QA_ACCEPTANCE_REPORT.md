# Glowcode QA Acceptance Report

Review date: 2026-10-14.
Reviewed: Phase 6 at `9c5be9d` (`feat/python-chapter-1`). Fixes and this report are on `qa/acceptance-review`, which branches from that commit; the retest results below are for the QA branch head.

## 1. State of the repository

| Item | Finding |
| --- | --- |
| Branches (local and remote) | `main`, `feat/lesson-experience`, `feat/reference-manual`, `feat/visualization-engine`, `feat/python-visualizations`, `chore/github-pages`, `feat/python-chapter-1`, plus `release/v0.1.0` and `v0.1-before-courses` on the remote. |
| Uncommitted work | None. The working tree was clean before the review started. |
| Merged into `main` | Phases 1–5 and the GitHub Pages setup (`main` = `b8c30bf`). |
| Pushed, not merged | Phase 6, Chapter 1 (`feat/python-chapter-1` = `9c5be9d`, CI green). |
| Phase 7 (Chapter 2) | **Does not exist** locally or on GitHub. No branch, no commits, no stash. Chapter 2 could not be reviewed as a phase (section 9). |
| What GitHub Pages serves | `main`, so the live site shows Phase 5 content. Phase 6 and these QA fixes are not deployed. |

The QA branch was cut from the latest completed feature set (Phase 6). All tests in this report ran against that code plus the fixes listed in section 5.

## 2. Environment

| | |
| --- | --- |
| Browser | Chromium 141.0.7390.37 (headless) driven by Playwright 1.56.0 (Python) |
| Viewports | desktop 1440×950/1000, tablet 820×1180, phone 375×812 and 360×780 (touch, mobile), plus reduced-motion and light/dark colour schemes |
| Runtime | Node 22.22.0, Python 3.13.16 (local checks), CI on GitHub Actions (`ubuntu-latest`, bun) |
| How the app was served | The cloud workspace can't reach the npm registry, so `bun install` and Vite can't run locally. Browser tests ran on a local bundle of the real source (esbuild, the real CSS and components) served on `localhost:4174`, with two stand-ins: a minimal router in place of TanStack Router, and placeholder icons for `lucide-react`. Screenshots therefore show circles instead of icons. The real Vite production build was checked only in CI. |
| Live site | `https://peterukor.github.io/glowcode/` isn't reachable from the workspace shell. The home page was fetched once with a web-fetch tool (HTML only, no JavaScript); nested URLs needed a permission prompt that went unanswered. |

## 3. Results at a glance

| Outcome | Count |
| --- | --- |
| **PASS** (independently verified) | 113 |
| **FAIL** (doesn't meet the requirement; still open) | 3 |
| **FAIL → fixed and retested** | 6 (counted in neither of the rows above) |
| **NOT VERIFIED** | 10 |

Six defects were found and fixed on this branch, each with a regression test or a re-run of the failing browser check. Three smaller defects (all P2) remain open and are listed in section 6.

Automated suites behind these results (section 7): 159 unit tests, 182 Python checks, 86 component tests (CI), and 337 checks in 8 browser suites that ran to completion. The checklist has 132 rows in total.

## 4. Acceptance checklist

Status key: **PASS**, **FAIL**, **NOT VERIFIED**. "Fixed" means the check failed at `9c5be9d` and passes after the fix named in section 5. Evidence files are in [`qa/evidence/`](qa/evidence); the browser scripts that produced each check ID are in [`qa/browser/`](qa/browser).

The exact programs in the review brief are developer-showcase walkthroughs added for this review (`src/data/acceptanceVisuals.ts`): `for number in [10, 20, 30]`, the same loop over 1, 5, 6 and 20 items, `score = score + 5`, `b = a` with `append`, and `a.copy()`. Like every other walkthrough, they're validated and replayed in real Python by `check:python`. The while-loop and `print(len("hello"))` programs already existed as demos (`while`, `py-nested-call`) with exactly the brief's code.

### 4.1 Technical correctness

| ID | Expected behaviour | Method | Actual result | Status |
| --- | --- | --- | --- | --- |
| T-1 | Type check passes | CI `bun run typecheck`; locally `tsc` with real React types | CI success. Locally 0 errors outside route files, which need the generated route tree. | PASS |
| T-2 | Lint passes | CI `bun run lint` | CI success. ESLint can't run locally. | PASS |
| T-3 | Unit tests pass | CI `bun run test`; locally all `*.test.ts` under Node | CI success; 159/159 locally | PASS |
| T-4 | Every example, debug error, practice solution and walkthrough matches real Python | `check:python` | 182/182 checks match Python 3.13.16; CI success | PASS |
| T-5 | Production build succeeds | CI `bun run build` (Vite) | CI success | PASS |
| T-6 | Build with the Pages base path (`/glowcode/`) works for this branch | The Pages workflow runs on `main` only | Not run for this branch. The last Pages deploy (`b8c30bf`, Phase 5) succeeded. | NOT VERIFIED |
| T-7 | Component tests pass | CI vitest + jsdom | CI success. Locally 77/86 in a Chromium stand-in; the 9 failures are role-by-name lookups the stand-in doesn't support, and the same tests pass in CI. | PASS |
| T-8 | No JavaScript errors while using the site | Playwright `pageerror` listener on every page and step visited | 0 errors across all suites | PASS |
| T-9 | Walkthrough data is valid and checked against Python, including the acceptance programs | `validateWalkthrough` on all walkthroughs; `check:python` replay | All valid; all replays match | PASS |

### 4.2 Visualization accuracy

**For loop** (`qa-for-number`: `for number in [10, 20, 30]: print(number)`). Each check reads the rendered SVG's state attributes and computed styles after every event, not just whether the component exists.

| ID | Expected behaviour | Actual result | Status |
| --- | --- | --- | --- |
| V-FOR-1 | Each item goes next → assign → body, then exit | `next, assign, body` ×3, then `exit` | PASS |
| V-FOR-2 | The whole loop structure stays visible | Decision, loop variable, body, after-loop node, and all edges present at every step | PASS |
| V-FOR-3 | The list is one long segmented outer box with item cells and real indexes | One `strip-box`, 3 cells, indexes 0–2 | PASS |
| V-FOR-4 | The next-item decision is visible and answered | "Next item available?" on every step; Yes on picks, No at the end | PASS |
| V-FOR-5 | The current item rises out of its cell | Computed `translateY(-11px)` on the picked cell only: `[-11,0,0]`, `[0,-11,0]`, `[0,0,-11]` | PASS |
| V-FOR-ANIM | Assignment moves visibly, not just as a colour change | Paused mid-animation: the chip is at a different transform (`matrix(1.05,…,177.7,274.7)`) from where it lands (`matrix(1,…,173,347)`). [midflight](qa/evidence/for-loop-assign-midflight.png), [landed](qa/evidence/for-loop-assign-landed.png) | PASS |
| V-FOR-6 | The active item glows; during the body it settles back into its cell | `raised` (glow + lift) while picked, then `active` with no lift | PASS |
| V-FOR-7 | A visual connection shows assignment to `number` | Travelling value chip (`loop-chip-travel`), lit Yes edge, lit loop-variable box | PASS |
| V-FOR-8 | The loop variable updates at the assign event | Variables view: none, then `10,10,10,20,20,20,30,30,30`; the box shows `?` before the first assignment | PASS |
| V-FOR-9 | The body activates after assignment, and its output appears then | Body lit and into-body edge lit at the body event; `10` printed there and not before | PASS |
| V-FOR-10 | The loop-back connection becomes active | "next item" edge lit when asking for items 2 and 3, not item 1 | PASS |
| V-FOR-11 | The exit path activates when the list is exhausted | Exit edge lit, Yes dimmed, decision False, after-loop node lit | PASS |
| V-FOR-12 | Iteration never removes items | 3 cells with values on every step | PASS |
| V-FOR-13 | Visited items look different from the current one | Visited cells faded with a ✓; 1 tick after lap 1, 3 at exit | PASS |
| V-FOR-14 | Output is `10, 20, 30` | Matches (and Python agrees) | PASS |
| V-FOR-15 | Previous restores the visual state exactly | Step 7 → Previous ×3 equals the state recorded at step 4 (cells, lifts, looks, variable, output) | PASS |
| V-FOR-16 | Reset restores step 1 exactly | Identical record | PASS |
| V-LABEL | The `for … in …` label fits inside the diagram | **Failed at `9c5be9d`** for 20 items: the label overflowed and both ends were clipped, hiding `for n in`. After the fix, all sizes fit at desktop and 360px (`for n in [1, 2, 3, 4, 5, 6, 7, 8, …, 20]`) | Fixed |

**Long collections** (`qa-for-1`, `qa-for-5`, `qa-for-6`, `qa-for-20`, every step):

| ID | Expected behaviour | Actual result | Status |
| --- | --- | --- | --- |
| V-WIN-1 | 1 item: shown, no ellipses | Window 0–0, no ellipses | PASS |
| V-WIN-5 | 5 items: all shown, no ellipses | Window 0–4 throughout | PASS |
| V-WIN-6 | 6 items: about 5 shown, ellipsis only on the hidden side | Windows 0–4 then 1–5; "…" appears only where an item is hidden | PASS |
| V-WIN-20 | 20 items: ≤5 shown, current always visible, ellipses only where hidden, real indexes | Held on all 61 steps | PASS |
| V-WIN-SHIFT | The window slides with the loop | 16 distinct windows seen. [window at item 10](qa/evidence/for-loop-20-items-window.png) | PASS |
| V-WIN-NARROW | Readable at 360px; the page doesn't scroll sideways | 0px page overflow; the diagram fits its card. [phone](qa/evidence/for-loop-20-items-phone.png) | PASS |

**While loop** (`count = 1` / `while count <= 3:` / `print(count)` / `count += 1`):

| ID | Expected behaviour | Actual result | Status |
| --- | --- | --- | --- |
| V-WHILE-1 | The initial assignment comes first | Step 1: `count = 1`, loop not started | PASS |
| V-WHILE-2 | The condition is evaluated 4 times, the last with `count` = 4 | True at steps 2, 6, 10; False at step 14 with `count` = 4 | PASS |
| V-WHILE-3 | The True path and the body light after each True check | Yes edge lit, body active | PASS |
| V-WHILE-4 | The variable updates only on `count += 1`, then loops back | `count` changes only at those events (→2, →3, →4), each followed by a check with the back edge lit | PASS |
| V-WHILE-5 | Exit path at the end; output `1, 2, 3` | Exit lit; output matches | PASS |
| V-WHILE-6/7 | Backward playback restores every state | Stepping back from the end gives the same diagram state and `count` at every step | PASS |

**Variables, references and functions**:

| ID | Expected behaviour | Actual result | Status |
| --- | --- | --- | --- |
| V-VAR-1 | `score = score + 5`: read, calculate and rebind are separate events | Phases read → calculate → assign | PASS |
| V-VAR-2 | The variable doesn't update early | `score` is 10, 10, 10, then 15 only after rebinding. [calculate](qa/evidence/score-calculate.png), [rebind](qa/evidence/score-rebind.png) | PASS |
| V-VAR-3 | Printing comes last | `15` appears only at the print event | PASS |
| V-REF-1 | `b = a; b.append(3)`: one list object with both names | One object, labelled with `a` and `b`, showing `[1, 2, 3]`. [evidence](qa/evidence/alias-one-list.png) | PASS |
| V-REF-2 | `.copy()` makes two distinct objects | Two objects; only `b`'s has `3`. [evidence](qa/evidence/copy-two-lists.png) | PASS |
| F-APPEND | `.append()` shows the changed list and its `None` return separately | Changes `[1, 2, 3]` and Returns `None` in separate boxes. [evidence](qa/evidence/append-changes-vs-returns.png) | PASS |
| F-LEN-1 | `print(len("hello"))`: `len` returns 5 before `print` runs | `len()` Returns 5, nothing printed yet, tail "goes into print()" | PASS |
| F-LEN-2 | Then `print(5)` displays it and returns `None` | Prints 5 and Returns None in separate boxes. [evidence](qa/evidence/nested-call-print.png) | PASS |
| F-PARAM | Arguments match parameters | `a = 2`, `b = 3` shown as argument → parameter | PASS |
| F-RET | A returned value isn't shown as printed output | `add` shows Returns 5 and no Prints box; 5 goes into `total` | PASS |
| F-LOCAL | Locals exist only during the call | `a`, `b` shown in `add`'s frame; afterwards the frame is a faded "finished: its variables are gone" card for one event | PASS |
| F-STACK | Nested calls stack and unwind | Frames per step `1,1,1,2,3,2,2,1,1`. [three frames](qa/evidence/call-stack-three-frames.png) | PASS |

**Collections and expressions** (showcase demos, all checked against Python):

| ID | Expected behaviour | Actual result | Status |
| --- | --- | --- | --- |
| C-LIST-1 | A list is a segmented container with correct indexes | One strip, indexes 0–3 | PASS |
| C-LIST-2 | Each mutation highlights the affected item | Changed, added, removed and selected states on 8 of 10 events; the other two are creation and printing | PASS |
| C-LIST-3 | `pop()` shows the item leaving, then the returned value | `removed` event, then a separate `returned` event | PASS |
| C-STR-1 | `word[1:4]` highlights exactly indexes 1–3 | `selected` on cells 1, 2, 3 only | PASS |
| C-STR-2 | Strings are never shown changing in place | Notes say "It can't be changed in place" and "word is unchanged"; no event changes `word` | PASS |
| C-STR-3 | Negative indexes are correct | `-1` shown with the last character | PASS |
| C-PREC | `4 + 3 * 2`: `*` is evaluated before `+` | Multiplication event before addition; result 10 | PASS |
| C-DICT | Dict lookup, replace, add and delete are each highlighted | Active, active, changed and added rows on the right events | PASS |
| C-SET-1 | Sets show no positional indexes | No index labels; caption "no positions, no guaranteed order" | PASS |
| C-SET-2 | `add` of an existing value changes nothing; membership is shown | "add(2) changes nothing"; `4 in seen` → True | PASS |
| C-TUPLE | Tuples use the tuple style | Strip uses the tuple tone | PASS |

### 4.3 Animation behaviour

| ID | Expected behaviour | Actual result | Status |
| --- | --- | --- | --- |
| AN-1 | The picked item physically rises, not just changes colour | V-FOR-5 (−11px transform) | PASS |
| AN-2 | The assigned value travels to the loop variable | V-FOR-ANIM (mid-flight position differs from the end) | PASS |
| AN-3 | Long collections slide rather than jump | Computed `transition: transform 0.38s` on the strip; over 22 steps of the 20-item loop it moves in 46px steps (one cell): 0, −46, −92, −138, −184, −230px | PASS |
| A-MOTION | Reduced motion: no lift, and the chip fades instead of travelling, while the item still reads as picked | Lift 0, cell still `raised`, animation `loop-chip-fade` | PASS |
| A-MOTION-UI | Reduced motion: no lesson-page animation runs longer than 50ms | 0 animated elements | PASS |
| AN-4 | Transitions feel smooth (subjective) | Screenshots and computed timings look right; nobody watched it in real time on a physical device | NOT VERIFIED |

### 4.4 Educational quality (Chapter 1)

All six lessons were read in full, both as source and as rendered pages at desktop and phone widths.

| ID | Criterion | Finding | Status |
| --- | --- | --- | --- |
| E-1 | Each lesson starts with a meaningful reason | Marking test papers, a robot pouring water, a "Hello, world!" tradition, a scoreboard, guessing vs tracing, and a review intro | PASS |
| E-2 | Beginner-level explanations; new terms introduced once, in bold, and linked | Program, statement, Python, function, string, integer, expression and evaluate are each introduced once and linked to the manual | PASS |
| E-3 | Code examples are valid Python | `check:python` | PASS |
| E-4 | Important lines are explained | `print`, the parentheses and the quotes are explained part by part in lesson 3; `10 + 5` in lesson 5 | PASS |
| E-5 | Accurate terminology: output vs return value; execution and evaluation | `print()` returns `None` and stores nothing; a SyntaxError runs nothing; a NameError stops after earlier lines have run. No box or memory analogies. | PASS |
| E-6 | Visualizations support the lesson | Lesson 1 has none; lessons 2–5 each use one view that matches their point | PASS |
| E-7 | Questions require reasoning; each one tests something different | **Failed:** lesson 3's walkthrough checkpoint repeated lesson 2's code-versus-output question. Replaced with "is the comma and space printed exactly?" | Fixed |
| E-8 | No giveaway questions in the review | **Failed:** "which line runs next" gave its answer away. It now includes a blank line and a sum, so it needs reasoning. | Fixed |
| E-9 | Useful feedback on every wrong answer | Every wrong choice in all 17 questions and 4 checkpoints has its own feedback (unit test) | PASS |
| E-10 | Hints and solutions appear at the right time | I-1 to I-8 | PASS |
| E-11 | Concise recap | One "Key ideas" list (3–6 items) per lesson | PASS |
| E-12 | Lessons build in order | Each lesson uses only earlier ideas, and `print()` is previewed in lesson 2 with a forward reference | PASS |
| E-13 | Site copy matches what the product does | **Failed:** the home page promised "Type real Python in a friendly editor"; the editor is deferred (roadmap phase 9). Copy corrected. | Fixed |
| E-14 | Chapter 2 (Phase 7) review | Phase 7 doesn't exist (section 9) | NOT VERIFIED |

### 4.5 Lesson interactions

| ID | Expected behaviour | Actual result | Status |
| --- | --- | --- | --- |
| I-1 | No answer or explanation before an attempt | Check answer disabled; no explanation; no "Show the answer" button | PASS |
| I-2 | Hint on request | Hint text appears | PASS |
| I-3 | Wrong answer: specific feedback, explanation still hidden | Matches | PASS |
| I-4 | Retry without a reload; the tried choice is ruled out | The ruled-out radio is disabled | PASS |
| I-5 | Right answer confirmed with the explanation | Matches | PASS |
| I-6 | Reveal the answer after a wrong try | "Here's the answer." plus the explanation | PASS |
| I-7 | Practice: hints one at a time; the solution behind a "have you tried?" step | Matches | PASS |
| I-8 | Reflection: the model answer only on request | Hidden, then visible | PASS |
| I-9 | Keyboard: Enter opens a walkthrough and focus moves into it | Matches | PASS |
| I-10 | Checkpoint: Next blocked; future output hidden | Next disabled; output shows only `Ready` | PASS |
| I-11 | Keyboard: choose with Space, check with Enter; the step stays hidden after a wrong choice | Matches | PASS |
| I-12/13 | Keyboard: ← and → step through as soon as the walkthrough opens | **Failed at `9c5be9d`:** focus lands on the title, which was outside the key handler, so → did nothing. Fixed; regression test added. | Fixed |
| I-14 | Previous, Next and Reset in walkthroughs | V-FOR-15/16, V-WHILE-6/7, e2e7 | PASS |

### 4.6 Navigation and progress

| ID | Expected behaviour | Actual result | Status |
| --- | --- | --- | --- |
| N-1 | Dashboard: Python card with chapter availability and Start; other courses "Coming soon" | "2 of 10 chapters available · 8 planned" | PASS |
| N-2 | Three-column desktop lesson layout | Contents, lesson and Ask Glow, left to right. [desktop](qa/evidence/desktop-lesson.png) | PASS |
| N-3 | Contents links open lessons; no locking | Matches | PASS |
| N-4 | Next and Previous lesson links | Matches | PASS |
| N-5 | Browser Back and Forward | Matches | PASS |
| N-6 | Chapters fold, with `aria-expanded` | Matches | PASS |
| N-7 | Chapter 2 opens without finishing Chapter 1 | Matches | PASS |
| N-8 | Completion persists after a reload (storage, banner, tick, "1 of 7") | Matches | PASS |
| N-9 | Dashboard offers Continue learning | Matches | PASS |
| N-10 | Manual round trip: popup → entry → Back returns to the same scroll position | 877px → 877px | PASS |
| N-11 | No broken internal links | Crawled 41 pages from home, courses, the manual and every lesson: 0 not-found pages | PASS |
| N-12 | Planned chapters are labelled and have no links | 8 "Planned" rows, 0 links, at desktop and phone (e2e7) | PASS |
| N-13 | Old saved progress pointing at a moved activity resumes cleanly | Opens lesson 1 at the top (e2e7) | PASS |
| N-14 | Mobile contents drawer opens, navigates and closes | e2e7 | PASS |

### 4.7 Responsive design

| ID | Expected behaviour | Actual result | Status |
| --- | --- | --- | --- |
| R-OVF-desktop | No page scrolls sideways at 1440px (12 pages) | 0px | PASS |
| R-OVF-tablet | Same at 820px | 0px. [tablet](qa/evidence/tablet-lesson.png) | PASS |
| R-OVF-phone | Same at 375px | 0px. [phone](qa/evidence/phone-lesson.png) | PASS |
| R-TABLET | Tablet: side panels collapse to buttons | Both panels hidden; Contents button shown | PASS |
| R-VIZ | Every showcase demo fits at every step (desktop and phone) | e2e6 41/41; collections suite C-OVF ×14 | PASS |
| R-ERR | Long error messages stay aligned on phones | Lines wrap at 375px, which shifts the `^` markers under the wrong characters (seen in Phase 6 screenshots) | FAIL (P2, open) |

### 4.8 Accessibility

| ID | Expected behaviour | Actual result | Status |
| --- | --- | --- | --- |
| A-FOCUS | Visible focus on every tab stop | First 45 tab stops of a lesson: each one's style changes when focused vs blurred | PASS |
| A-LABELS | Every control has an accessible name | 0 unnamed buttons, links or inputs | PASS |
| A-ALT | Images have alt text | 0 missing | PASS |
| A-STRUCT | One h1, page language, title | Matches | PASS |
| A-KEYS | Keyboard-only use of lessons and walkthroughs | I-9 to I-13 (after the fix) | PASS |
| A-CONTRAST-LESSON | Lesson and course pages meet WCAG AA in both themes | **Failed at `9c5be9d`:** planned-chapter rows 3.3:1, code-block labels 2.9:1, dark-theme primary buttons 3.1:1. All now ≥ 4.5:1. The only item left below AA on lesson pages is the *disabled* Check answer button, which WCAG exempts. | Fixed |
| A-CONTRAST-HOME | The home page meets AA | Light theme: the demo's type-coloured values (`1.62`, `True`, `"Ada"`…) are 2.25–3.0:1, and the teal "3" step tile is 2.4:1 | FAIL (P2, open) |
| A-CONTRAST-MANUAL | Manual pages meet AA | The "Programming concept" category pill is 3.95:1 (12px) | FAIL (P2, open) |
| A-SR | Screen-reader experience | Only the markup was checked (labels, `aria-live` notes, `sr-only` diagram descriptions). No screen reader was used. | NOT VERIFIED |

The contrast was computed for each element in Chromium, compositing semi-transparent colours over the real background. Gradient-filled headings ("Watch it come alive.") report 1:1 because the text fill is transparent; they were checked by eye and are readable, so they aren't counted as failures.

### 4.9 GitHub Pages

| ID | Expected behaviour | Actual result | Status |
| --- | --- | --- | --- |
| P-1 | Deploy workflow succeeds | Last Pages run (`b8c30bf`) succeeded | PASS |
| P-2 | Live home page responds with the right base path | The fetched HTML has the title "Glowcode · Watch your Python come alive" and the asset path `/glowcode/brand/…`. The live site is Phase 5. | PASS |
| P-3 | Direct lesson URL | The permission request went unanswered | NOT VERIFIED |
| P-4 | Direct manual URL | Same | NOT VERIFIED |
| P-5 | Refreshing a nested page (404.html fallback) | The workflow copies `index.html` to `404.html` (inspected), but the behaviour wasn't tested live | NOT VERIFIED |
| P-6 | Assets load | Needs a browser on the live site | NOT VERIFIED |
| P-7 | Browser navigation on the live site | Same | NOT VERIFIED |
| P-8 | Phase 6 is live | `main` doesn't include Phase 6 yet, by design (not merged) | NOT VERIFIED |

## 5. Defects found and fixed

| # | Priority | Problem (reproduction) | Cause | Fix | Regression test | Retest |
| --- | --- | --- | --- | --- | --- | --- |
| D1 | P2 | `for n in [1, …, 20]`: the label is clipped at both edges, so `for n in` disappears (desktop and phone) | The label is centred over the strip and drawn at full length, wider than the SVG | `fitIterable()` shortens a long iterable to fit: `[1, 2, 3, …, 20]` (`b1866f5`) | `src/visualizations/loops/strip.test.ts` | V-LABEL-1/5/6/20/PHONE pass |
| D2 | P2 | Lesson 3's checkpoint duplicated lesson 2's code-versus-output question | Written that way | New checkpoint on printing a string exactly, comma and space included (`189703b`) | `chapter-1.test.ts` | Unit tests pass |
| D3 | P2 | The review's "which line runs next" was answerable without thinking | Too simple | Blank line plus `print(4 + 4)` (`189703b`) | Answer test updated | Python check and unit tests pass |
| D4 | P2 | → does nothing right after opening a walkthrough, although its header says "← → keys step through" | Focus goes to the title, which sat outside the player's `onKeyDown` | Title row passed to the player as its `header` (`bbddcc4`) | `lesson-blocks.test.tsx` (fails before the fix, passes after) | I-12/13 pass in Chromium |
| D5 | P2 | Text below WCAG AA on lesson pages (3.3, 2.9, 3.1:1) | `/75` opacity, the `code-line` colour, and the dark theme's light primary behind white text | Full muted colour; `code-fg/75`; a deeper `--primary-button` in dark (`bf9604a`) | Browser contrast scan | A-CONTRAST-LESSON passes |
| D6 | P1 | The home page and meta descriptions promised an editor ("Type real Python in a friendly editor") | Copy predates the decision to make walkthroughs read-only | Copy describes reading and stepping through programs (`84872a7`) | (copy only) | Checked in the browser |

Supporting commit: `7f3a14e` adds the acceptance walkthroughs to the developer showcase, so the browser checks run on Python-verified data.

## 6. Known remaining problems

| # | Priority | Problem | Why it isn't fixed here |
| --- | --- | --- | --- |
| R1 | P2 | Home page demo values in type colours are 2.25–3.0:1 in the light theme; the teal step tile is 2.4:1 | The type colours (`--t-int`, `--t-str`…) are design-system tokens used across the app. Changing them is a design decision, not a bug fix. |
| R2 | P2 | The manual's category pill is 3.95:1 | Small and cosmetic; needs a colour choice |
| R3 | P2 | Long tracebacks wrap on phones and misalign the `^` markers | Needs horizontal scrolling inside the error box (a small component change); wrapping keeps it readable for now |
| R4 | Info | Chapter 2's existing lesson says "store the result" twice in feedback, while elsewhere it says names "refer to" values | Chapter 2 is Phase 7 scope; flagged for that review |
| R5 | Test infra | Local browser suites e2e, e2e2 and e2e3 from earlier phases use selectors for content Phase 6 moved | Their behaviours are re-covered by e2e7, qa_ui and qa_viz. The manual suite (e2e4) was retargeted and passes 59/59. |
| R6 | Process | The live site still shows Phase 5 | Phase 6 and this branch are deliberately not merged |

## 7. Automated verification

| Suite | Where | Result |
| --- | --- | --- |
| Type check | CI | success |
| Lint | CI | success |
| Unit tests | CI / local | CI success; 159/159 locally |
| Python correctness | CI / local | CI success; 182/182 locally |
| Production build (Vite) | CI | success |
| Component tests (vitest + jsdom) | CI | success (6 test files, 86 tests) |
| qa_viz.py (loops, windows, variables, references, motion) | local Chromium | 44/44 |
| qa_collections.py (lists, strings, precedence, dicts, sets, tuples; desktop and phone) | local Chromium | 27/27 |
| qa_fn.py (functions and call stack) | local Chromium | 7/7 |
| qa_ui.py (interactions, navigation, progress, link crawl, responsive, accessibility) | local Chromium | 34/36 (both failures are A-CONTRAST-HOME, listed above) |
| e2e7.py (Phase 6 Chapter 1, desktop and phone) | local Chromium | 88/88 |
| e2e6.py (Phase 5 visualizations, desktop and phone) | local Chromium | 41/41 |
| e2e4 (manual, retargeted to the moved content) | local Chromium | 59/59 |
| e2e5.py (Phase 4 engine) | local Chromium | 35/35 |
| e2e, e2e2, e2e3 (earlier phases) | local Chromium | stopped on selectors made stale by Phase 6 (R5) |

CI run `38624226157` on the QA branch passed every step. Its log bodies couldn't be downloaded through the workspace proxy, so CI test counts come from the test files rather than the log.

## 8. Not tested

- The live site beyond its home page HTML (P-3 to P-8).
- A real screen reader, or browsers other than Chromium (Firefox, Safari, mobile Safari).
- Physical devices; touch was emulated.
- Chapter 2 as a phase, because Phase 7 doesn't exist.
- The Playground and the developer showcase as student-facing pages. They were used only as test harnesses and crawled for broken links.

## 9. Chapter 2

Phase 7 doesn't exist on any branch, so the Chapter 2 priorities in the brief (assignment vs equality, types, type conversion, `input()` samples, NameError, the review) **could not be reviewed**. The one existing Chapter 2 lesson (`why-variables-exist`, from Phase 3) was crawled, renders without errors, uses the "name refers to a value" model, and has no box metaphor. R4 notes its wording.

## 10. Readiness

- **Chapter 1 and the visualization engine meet the agreed design** after the fixes above. The for-loop pop-out, the travelling assignment, the sliding windows and the while-loop evaluation all behave as specified, step by step, forwards and backwards.
- **Don't start Chapter 3 yet.** Chapter 2 (Phase 7) is next in the outline and hasn't been written. Chapter 3 assumes variables and types.
- Before Phase 7: review and merge Phase 6 and this QA branch (or cherry-pick the fixes) so the live site shows Chapter 1, then verify P-3 to P-7 on the deployed site.
- R1–R3 are worth a small polish pass, but none of them blocks learning.
