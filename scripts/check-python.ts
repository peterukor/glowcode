/// <reference types="node" />
/**
 * Runs every Python example in the app through real Python and checks it against what the
 * lesson or walkthrough claims:
 *
 * - code blocks: the printed output matches `output`
 * - walkthroughs (lessons, playground, manual): the printed output matches the last step, and
 *   the final variables match the last step's `vars`; then every step is replayed against a
 *   line-by-line recording of the real run (src/walkthrough/replay.ts): the order of lines,
 *   the variables and output after each event, each calculation and its operand values, and
 *   every condition the walkthrough says was True or False
 * - debug questions: the program fails with exactly the error shown in `errorOutput`
 * - predict questions: the answer matches the first line the program prints
 * - practice solutions: they run without errors
 * - reference entries: example output, and each mistake's error (last line) or output
 *
 * Usage: bun run check:python   (needs python3 on the PATH)
 */
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { courses } from "@/courses/registry";
import type { Block } from "@/courses/types";
import { examples } from "@/data/examples";
import { allReferences } from "@/references/registry";
import type { PyValue, Variables } from "@/types/python";
import type { Walkthrough } from "@/types/trace";
import { matchRecording, replayable, type EvalRequest, type RecordedEvent } from "@/walkthrough/replay";

type Run = { stdout: string[]; stderr: string; ok: boolean; vars: Record<string, unknown> };

const dir = mkdtempSync(join(tmpdir(), "glowcode-py-"));
const problems: string[] = [];
let checked = 0;

// Saves the program's final global variables (simple values only) next to it.
const DUMP = `
import json as _j
_simple = (int, float, str, bool, list, type(None))
with open("__vars.json", "w") as _f:
    _j.dump({k: v for k, v in globals().items() if not k.startswith("_") and isinstance(v, _simple)}, _f)
`;

// For programs that call input(): feeds the typed lines and echoes them, so the output looks
// like a terminal session ("Enter your name: Ada").
const ECHO_RUNNER = `
import builtins
_real_input = builtins.input
def _echo_input(prompt=""):
    value = _real_input(prompt)
    print(value)
    return value
builtins.input = _echo_input
with open("main.py") as _f:
    exec(compile(_f.read(), "main.py", "exec"), {"__name__": "__main__"})
`;

function run(code: string, dumpVars = false, input?: string[]): Run {
  writeFileSync(join(dir, "main.py"), dumpVars ? code + "\n" + DUMP : code);
  writeFileSync(join(dir, "__run.py"), ECHO_RUNNER);
  rmSync(join(dir, "__vars.json"), { force: true });
  const r = spawnSync("python3", ["-I", input ? "__run.py" : "main.py"], {
    cwd: dir,
    encoding: "utf8",
    input: input ? input.join("\n") + "\n" : "",
    timeout: 10_000,
  });
  if (r.error) throw new Error(`Couldn't run python3: ${r.error.message}`);
  let vars: Record<string, unknown> = {};
  try {
    vars = JSON.parse(readFileSync(join(dir, "__vars.json"), "utf8"));
  } catch {
    // The program stopped with an error before the dump ran.
  }
  const stdout = r.stdout.replace(/\n$/, "");
  // Tracebacks name the file by its full path; lessons show it as main.py.
  const stderr = r.stderr.trimEnd().replaceAll(`File "${join(dir, "main.py")}"`, 'File "main.py"');
  return { stdout: stdout ? stdout.split("\n") : [], stderr, ok: r.status === 0, vars };
}

// Records every module-level line event: the line about to run, the simple global variables
// (copied through JSON so later changes to a list don't rewrite history) and the output so far.
const TRACER = `
import io, json, sys
_code = compile(open("main.py").read(), "main.py", "exec")
_buf = io.StringIO()
_simple = (int, float, str, bool, list, type(None))
def _snap(g):
    return json.loads(json.dumps({k: v for k, v in g.items() if not k.startswith("_") and isinstance(v, _simple)}))
_events = []
_g = {"__name__": "__main__"}
def _trace(frame, event, arg):
    if frame.f_code is not _code:
        return None
    if event == "line":
        _events.append({"line": frame.f_lineno, "vars": _snap(frame.f_globals), "out": _buf.getvalue()})
    return _trace
_real = sys.stdout
sys.stdout = _buf
sys.settrace(_trace)
try:
    exec(_code, _g)
finally:
    sys.settrace(None)
    sys.stdout = _real
_events.append({"line": None, "vars": _snap(_g), "out": _buf.getvalue()})
with open("__trace.json", "w") as _f:
    json.dump(_events, _f)
`;

// Evaluates expressions with a recorded event's variables and compares them (by repr) with
// what the walkthrough claims.
const EVALUATOR = `
import ast, json
_results = []
for _r in json.load(open("__eval.json")):
    try:
        _got = eval(_r["expr"], {}, dict(_r["vars"]))
        _results.append({"ok": repr(_got) == repr(ast.literal_eval(_r["expect"])), "got": repr(_got)})
    except Exception as _e:
        _results.append({"ok": False, "got": f"{type(_e).__name__}: {_e}"})
json.dump(_results, open("__evalout.json", "w"))
`;

function python(script: string, files: Record<string, string>) {
  for (const [name, content] of Object.entries(files)) writeFileSync(join(dir, name), content);
  writeFileSync(join(dir, "__script.py"), script);
  const r = spawnSync("python3", ["-I", "__script.py"], { cwd: dir, encoding: "utf8", timeout: 10_000 });
  if (r.error) throw new Error(`Couldn't run python3: ${r.error.message}`);
  return r;
}

const replayed = new Set<Walkthrough>();

/** Replays a walkthrough step by step against a recording of the real run. */
function checkSteps(w: Walkthrough, where: string) {
  if (replayed.has(w)) return;
  replayed.add(w);
  if (!replayable(w)) return; // functions and input() are checked by their final state only
  checked++;
  const traced = python(TRACER, { "main.py": w.code });
  if (traced.status !== 0) {
    problems.push(`${where}: walkthrough "${w.id}" fails under the tracer:\n${traced.stderr}`);
    return;
  }
  const events = JSON.parse(readFileSync(join(dir, "__trace.json"), "utf8")) as RecordedEvent[];
  const { problems: mismatches, evals } = matchRecording(w, events);
  problems.push(...mismatches.map((m) => `${where}: ${m}`));
  if (!evals.length) return;
  python(EVALUATOR, { "__eval.json": JSON.stringify(evals.map((e: EvalRequest) => ({ ...e, vars: events[e.at]!.vars }))) });
  const results = JSON.parse(readFileSync(join(dir, "__evalout.json"), "utf8")) as { ok: boolean; got: string }[];
  results.forEach((r, i) => {
    if (!r.ok) problems.push(`${where}: walkthrough "${w.id}" ${evals[i]!.what}: the walkthrough says ${evals[i]!.expect}, Python gives ${r.got}`);
  });
}

const show = (lines: string[]) => JSON.stringify(lines);
const pyJson = (v: PyValue) => (v.type === "None" ? null : v.value);

function checkWalkthrough(w: Walkthrough, where: string) {
  checkSteps(w, where);
  checked++;
  const last = w.steps.at(-1)!;
  const r = run(w.code, true);
  if (!r.ok) {
    problems.push(`${where}: walkthrough "${w.id}" fails in Python:\n${r.stderr}`);
    return;
  }
  const expected = last.output ?? [];
  if (show(r.stdout) !== show(expected)) {
    problems.push(`${where}: walkthrough "${w.id}" prints ${show(r.stdout)}, but its last step shows ${show(expected)}`);
  }
  for (const [name, value] of Object.entries(last.vars as Variables)) {
    if (!(name in r.vars)) continue; // a local variable inside a function, gone after it returns
    if (JSON.stringify(r.vars[name]) !== JSON.stringify(pyJson(value))) {
      problems.push(`${where}: walkthrough "${w.id}" ends with ${name} = ${JSON.stringify(r.vars[name])}, but its last step shows ${JSON.stringify(pyJson(value))}`);
    }
  }
}

const codeSpan = (text: string) => /^`([^`]+)`$/.exec(text.trim())?.[1];

function checkBlock(block: Block, where: string) {
  if (block.type === "code" && block.language === "python") {
    if (block.walkthrough) checkWalkthrough(block.walkthrough, where);
    if (block.output) {
      checked++;
      const r = run(block.code);
      if (!r.ok) problems.push(`${where}: code example fails in Python:\n${r.stderr}`);
      else if (show(r.stdout) !== show(block.output)) problems.push(`${where}: code prints ${show(r.stdout)}, but the lesson shows ${show(block.output)}`);
    }
  }
  if (block.type === "question" && block.code) {
    checked++;
    const r = run(block.code);
    if (block.errorOutput) {
      // Same error, same place; only the file's location on disk may differ.
      if (r.ok) problems.push(`${where}: question "${block.id}" shows an error, but the code runs fine`);
      else if (r.stderr !== block.errorOutput) {
        problems.push(`${where}: question "${block.id}" shows this error:\n${block.errorOutput}\nPython prints:\n${r.stderr}`);
      }
    } else if (block.variant === "predict") {
      const answer = codeSpan(block.choices.find((c) => c.id === block.answer)?.text ?? "");
      if (!r.ok) problems.push(`${where}: question "${block.id}" code fails in Python:\n${r.stderr}`);
      else if (answer !== undefined && r.stdout[0] !== answer) {
        problems.push(`${where}: question "${block.id}" answer is ${answer}, but the program prints ${show(r.stdout)}`);
      }
    }
  }
  if (block.type === "practice") {
    checked++;
    const r = run(block.solution);
    if (!r.ok) problems.push(`${where}: practice "${block.id}" sample solution fails in Python:\n${r.stderr}`);
  }
}

for (const course of courses) {
  for (const chapter of course.chapters) {
    for (const lesson of chapter.lessons) {
      for (const section of lesson.sections) {
        for (const block of section.blocks) checkBlock(block, `${course.id}/${lesson.id}#${section.id}`);
      }
    }
  }
}
for (const example of examples) checkWalkthrough(example, "playground");

const lastLine = (text: string) => text.split("\n").at(-1) ?? "";
for (const entry of allReferences) {
  const where = `reference ${entry.id}`;
  for (const x of entry.examples ?? []) {
    checked++;
    const r = run(x.code, false, x.input);
    if (!r.ok) problems.push(`${where}: example fails in Python:\n${r.stderr}`);
    else if (x.output && show(r.stdout) !== show(x.output)) problems.push(`${where}: example prints ${show(r.stdout)}, but the manual shows ${show(x.output)}`);
    if (x.walkthrough) checkWalkthrough(x.walkthrough, where);
  }
  for (const m of entry.mistakes ?? []) {
    if (!m.code || m.neverEnds) continue;
    checked++;
    const r = run(m.code, false, m.input);
    if (m.error) {
      if (r.ok) problems.push(`${where}: mistake "${m.title}" should fail with ${m.error}, but it runs`);
      else if (lastLine(r.stderr) !== m.error) problems.push(`${where}: mistake "${m.title}" shows\n  ${m.error}\nPython prints\n  ${lastLine(r.stderr)}`);
    } else if (m.output) {
      if (!r.ok) problems.push(`${where}: mistake "${m.title}" fails in Python:\n${r.stderr}`);
      else if (show(r.stdout) !== show(m.output)) problems.push(`${where}: mistake "${m.title}" prints ${show(r.stdout)}, but the manual shows ${show(m.output)}`);
    }
  }
}

rmSync(dir, { recursive: true, force: true });
if (problems.length) {
  console.error(problems.join("\n\n"));
  console.error(`\n${problems.length} problem(s) in ${checked} Python checks.`);
  process.exit(1);
}
console.log(`All ${checked} Python checks match real Python (${spawnSync("python3", ["--version"], { encoding: "utf8" }).stdout.trim()}).`);
