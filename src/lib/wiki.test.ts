import { describe, expect, it } from "vitest";
import { backlinks, linkTargets, plainText, slugify, splitLinks, type DocNode } from "./wiki";
import { generations, layout } from "./tree";

const doc = (...texts: string[]): DocNode => ({
  type: "doc",
  content: texts.map((t) => ({ type: "paragraph", content: [{ type: "text", text: t }] })),
});

describe("slugify", () => {
  it("lowercases, strips accents and joins words", () => {
    expect(slugify("Queen Aster of Vell")).toBe("queen-aster-of-vell");
    expect(slugify("  Élodie  d'Arc ")).toBe("elodie-d-arc");
  });
  it("keeps non-Latin letters", () => {
    expect(slugify("Мирон Тал")).toBe("мирон-тал");
  });
});

describe("splitLinks", () => {
  it("finds plain and labelled links", () => {
    expect(splitLinks("Son of [[Aster]] and [[Corin Vell|the regent]].")).toEqual([
      { kind: "text", text: "Son of " },
      { kind: "link", target: "Aster", label: "Aster" },
      { kind: "text", text: " and " },
      { kind: "link", target: "Corin Vell", label: "the regent" },
      { kind: "text", text: "." },
    ]);
  });
  it("leaves broken brackets as text", () => {
    expect(splitLinks("no [[link here")).toEqual([{ kind: "text", text: "no [[link here" }]);
  });
});

describe("linkTargets and backlinks", () => {
  const all = [
    { slug: "aster", body: doc("Mother of [[Ren]].") },
    { slug: "ren", body: doc("Raised by [[Aster]], rival of [[Ilse|his sister]].") },
    { slug: "ilse", body: doc("Never mentions anyone.") },
  ];
  it("collects unique slugs across paragraphs", () => {
    expect(linkTargets(doc("[[Aster]]", "again [[aster]]"))).toEqual(["aster"]);
  });
  it("lists pages that link here, never the page itself", () => {
    expect(backlinks("aster", all).map((c) => c.slug)).toEqual(["ren"]);
    expect(backlinks("ilse", all).map((c) => c.slug)).toEqual(["ren"]);
    expect(backlinks("ren", all).map((c) => c.slug)).toEqual(["aster"]);
  });
  it("renders link labels in plain text", () => {
    expect(plainText(all[1].body)).toBe("Raised by Aster, rival of his sister.");
  });
});

describe("family tree", () => {
  const people = ["Aster", "Corin", "Ren", "Ilse", "Mara", "Tobin"].map((n) => ({ id: n, name: n }));
  const rels = [
    { from_id: "Aster", to_id: "Corin", kind: "spouse" as const },
    { from_id: "Aster", to_id: "Ren", kind: "parent" as const },
    { from_id: "Corin", to_id: "Ren", kind: "parent" as const },
    { from_id: "Aster", to_id: "Ilse", kind: "parent" as const },
    { from_id: "Mara", to_id: "Ren", kind: "spouse" as const },
    { from_id: "Ren", to_id: "Tobin", kind: "parent" as const },
    { from_id: "Mara", to_id: "Tobin", kind: "parent" as const },
  ];
  it("puts each generation on its own row and married-in spouses beside their partner", () => {
    const g = generations(people, rels);
    expect([g.get("Aster"), g.get("Corin"), g.get("Ren"), g.get("Ilse"), g.get("Mara"), g.get("Tobin")]).toEqual([0, 0, 1, 1, 1, 2]);
  });
  it("places spouses next to each other", () => {
    const pos = Object.fromEntries(layout(people, rels).map((p) => [p.id, p]));
    expect(Math.abs(pos.Ren.x - pos.Mara.x)).toBe(208);
    expect(pos.Ren.y).toBe(pos.Mara.y);
  });
  it("survives a parent cycle in bad data", () => {
    const bad = [
      { from_id: "Aster", to_id: "Corin", kind: "parent" as const },
      { from_id: "Corin", to_id: "Aster", kind: "parent" as const },
    ];
    expect(() => layout(people.slice(0, 2), bad)).not.toThrow();
  });
});
