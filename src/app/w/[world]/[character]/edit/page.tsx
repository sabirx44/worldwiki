import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { loadWorld } from "@/lib/data";
import { CharacterForm } from "@/components/CharacterForm";
import { addRelation, removeRelation, saveCharacter } from "../../actions";

type Props = { params: Promise<{ world: string; character: string }> };

export const metadata = { title: "Edit", robots: { index: false } };

export default async function EditPage({ params }: Props) {
  const { world: worldSlug, character } = await params;
  const data = await loadWorld(worldSlug);
  const c = data?.characters.find((x) => x.slug === decodeURIComponent(character));
  if (!data || !c) notFound();
  if (!data.canEdit) redirect(`/w/${worldSlug}/${c.slug}`);

  const byId = new Map(data.characters.map((x) => [x.id, x]));
  const mine = data.relations.filter((r) => r.from_id === c.id || r.to_id === c.id);
  const describe = (r: (typeof mine)[number]) =>
    r.kind === "spouse" ? `Spouse: ${byId.get(r.from_id === c.id ? r.to_id : r.from_id)?.name}`
    : r.to_id === c.id ? `Parent: ${byId.get(r.from_id)?.name}` : `Child: ${byId.get(r.to_id)?.name}`;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <nav className="text-sm text-muted">
        <Link href={`/w/${worldSlug}/${c.slug}`} className="underline underline-offset-4 hover:text-ink">Back to {c.name}</Link>
      </nav>
      <h1 className="mt-4 font-display text-4xl">Edit {c.name}</h1>
      <div className="mt-8">
        <CharacterForm
          initial={c}
          names={data.characters.filter((x) => x.id !== c.id).map((x) => x.name)}
          action={saveCharacter.bind(null, worldSlug, c.id)}
        />
      </div>

      <section className="mt-14">
        <h2 className="font-display text-2xl">Family</h2>
        <ul className="mt-4 divide-y divide-line rounded-xl border border-line bg-card">
          {mine.length ? mine.map((r) => (
            <li key={`${r.from_id}${r.to_id}${r.kind}`} className="flex items-center justify-between gap-3 px-4 py-3">
              <span>{describe(r)}</span>
              <form action={removeRelation.bind(null, worldSlug, r.from_id, r.to_id, r.kind)}>
                <button className="text-sm text-muted underline underline-offset-4 hover:text-link">Remove</button>
              </form>
            </li>
          )) : <li className="px-4 py-3 text-muted">No family links yet.</li>}
        </ul>
        <form action={addRelation.bind(null, worldSlug, c.id)} className="mt-4 flex flex-wrap items-end gap-3">
          <label className="block">
            <span className="text-sm text-muted">Add</span>
            <select name="kind" className="mt-1 block rounded-lg border border-line bg-card px-3 py-2.5">
              <option value="parent">Parent</option>
              <option value="spouse">Spouse</option>
              <option value="child">Child</option>
            </select>
          </label>
          <label className="block min-w-0 flex-1">
            <span className="text-sm text-muted">Character</span>
            <select name="other" required className="mt-1 block w-full rounded-lg border border-line bg-card px-3 py-2.5">
              {data.characters.filter((x) => x.id !== c.id).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
            </select>
          </label>
          <button className="rounded-lg border border-ink px-4 py-2.5 hover:bg-ink hover:text-paper">Add link</button>
        </form>
      </section>
    </div>
  );
}
