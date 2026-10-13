import { createMemoryHistory, createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";
import { routeTree } from "./routeTree.gen";

// Matches routes without rendering, so the test needs no browser.
describe("routing", () => {
  const router = createRouter({ routeTree, history: createMemoryHistory() });
  const leafRoute = (path: string) => router.matchRoutes(path).at(-1)?.routeId;

  it.each([
    ["/", "/"],
    ["/playground", "/playground"],
    ["/lessons", "/lessons/"],
    ["/lessons/variables", "/lessons/$slug"],
  ])("%s renders a real page", (path, routeId) => {
    expect(leafRoute(path)).toBe(routeId);
  });

  it("falls back to not-found for unknown pages", () => {
    expect(leafRoute("/nope")).toBe(rootRouteId);
  });
});
