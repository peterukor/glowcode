import type { PyItem, PyType, PyValue } from "@/types/python";

/** Tailwind classes per Python type. Written out in full so Tailwind can see them. */
export const typeStyle: Record<PyType, { text: string; border: string; tint: string }> = {
  int: { text: "text-t-int", border: "border-t-int", tint: "bg-t-int/10" },
  float: { text: "text-t-float", border: "border-t-float", tint: "bg-t-float/10" },
  str: { text: "text-t-str", border: "border-t-str", tint: "bg-t-str/10" },
  bool: { text: "text-t-bool", border: "border-t-bool", tint: "bg-t-bool/12" },
  list: { text: "text-t-list", border: "border-t-list", tint: "bg-t-list/10" },
  tuple: { text: "text-t-tuple", border: "border-t-tuple", tint: "bg-t-tuple/10" },
  dict: { text: "text-t-dict", border: "border-t-dict", tint: "bg-t-dict/10" },
  set: { text: "text-t-set", border: "border-t-set", tint: "bg-t-set/10" },
  None: { text: "text-t-none", border: "border-t-none", tint: "bg-t-none/10" },
};

/** One item as Python would write it (strings in double quotes, matching the lesson code). */
export const pyItem = (x: PyItem): string =>
  x === null ? "None" : typeof x === "boolean" ? (x ? "True" : "False") : typeof x === "string" ? `"${x}"` : String(x);

/** Formats a value the way Python's repr() would show it. */
export function formatValue(v: PyValue): string {
  switch (v.type) {
    case "str":
      return `"${v.value}"`;
    case "bool":
      return v.value ? "True" : "False";
    case "list":
      return `[${v.value.map(pyItem).join(", ")}]`;
    case "tuple":
      return v.value.length === 1 ? `(${pyItem(v.value[0]!)},)` : `(${v.value.map(pyItem).join(", ")})`;
    case "set":
      return v.value.length ? `{${v.value.map(pyItem).join(", ")}}` : "set()";
    case "dict":
      return `{${v.value.map(([k, x]) => `${pyItem(k)}: ${pyItem(x)}`).join(", ")}}`;
    case "None":
      return "None";
    default:
      return String(v.value);
  }
}

/**
 * A value as tagged JSON, the shape the Python tracer records (see scripts/check-python.ts):
 * numbers, strings, booleans and None as themselves; collections as {"list": [...]},
 * {"tuple": [...]}, {"set": [...sorted]}, {"dict": [[key, value], ...]}.
 */
export function encodeValue(v: PyValue): unknown {
  switch (v.type) {
    case "list":
    case "tuple":
      return { [v.type]: v.value };
    case "set":
      return { set: [...v.value].sort((a, b) => (JSON.stringify(a) < JSON.stringify(b) ? -1 : 1)) };
    case "dict":
      return { dict: v.value };
    default:
      return v.value;
  }
}
