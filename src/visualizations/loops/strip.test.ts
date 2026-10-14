import { describe, expect, it } from "vitest";
import { fitIterable } from "./strip";

const twenty = `[${Array.from({ length: 20 }, (_, i) => i + 1).join(", ")}]`;

describe("fitIterable (for-loop labels)", () => {
  it("leaves an iterable that fits alone", () => {
    expect(fitIterable("[10, 20, 30]", 20)).toBe("[10, 20, 30]");
    expect(fitIterable("numbers", 7)).toBe("numbers");
  });

  it("keeps a long list literal's first items and its last one", () => {
    // QA regression: `for n in [1, 2, …, 20]` was clipped at both sides of the diagram.
    const fitted = fitIterable(twenty, 24);
    expect(fitted.length).toBeLessThanOrEqual(24);
    expect(fitted.startsWith("[1, 2, ")).toBe(true);
    expect(fitted.endsWith(", …, 20]")).toBe(true);
    expect(fitIterable("(1, 2, 3, 4, 5, 6, 7, 8)", 16)).toBe("(1, 2, 3, …, 8)");
    expect(fitIterable("(1, 2, 3, 4, 5, 6, 7, 8)", 12)).toBe("(1, 2, …, 8)");
  });

  it("cuts anything else with a trailing ellipsis, within the limit", () => {
    expect(fitIterable("range(1, 1000000000000000)", 12)).toBe("range(1, 10…");
    expect(fitIterable('["a, b", "c"]', 6)).toHaveLength(6);
  });
});
