// Wiki text helpers: [[Name]] links, slugs, and backlinks.
// Character bodies are Tiptap JSON; links are typed as plain [[Name]] text and
// resolved at render time, so renaming a character never breaks stored documents.

export type DocNode = {
  type: string;
  text?: string;
  attrs?: Record<string, unknown>;
  marks?: { type: string; attrs?: Record<string, unknown> }[];
  content?: DocNode[];
};

export type Segment =
  | { kind: "text"; text: string }
  | { kind: "link"; label: string; target: string };

const LINK = /\[\[([^\[\]|]{1,80})(?:\|([^\[\]]{1,80}))?\]\]/g;

/** "Queen Aster of Vell" → "queen-aster-of-vell". Keeps letters from any script. */
export function slugify(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

/** Split text into plain runs and [[Target|label]] links. */
export function splitLinks(text: string): Segment[] {
  const out: Segment[] = [];
  let last = 0;
  for (const m of text.matchAll(LINK)) {
    const at = m.index ?? 0;
    if (at > last) out.push({ kind: "text", text: text.slice(last, at) });
    const target = m[1].trim();
    out.push({ kind: "link", target, label: (m[2] ?? m[1]).trim() });
    last = at + m[0].length;
  }
  if (last < text.length) out.push({ kind: "text", text: text.slice(last) });
  return out;
}

/** Every link target in a document, as slugs, without duplicates. */
export function linkTargets(doc: DocNode | null | undefined): string[] {
  const found = new Set<string>();
  const walk = (n: DocNode) => {
    if (n.text) for (const s of splitLinks(n.text)) if (s.kind === "link") found.add(slugify(s.target));
    n.content?.forEach(walk);
  };
  if (doc) walk(doc);
  return [...found];
}

/** Plain text of a document, for previews and search. */
export function plainText(doc: DocNode | null | undefined, max = 240): string {
  const parts: string[] = [];
  const walk = (n: DocNode) => {
    if (n.text) parts.push(n.text.replace(LINK, (_, t: string, l?: string) => (l ?? t).trim()));
    n.content?.forEach(walk);
    if (n.type === "paragraph" || n.type === "heading") parts.push(" ");
  };
  if (doc) walk(doc);
  const s = parts.join("").replace(/\s+/g, " ").trim();
  return s.length > max ? s.slice(0, max - 1).trimEnd() + "…" : s;
}

/** Characters whose bodies link to `slug`. */
export function backlinks<T extends { slug: string; body: DocNode }>(slug: string, all: T[]): T[] {
  return all.filter((c) => c.slug !== slug && linkTargets(c.body).includes(slug));
}
