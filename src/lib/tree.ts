// Family-tree layout: generations from parent links, spouses side by side.
// Pure and deterministic, so the same world always draws the same tree.

export type Person = { id: string; name: string };
export type Relation = { from_id: string; to_id: string; kind: "parent" | "spouse" };
export type Placed = { id: string; gen: number; x: number; y: number };

export const NODE_W = 168;
export const NODE_H = 64;
const GAP_X = 40;
const GAP_Y = 120;

/**
 * Generation = longest chain of parents above a person (roots are 0).
 * Spouses share the higher of their two generations. Cycles (bad data) are cut.
 */
export function generations(people: Person[], rels: Relation[]): Map<string, number> {
  const parents = new Map<string, string[]>();
  for (const r of rels) if (r.kind === "parent") parents.set(r.to_id, [...(parents.get(r.to_id) ?? []), r.from_id]);

  const gen = new Map<string, number>();
  const visiting = new Set<string>();
  const depth = (id: string): number => {
    if (gen.has(id)) return gen.get(id)!;
    if (visiting.has(id)) return 0;
    visiting.add(id);
    const ps = parents.get(id) ?? [];
    const g = ps.length ? Math.max(...ps.map(depth)) + 1 : 0;
    visiting.delete(id);
    gen.set(id, g);
    return g;
  };
  people.forEach((p) => depth(p.id));

  // Married-in people (no parents in the world) move down to their spouse's row.
  for (let pass = 0; pass < 3; pass++) {
    for (const r of rels) {
      if (r.kind !== "spouse") continue;
      const g = Math.max(gen.get(r.from_id) ?? 0, gen.get(r.to_id) ?? 0);
      for (const id of [r.from_id, r.to_id]) if (!(parents.get(id) ?? []).length) gen.set(id, g);
    }
  }
  return gen;
}

/** Positions for every person: rows by generation, spouses adjacent, children under parents. */
export function layout(people: Person[], rels: Relation[]): Placed[] {
  const gen = generations(people, rels);
  const spouse = new Map<string, string>();
  for (const r of rels) if (r.kind === "spouse") { spouse.set(r.from_id, r.to_id); spouse.set(r.to_id, r.from_id); }
  const parentsOf = new Map<string, string[]>();
  for (const r of rels) if (r.kind === "parent") parentsOf.set(r.to_id, [...(parentsOf.get(r.to_id) ?? []), r.from_id]);

  const rows = new Map<number, Person[]>();
  for (const p of people) rows.set(gen.get(p.id) ?? 0, [...(rows.get(gen.get(p.id) ?? 0) ?? []), p]);

  const x = new Map<string, number>();
  const placed: Placed[] = [];
  for (const g of [...rows.keys()].sort((a, b) => a - b)) {
    const row = rows.get(g)!;
    // Order by the average x of parents (children follow their family), then by name.
    const key = (p: Person) => {
      const ps = (parentsOf.get(p.id) ?? []).filter((id) => x.has(id));
      return ps.length ? ps.reduce((s, id) => s + x.get(id)!, 0) / ps.length : Number.MAX_SAFE_INTEGER / 2;
    };
    const sorted = [...row].sort((a, b) => key(a) - key(b) || a.name.localeCompare(b.name));
    // Pull each spouse next to their partner.
    const order: Person[] = [];
    const used = new Set<string>();
    for (const p of sorted) {
      if (used.has(p.id)) continue;
      order.push(p); used.add(p.id);
      const s = spouse.get(p.id);
      const sp = s ? row.find((q) => q.id === s) : undefined;
      if (sp && !used.has(sp.id)) { order.push(sp); used.add(sp.id); }
    }
    order.forEach((p, i) => {
      const px = i * (NODE_W + GAP_X);
      x.set(p.id, px);
      placed.push({ id: p.id, gen: g, x: px, y: g * (NODE_H + GAP_Y) });
    });
  }
  // Centre every row on the widest one.
  const width = (g: number) => placed.filter((p) => p.gen === g).length;
  const max = Math.max(1, ...[...rows.keys()].map(width));
  return placed.map((p) => ({ ...p, x: p.x + ((max - width(p.gen)) * (NODE_W + GAP_X)) / 2 }));
}
