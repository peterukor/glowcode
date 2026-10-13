// ESLint formatter for CI: prints each problem as a GitHub annotation,
// so lint errors show up on the exact line in pull requests and the Checks tab.
import path from "node:path";

export default function format(results) {
  const lines = [];
  for (const file of results) {
    const rel = path.relative(process.cwd(), file.filePath);
    for (const m of file.messages) {
      const level = m.severity === 2 ? "error" : "warning";
      const text = `${m.message}${m.ruleId ? ` (${m.ruleId})` : ""}`.replace(/\r?\n/g, " ");
      lines.push(`::${level} file=${rel},line=${m.line ?? 1},col=${m.column ?? 1}::${text}`);
      lines.push(`${rel}:${m.line ?? 1}:${m.column ?? 1}  ${level}  ${text}`);
    }
  }
  const errors = results.reduce((n, r) => n + r.errorCount, 0);
  const warnings = results.reduce((n, r) => n + r.warningCount, 0);
  lines.push(`${errors} error(s), ${warnings} warning(s)`);
  return lines.join("\n");
}
