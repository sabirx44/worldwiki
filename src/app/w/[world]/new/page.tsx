import { notFound, redirect } from "next/navigation";
import { loadWorld } from "@/lib/data";
import { CharacterForm } from "@/components/CharacterForm";
import { saveCharacter } from "../actions";

type Props = { params: Promise<{ world: string }> };

export const metadata = { title: "New character", robots: { index: false } };

export default async function NewCharacter({ params }: Props) {
  const { world } = await params;
  const data = await loadWorld(world);
  if (!data) notFound();
  if (!data.canEdit) redirect(`/w/${world}`);
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-display text-4xl">New character in {data.world.name}</h1>
      <div className="mt-8">
        <CharacterForm
          initial={{ name: "", epithet: "", born: null, died: null, body: { type: "doc", content: [{ type: "paragraph" }] } }}
          names={data.characters.map((x) => x.name)}
          action={saveCharacter.bind(null, world, null)}
        />
      </div>
    </div>
  );
}
