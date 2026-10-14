// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getReference } from "@/references/registry";
import { MissingEntry } from "./MissingEntry";
import { ReferenceEntryView } from "./ReferenceEntryView";
import { ReferenceHome } from "./ReferenceHome";

afterEach(cleanup);

const headings = () => screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);

describe("ReferenceEntryView", () => {
  it("answers the questions in order for a method", () => {
    render(<ReferenceEntryView entry={getReference("python.types.str.upper")!} />);
    expect(screen.getByRole("heading", { level: 1, name: "str.upper()" })).toBeTruthy();
    expect(headings()).toEqual(["What it is", "How to write it", "What it takes", "What happens when you call it", "Examples", "Common mistakes", "Related"]);
    expect(screen.getByText("str method")).toBeTruthy();
  });

  it("keeps returning, printing and changing apart", () => {
    render(<ReferenceEntryView entry={getReference("python.types.list.append")!} />);
    for (const name of ["Gives back", "Prints", "Changes"]) expect(screen.getByRole("group", { name })).toBeTruthy();
    expect(screen.getByRole("group", { name: "Gives back" }).textContent).toMatch(/None/);
    expect(screen.getByRole("group", { name: "Changes" }).textContent).toMatch(/one more item/);
  });

  it("links related entries and a type's methods to their pages", () => {
    render(<ReferenceEntryView entry={getReference("python.types.list")!} />);
    expect(headings()).toContain("Methods of list");
    const append = screen.getAllByRole("link").find((a) => a.textContent?.startsWith("list.append()")) as HTMLAnchorElement;
    expect(append.getAttribute("href")).toBe("/reference/python.types.list.append");
  });

  it("leaves out call outcomes for a concept", () => {
    render(<ReferenceEntryView entry={getReference("concept.variable")!} />);
    expect(screen.getByText("Programming concept")).toBeTruthy();
    expect(headings()).not.toContain("What happens when you call it");
  });
});

describe("ReferenceHome", () => {
  it("shows ranked results for a search", () => {
    render(<ReferenceHome query="string uppercase" onQueryChange={() => {}} />);
    const first = screen.getByRole("region", { name: /results? for “string uppercase”/ }).querySelector("a")!;
    expect(first.getAttribute("href")).toBe("/reference/python.types.str.upper");
  });

  it("says when nothing matches, and still lets students browse", () => {
    render(<ReferenceHome query="zebra spaceship" onQueryChange={() => {}} />);
    expect(screen.getByText("Nothing matches “zebra spaceship”")).toBeTruthy();
    expect(screen.getByRole("heading", { level: 2, name: "Python" })).toBeTruthy();
  });

  it("searches as the student types", () => {
    const onQueryChange = vi.fn();
    render(<ReferenceHome query="" onQueryChange={onQueryChange} />);
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "len" } });
    expect(onQueryChange).toHaveBeenCalledWith("len");
  });
});

describe("MissingEntry", () => {
  it("suggests close matches for a mistyped id", () => {
    render(<MissingEntry id="python.builtins.lenn" homeLink={<a href="/reference">Search</a>} />);
    expect(screen.getByText("No entry called “python.builtins.lenn”")).toBeTruthy();
    expect(screen.getAllByRole("link").some((a) => a.getAttribute("href") === "/reference/python.builtins.len")).toBe(true);
  });
});
