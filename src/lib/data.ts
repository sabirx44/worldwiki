import { supabaseServer } from "./supabase/server";
import type { DocNode } from "./wiki";
import type { Relation } from "./tree";

export type World = { id: string; slug: string; name: string; summary: string; is_public: boolean; owner_id: string };
export type Character = {
  id: string; slug: string; name: string; epithet: string;
  born: string | null; died: string | null; body: DocNode; updated_at: string;
};

/** Everything a world page needs, read as the current user (row-level security decides). */
export async function loadWorld(slug: string) {
  const db = await supabaseServer();
  const { data: world } = await db.from("worlds").select("id, slug, name, summary, is_public, owner_id").eq("slug", slug).maybeSingle<World>();
  if (!world) return null;
  const [{ data: characters }, { data: relations }, { data: canEdit }, { data: auth }] = await Promise.all([
    db.from("characters").select("id, slug, name, epithet, born, died, body, updated_at").eq("world_id", world.id).order("name").returns<Character[]>(),
    db.from("relationships").select("from_id, to_id, kind").eq("world_id", world.id).returns<Relation[]>(),
    db.rpc("can_edit_world", { w: world.id }),
    db.auth.getUser(),
  ]);
  return {
    world,
    characters: characters ?? [],
    relations: relations ?? [],
    canEdit: Boolean(canEdit),
    userId: auth.user?.id ?? null,
  };
}

export async function publicWorlds() {
  const db = await supabaseServer();
  const { data } = await db.from("worlds").select("slug, name, summary").eq("is_public", true).order("created_at").limit(12);
  return data ?? [];
}

export async function currentUser() {
  const db = await supabaseServer();
  const { data } = await db.auth.getUser();
  return data.user;
}
