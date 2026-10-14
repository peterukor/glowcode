# QA evidence and browser checks

Material behind [`QA_ACCEPTANCE_REPORT.md`](../QA_ACCEPTANCE_REPORT.md).

- `evidence/`: screenshots taken in Chromium during the review. Each one is linked from the
  checklist row it supports.
- `browser/`: the Playwright (Python) scripts that produced the check IDs in the report.
  They expect a built copy of the site at `http://localhost:4174`. To run them against the dev
  server, start `bun run dev -- --port 4174`, then run, for example, `python3 qa/browser/qa_viz.py`
  (they write logs and screenshots to `./qa/` in the current directory). They depend on the
  acceptance walkthroughs in `src/data/acceptanceVisuals.ts`, which appear in the developer
  showcase at `/dev/visualizations?w=<id>`.

These scripts aren't part of CI.
