import { describe, expect, it } from "vitest";
import { courses } from "@/courses/registry";
import { referencesIn } from "@/courses/richText";
import type { Block } from "@/courses/types";
import { findCodeReferences } from "./codeLinks";
import { nextOrigin, parseOrigin } from "./navigation";
import { allReferences, breadcrumb, getReference, methodsOf, navTitle, referencePath, referenceTree } from "./registry";
import { searchReferences } from "./search";
import { validateReferences } from "./validate";
import type { ReferenceEntry } from "./types";

describe("reference registry", () => {
  it("has no integrity problems (ids, categories, parents, related links, inline links)", () => {
    expect(validateReferences(allReferences)).toEqual([]);
  });

  it("resolves every reference id used by lessons", () => {
    const blockText = (b: Block): string[] =>
      b.type === "text" ? [b.text] : b.type === "list" ? b.items : b.type === "callout" ? [b.text] : [];
    const used = courses.flatMap((c) =>
      c.chapters.flatMap((ch) =>
        ch.lessons.flatMap((l) => [...(l.references ?? []), ...l.sections.flatMap((s) => s.blocks.flatMap(blockText)).flatMap(referencesIn)]),
      ),
    );
    expect(used.length > 0).toBe(true);
    expect(used.filter((id) => !getReference(id))).toEqual([]);
  });

  it("returns undefined for unknown ids instead of throwing", () => {
    expect(getReference("python.builtins.nope")).toBeUndefined();
  });

  it("organises methods under their type, not in a flat list", () => {
    const python = referenceTree().find((s) => s.scope === "python")!;
    const types = python.groups.find((g) => g.category === "data-type")!;
    const str = types.items.find((i) => i.entry.id === "python.types.str")!;
    expect(str.children.map((c) => c.id)).toEqual(["python.types.str.upper"]);
    expect(python.groups.some((g) => g.items.some((i) => i.entry.category === "method"))).toBe(false);
    expect(methodsOf("python.types.list").map((e) => e.id)).toEqual(["python.types.list.append"]);
    expect(navTitle(getReference("python.types.list.append")!)).toBe("append()");
  });

  it("describes where an entry sits", () => {
    expect(breadcrumb(getReference("python.types.str.upper")!)).toEqual(["Python", "Data Types", "str"]);
    expect(breadcrumb(getReference("python.builtins.len")!)).toEqual(["Python", "Built-in Functions"]);
    expect(referencePath("python.builtins.print")).toBe("/reference/python.builtins.print");
  });

  it("says what every function and method returns, prints and changes", () => {
    for (const e of allReferences.filter((x) => x.category === "built-in" || x.category === "method")) {
      expect([e.returns, e.prints, e.changes].every((v) => v !== undefined)).toBe(true);
    }
    expect(getReference("python.builtins.print")!.returns).toBe("`None`.");
    expect(getReference("python.types.list.append")!.changes).toMatch(/one more item/);
    expect(getReference("python.types.str.upper")!.changes).toMatch(/Nothing/);
  });

  it("catches broken entries", () => {
    const bad: ReferenceEntry[] = [
      { id: "python.types.str", scope: "python", category: "data-type", title: "str", summary: "Text.", explanation: ["x"] },
      { id: "python.types.str", scope: "python", category: "data-type", title: "str", summary: "Text.", explanation: ["x"] },
      { id: "python.builtins.oops", scope: "python", category: "built-in", title: "oops()", summary: "?", explanation: ["See [x](ref:nope)."], related: ["nope.too"] },
      { id: "python.types.x.y", scope: "python", category: "method", parent: "python.types.missing", title: "x.y()", summary: "?", explanation: ["x"], returns: "", prints: "", changes: "" },
      { id: "Bad Id", scope: "python", category: "nonsense" as never, title: "?", summary: "?", explanation: [] },
    ];
    const problems = validateReferences(bad).join("\n");
    expect(problems).toMatch(/Duplicate reference id "python.types.str"/);
    expect(problems).toMatch(/must say what they return, print and change/);
    expect(problems).toMatch(/links to unknown reference "nope"/);
    expect(problems).toMatch(/related entry "nope.too" doesn't exist/);
    expect(problems).toMatch(/method needs a parent type that exists/);
    expect(problems).toMatch(/unknown category/);
    expect(problems).toMatch(/needs an explanation/);
  });
});

describe("searchReferences", () => {
  const top = (q: string) => searchReferences(q)[0]?.entry.id;

  it.each([
    ["print", "python.builtins.print"],
    ["print()", "python.builtins.print"],
    ["len", "python.builtins.len"],
    ["string uppercase", "python.types.str.upper"],
    ["uppercase", "python.types.str.upper"],
    ["list add item", "python.types.list.append"],
    ["append", "python.types.list.append"],
    ["not defined", "python.errors.NameError"],
    ["elif", "python.keywords.if"],
    ["variables", "concept.variable"],
    ["mutable", "concept.mutability"],
    ["can only concatenate", "python.errors.TypeError"],
    ["why is there a dot", "concept.method"],
  ])("%s finds %s first", (query, id) => {
    expect(top(query)).toBe(id);
  });

  it("returns nothing for empty or unmatched queries", () => {
    expect(searchReferences("")).toEqual([]);
    expect(searchReferences("   ")).toEqual([]);
    expect(searchReferences("zebra spaceship")).toEqual([]);
  });

  it("needs every word to match", () => {
    expect(searchReferences("list uppercase").map((r) => r.entry.id)).toEqual([]);
  });
});

describe("findCodeReferences", () => {
  const ids = (code: string) => findCodeReferences(code, "python").map((r) => `${r.line}:${code.split("\n")[r.line - 1]!.slice(r.start, r.end)}=${r.id}`);

  it("links built-in calls, keywords and methods with a known receiver", () => {
    expect(ids(`name = input("Enter your name: ")\nprint(name.upper())`)).toEqual([
      "1:input=python.builtins.input",
      "2:print=python.builtins.print",
      "2:upper=python.types.str.upper",
    ]);
    expect(ids(`items = []\nitems.append("apple")`)).toEqual(["2:append=python.types.list.append"]);
    expect(ids(`print("cat".upper())`)).toEqual(["1:print=python.builtins.print", "1:upper=python.types.str.upper"]);
    expect(ids(`print("a", end="")`)).toEqual(["1:print=python.builtins.print"]);
  });

  it("never links a name the snippet defines or assigns itself", () => {
    expect(ids(`print = 5\nprint(print)`)).toEqual([]);
    expect(ids(`def print(x):\n    return x\nprint(1)`)).toEqual([]);
    expect(ids(`for len in [1, 2]:\n    len(3)`)).toEqual(["1:for=python.keywords.for"]);
    expect(ids(`from helpers import *\nprint(1)`)).toEqual([]);
  });

  it("ignores words in strings and comments, and attributes after a dot", () => {
    expect(ids(`# print("x")\ntext = "print(1)"`)).toEqual([]);
    expect(ids(`screen.print("x")`)).toEqual([]);
  });

  it("links a method only when the receiver's type is certain", () => {
    expect(ids(`x = 5\nx.upper()`)).toEqual([]);
    expect(ids(`stuff.append(1)`)).toEqual([]);
    expect(ids(`for word in ["a"]:\n    word.upper()`)).toEqual(["1:for=python.keywords.for"]);
    expect(ids(`word = "cat"\nword = 5\nword.upper()`)).toEqual([]);
    expect(ids(`def shout(word):\n    return word.upper()`)).toEqual([]);
    expect(ids(`word = "cat"\nword.append("s")`)).toEqual([]); // strings have no append
  });

  it("links statement keywords, and else only when it closes an if", () => {
    expect(ids(`if x:\n    pass\nelif y:\n    pass\nelse:\n    pass`)).toEqual([
      "1:if=python.keywords.if",
      "3:elif=python.keywords.if",
      "5:else=python.keywords.else",
    ]);
    expect(ids(`for i in y:\n    pass\nelse:\n    pass`)).toEqual(["1:for=python.keywords.for"]);
    expect(ids(`x = a if b else c`)).toEqual([]);
    expect(ids(`while n > 0:\n    n = n - 1`)).toEqual(["1:while=python.keywords.while"]);
  });

  it("returns nothing for languages it doesn't know yet", () => {
    expect(findCodeReferences(`System.out.println("hi");`, "java")).toEqual([]);
  });
});

describe("reference navigation origin", () => {
  it("only accepts lesson paths on this site", () => {
    expect(parseOrigin({ from: "/courses/python-fundamentals/why-variables-exist", hops: "2" })).toEqual({
      from: "/courses/python-fundamentals/why-variables-exist",
      hops: 2,
    });
    for (const from of ["https://evil.example", "//evil.example/x", "/reference/x", "/courses/a/b?x=1", 5]) {
      expect(parseOrigin({ from })).toEqual({});
    }
    expect(parseOrigin({ from: "/courses/a/b", hops: "-3" })).toEqual({ from: "/courses/a/b", hops: 1 });
  });

  it("counts reference pages opened since leaving the lesson", () => {
    expect(nextOrigin("/courses/python-fundamentals/what-is-programming", {})).toEqual({ from: "/courses/python-fundamentals/what-is-programming", hops: 1 });
    expect(nextOrigin("/reference/concept.variable", { from: "/courses/a/b", hops: 1 })).toEqual({ from: "/courses/a/b", hops: 2 });
    expect(nextOrigin("/reference", {})).toEqual({});
    expect(nextOrigin("/playground", {})).toEqual({});
  });
});
