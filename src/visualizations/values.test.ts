import { describe, expect, it } from "vitest";
import { typeStyle } from "./values";

describe("typeStyle", () => {
  it("uses the text-strength type colours for values written as text", () => {
    // QA regression: values like 1.62 or True were drawn in the pale border colours, 2.2–3:1 on
    // light backgrounds. The -text tokens are deepened in the light theme (styles.css).
    for (const [type, style] of Object.entries(typeStyle)) expect(style.text, type).toBe(`text-t-${type.toLowerCase()}-text`);
  });
});
