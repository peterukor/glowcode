import type { PyType, PyValue } from "@/types/python";

/** Tailwind classes per Python type. Written out in full so Tailwind can see them. */
export const typeStyle: Record<PyType, { text: string; border: string; tint: string }> = {
  int: { text: "text-t-int", border: "border-t-int", tint: "bg-t-int/10" },
  float: { text: "text-t-float", border: "border-t-float", tint: "bg-t-float/10" },
  str: { text: "text-t-str", border: "border-t-str", tint: "bg-t-str/10" },
  bool: { text: "text-t-bool", border: "border-t-bool", tint: "bg-t-bool/12" },
  list: { text: "text-t-list", border: "border-t-list", tint: "bg-t-list/10" },
  None: { text: "text-t-none", border: "border-t-none", tint: "bg-t-none/10" },
};

export const pyItem = (x: string | number) => (typeof x === "string" ? `"${x}"` : String(x));

/** Formats a value the way Python's repr() would show it. */
export function formatValue(v: PyValue): string {
  switch (v.type) {
    case "str":
      return `"${v.value}"`;
    case "bool":
      return v.value ? "True" : "False";
    case "list":
      return `[${v.value.map(pyItem).join(", ")}]`;
    case "None":
      return "None";
    default:
      return String(v.value);
  }
}
