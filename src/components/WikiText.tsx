import Link from "next/link";
import { slugify, splitLinks, type DocNode } from "@/lib/wiki";

/** Renders a Tiptap document, turning [[Name]] into links to existing pages. */
export function WikiText({ doc, worldSlug, known }: { doc: DocNode; worldSlug: string; known: Set<string> }) {
  const inline = (n: DocNode, key: number): React.ReactNode => {
    if (n.type !== "text" || !n.text) return null;
    let node: React.ReactNode = splitLinks(n.text).map((s, i) => {
      if (s.kind === "text") return s.text;
      const slug = slugify(s.target);
      return known.has(slug) ? (
        <Link key={i} className="wikilink" href={`/w/${worldSlug}/${slug}`}>{s.label}</Link>
      ) : (
        <span key={i} className="wikilink" data-missing title={`No page for “${s.target}” yet`}>{s.label}</span>
      );
    });
    for (const m of n.marks ?? []) {
      if (m.type === "bold") node = <strong>{node}</strong>;
      if (m.type === "italic") node = <em>{node}</em>;
    }
    return <span key={key}>{node}</span>;
  };

  const block = (n: DocNode, key: number): React.ReactNode => {
    const kids = n.content?.map((c, i) => (c.type === "text" ? inline(c, i) : block(c, i)));
    switch (n.type) {
      case "paragraph": return <p key={key}>{kids}</p>;
      case "heading": return <h2 key={key} className="font-display text-2xl mt-8">{kids}</h2>;
      case "bulletList": return <ul key={key} className="list-disc pl-6">{kids}</ul>;
      case "orderedList": return <ol key={key} className="list-decimal pl-6">{kids}</ol>;
      case "listItem": return <li key={key}>{kids}</li>;
      case "blockquote": return <blockquote key={key} className="border-l-2 border-link pl-4 italic">{kids}</blockquote>;
      case "hardBreak": return <br key={key} />;
      default: return <div key={key}>{kids}</div>;
    }
  };

  const blocks = doc.content ?? [];
  if (!blocks.length) return <p className="text-muted italic">Nothing written yet.</p>;
  return <div className="space-y-4 text-[17px] leading-[1.75]">{blocks.map(block)}</div>;
}
