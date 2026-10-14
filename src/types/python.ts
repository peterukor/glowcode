/** The Python value types Glowcode can show. Each one has its own color in the UI. */
export type PyType = "int" | "float" | "str" | "bool" | "list" | "tuple" | "dict" | "set" | "None";

/** A value inside a collection. Glowcode's diagrams keep collection items simple. */
export type PyItem = string | number | boolean | null;

/**
 * A Python value as the trace format stores it.
 * Lists, tuples, dicts and sets may carry an `id`: a stable name for the *object*, so a
 * diagram can show two variables referring to the same list (`b = a`) and tell it apart from
 * a copy (`b = a.copy()`). Same id = same object. It's an educational label, not a memory address.
 */
export type PyValue =
  | { type: "int" | "float"; value: number }
  | { type: "str"; value: string }
  | { type: "bool"; value: boolean }
  | { type: "list"; value: PyItem[]; id?: string }
  | { type: "tuple"; value: PyItem[]; id?: string }
  | { type: "set"; value: PyItem[]; id?: string }
  | { type: "dict"; value: [PyItem, PyItem][]; id?: string }
  | { type: "None"; value: null };

/** Variable name -> current value, in the order the program created them. */
export type Variables = Record<string, PyValue>;

/** Values that are objects with an identity worth drawing (they can be shared or changed). */
export const isCollection = (v: PyValue): v is Extract<PyValue, { id?: string }> =>
  v.type === "list" || v.type === "tuple" || v.type === "set" || v.type === "dict";
