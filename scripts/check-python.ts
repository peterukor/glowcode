/// <reference types="node" />
/**
 * Runs every Python example in the app through real Python and checks it against what the
 * lesson or walkthrough claims:
 *
 * - code blocks: the printed output matches `output`
 * - walkthroughs (lessons and playground): the printed output matches the last step, and
 *   the final variables match the last step's `vars`
 * - debug questions: the program fails with exactly the error shown in `errorOutput`
 * - predict questions: the answer matches the first line the program prints
 * - practice solutions: they run without errors
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
import type { PyValue, Variables } from "@/types/python";
import type { Walkthrough } from "@/types/trace";

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

function run(code: string, dumpVars = false): Run {
  writeFileSync(join(dir, "main.py"), dumpVars ? code + "\n" + DUMP : code);
  rmSync(join(dir, "__vars.json"), { force: true });
  const r = spawnSync("python3", ["-I", "main.py"], { cwd: dir, encoding: "utf8" });
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

const show = (lines: string[]) => JSON.stringify(lines);
const pyJson = (v: PyValue) => (v.type === "None" ? null : v.value);

function checkWalkthrough(w: Walkthrough, where: string) {
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

rmSync(dir, { recursive: true, force: true });
if (problems.length) {
  console.error(problems.join("\n\n"));
  console.error(`\n${problems.length} problem(s) in ${checked} Python checks.`);
  process.exit(1);
}
console.log(`All ${checked} Python checks match real Python (${spawnSync("python3", ["--version"], { encoding: "utf8" }).stdout.trim()}).`);
