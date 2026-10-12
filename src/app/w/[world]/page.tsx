import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadWorld } from "@/lib/data";
import { plainText } from "@/lib/wiki";
import { FamilyTree } from "@/components/FamilyTree";

type Props = { params: Promise<{ world: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await loadWorld((await params).world);
  return data ? { title: data.world.name, description: data.world.summary } : {};
}

export default async function WorldPage({ params }: Props) {
  const data = await loadWorld((await params).world);
  if (!data) notFound();
  const { world, characters, relations, canEdit } = data;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted">{world.is_public ? "Published world" : "Private world"} · {characters.length} characters</p>
          <h1 className="mt-1 font-display text-4xl sm:text-5xl">{world.name}</h1>
          <p className="mt-3 max-w-2xl text-lg text-muted">{world.summary}</p>
        </div>
        {canEdit && (
          <Link href={`/w/${world.slug}/new`} className="rounded-lg bg-ink px-4 py-2.5 text-sm font-medium text-paper hover:bg-link">
            New character
          </Link>
        )}
      </div>

      <section className="mt-10" aria-labelledby="tree">
        <h2 id="tree" className="mb-3 font-display text-2xl">Family tree</h2>
        <FamilyTree worldSlug={world.slug} people={characters} relations={relations} />
        <p className="mt-2 text-xs text-muted">Solid lines: parent to child. Dashed red: marriage. Click anyone to open their page.</p>
      </section>

      <section className="mt-12" aria-labelledby="index">
        <h2 id="index" className="mb-4 font-display text-2xl">Characters</h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {characters.map((c) => (
            <li key={c.id}>
              <Link href={`/w/${world.slug}/${c.slug}`} className="block h-full rounded-xl border border-line bg-card p-5 transition-colors hover:border-ink">
                <span className="font-display text-xl">{c.name}</span>
                {c.epithet && <span className="block text-sm text-link">{c.epithet}</span>}
                <p className="mt-2 text-sm text-muted">{plainText(c.body, 140)}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
