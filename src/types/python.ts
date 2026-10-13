/** The Python value types Glowcode can show. Each one has its own color in the UI. */
export type PyType = "int" | "float" | "str" | "bool" | "list" | "None";

export type PyValue =
  | { type: "int" | "float"; value: number }
  | { type: "str"; value: string }
  | { type: "bool"; value: boolean }
  | { type: "list"; value: (string | number)[] }
  | { type: "None"; value: null };

/** Variable name -> current value, in the order the program created them. */
export type Variables = Record<string, PyValue>;
