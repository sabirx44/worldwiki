"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { slugify, type DocNode } from "@/lib/wiki";

// Every write goes through the user's own session, so row-level security
// rejects anyone who is not the owner or an editor of the world.

async function worldId(slug: string) {
  const db = await supabaseServer();
  const { data } = await db.from("worlds").select("id").eq("slug", slug).maybeSingle();
  if (!data) throw new Error("World not found");
  return { db, id: data.id as string };
}

const clean = (v: FormDataEntryValue | null, max: number) => String(v ?? "").trim().slice(0, max);

export async function saveCharacter(worldSlug: string, characterId: string | null, form: FormData) {
  const { db, id } = await worldId(worldSlug);
  const name = clean(form.get("name"), 80);
  if (!name) return { error: "A character needs a name." };
  let body: DocNode;
  try { body = JSON.parse(String(form.get("body") || '{"type":"doc","content":[]}')); } catch { return { error: "The text could not be read." }; }
  const row = {
    world_id: id,
    name,
    slug: slugify(name),
    epithet: clean(form.get("epithet"), 80),
    born: clean(form.get("born"), 40) || null,
    died: clean(form.get("died"), 40) || null,
    body,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = characterId
    ? await db.from("characters").update(row).eq("id", characterId).select("slug").single()
    : await db.from("characters").insert(row).select("slug").single();
  if (error) return { error: error.code === "23505" ? "Another character already has that name." : "You can't edit this world." };
  revalidatePath(`/w/${worldSlug}`, "layout");
  redirect(`/w/${worldSlug}/${data.slug}`);
}

export async function addRelation(worldSlug: string, characterId: string, form: FormData) {
  const { db, id } = await worldId(worldSlug);
  const other = String(form.get("other") ?? "");
  const kind = String(form.get("kind") ?? "");
  if (!other || other === characterId) return;
  const row =
    kind === "parent" ? { from_id: other, to_id: characterId, kind: "parent" } :
    kind === "child" ? { from_id: characterId, to_id: other, kind: "parent" } :
    { from_id: characterId < other ? characterId : other, to_id: characterId < other ? other : characterId, kind: "spouse" };
  await db.from("relationships").upsert({ world_id: id, ...row }, { onConflict: "from_id,to_id,kind", ignoreDuplicates: true });
  revalidatePath(`/w/${worldSlug}`, "layout");
}

export async function removeRelation(worldSlug: string, from: string, to: string, kind: string) {
  const { db } = await worldId(worldSlug);
  await db.from("relationships").delete().match({ from_id: from, to_id: to, kind });
  revalidatePath(`/w/${worldSlug}`, "layout");
}
