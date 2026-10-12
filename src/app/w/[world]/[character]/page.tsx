import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadWorld } from "@/lib/data";
import { backlinks, plainText } from "@/lib/wiki";
import { WikiText } from "@/components/WikiText";
import { FamilyTree } from "@/components/FamilyTree";

type Props = { params: Promise<{ world: string; character: string }> };

async function load(params: Props["params"]) {
  const { world, character } = await params;
  const data = await loadWorld(world);
  const c = data?.characters.find((x) => x.slug === decodeURIComponent(character));
  return data && c ? { ...data, c } : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const d = await load(params);
  return d ? { title: `${d.c.name} · ${d.world.name}`, description: plainText(d.c.body, 160) } : {};
}

export default async function CharacterPage({ params }: Props) {
  const d = await load(params);
  if (!d) notFound();
  const { world, characters, relations, canEdit, c } = d;

  const byId = new Map(characters.map((x) => [x.id, x]));
  const parents = relations.filter((r) => r.kind === "parent" && r.to_id === c.id).map((r) => byId.get(r.from_id)!).filter(Boolean);
  const children = relations.filter((r) => r.kind === "parent" && r.from_id === c.id).map((r) => byId.get(r.to_id)!).filter(Boolean);
  const spouses = relations
    .filter((r) => r.kind === "spouse" && (r.from_id === c.id || r.to_id === c.id))
    .map((r) => byId.get(r.from_id === c.id ? r.to_id : r.from_id)!)
    .filter(Boolean);
  const linkedFrom = backlinks(c.slug, characters);

  // The tree on a character page shows only their close family.
  const near = new Set([c.id, ...parents.map((x) => x.id), ...children.map((x) => x.id), ...spouses.map((x) => x.id)]);
  const people = characters.filter((x) => near.has(x.id));
  const rels = relations.filter((r) => near.has(r.from_id) && near.has(r.to_id));


  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <nav className="text-sm text-muted">
        <Link href={`/w/${world.slug}`} className="underline underline-offset-4 hover:text-ink">{world.name}</Link> / {c.name}
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
        <article>
          <h1 className="font-display text-4xl sm:text-5xl">{c.name}</h1>
          {c.epithet && <p className="mt-2 text-lg text-link">{c.epithet}</p>}
          {(c.born || c.died) && (
            <p className="mt-1 font-mono text-sm text-muted">{[c.born, c.died].filter(Boolean).join(" – ")}</p>
          )}
          <div className="mt-8">
            <WikiText doc={c.body} worldSlug={world.slug} known={new Set(characters.map((x) => x.slug))} />
          </div>
          {canEdit && (
            <Link href={`/w/${world.slug}/${c.slug}/edit`} className="mt-10 inline-block rounded-lg border border-ink px-4 py-2 text-sm hover:bg-ink hover:text-paper">
              Edit page
            </Link>
          )}
        </article>

        <aside className="space-y-8">
          <dl className="space-y-5 rounded-xl border border-line bg-card p-5">
            <Group worldSlug={world.slug} title="Parents" list={parents} />
            <Group worldSlug={world.slug} title={spouses.length > 1 ? "Spouses" : "Spouse"} list={spouses} />
            <Group worldSlug={world.slug} title="Children" list={children} />
            <Group worldSlug={world.slug} title="Mentioned on" list={linkedFrom} />
            {!parents.length && !spouses.length && !children.length && !linkedFrom.length && (
              <p className="text-sm text-muted">No links to other characters yet.</p>
            )}
          </dl>
        </aside>
      </div>

      {people.length > 1 && (
        <section className="mt-12">
          <h2 className="mb-3 font-display text-2xl">Close family</h2>
          <FamilyTree worldSlug={world.slug} people={people} relations={rels} focus={c.slug} />
        </section>
      )}
    </div>
  );
}

type Item = { id: string; slug: string; name: string };
function Group({ worldSlug, title, list }: { worldSlug: string; title: string; list: Item[] }) {
  if (!list.length) return null;
  return (
    <div>
      <dt className="text-xs uppercase tracking-[0.14em] text-muted">{title}</dt>
      <dd className="mt-1 space-y-1">
        {list.map((x) => (
          <Link key={x.id} href={`/w/${worldSlug}/${x.slug}`} className="wikilink block w-fit">{x.name}</Link>
        ))}
      </dd>
    </div>
  );
}
