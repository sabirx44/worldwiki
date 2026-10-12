-- Worldwiki schema: worlds, members, characters, relationships.
-- Access rules live in the database (row-level security), not in the app.

create extension if not exists pgcrypto;

create table public.worlds (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users (id) on delete cascade,
  slug        text not null unique check (slug ~ '^[a-z0-9-]{3,48}$'),
  name        text not null check (char_length(name) between 1 and 80),
  summary     text not null default '',
  is_public   boolean not null default false,
  created_at  timestamptz not null default now()
);

create type public.member_role as enum ('editor', 'viewer');

create table public.world_members (
  world_id  uuid not null references public.worlds (id) on delete cascade,
  user_id   uuid not null references auth.users (id) on delete cascade,
  role      public.member_role not null default 'viewer',
  primary key (world_id, user_id)
);

create table public.characters (
  id          uuid primary key default gen_random_uuid(),
  world_id    uuid not null references public.worlds (id) on delete cascade,
  slug        text not null check (slug ~ '^[a-z0-9-]{1,64}$'),
  name        text not null check (char_length(name) between 1 and 80),
  epithet     text not null default '',
  body        jsonb not null default '{"type":"doc","content":[]}'::jsonb,
  born        text,
  died        text,
  updated_at  timestamptz not null default now(),
  unique (world_id, slug)
);

create type public.relation_kind as enum ('parent', 'spouse');

-- parent: from_id is a parent of to_id. spouse: stored once, from_id < to_id.
create table public.relationships (
  id        uuid primary key default gen_random_uuid(),
  world_id  uuid not null references public.worlds (id) on delete cascade,
  from_id   uuid not null references public.characters (id) on delete cascade,
  to_id     uuid not null references public.characters (id) on delete cascade,
  kind      public.relation_kind not null,
  check (from_id <> to_id),
  check (kind <> 'spouse' or from_id < to_id),
  unique (from_id, to_id, kind)
);

create index on public.characters (world_id);
create index on public.relationships (world_id);
create index on public.relationships (to_id);

-- Both ends of a relationship must belong to the relationship's world.
create function public.relationship_same_world() returns trigger
language plpgsql as $$
begin
  if (select world_id from public.characters where id = new.from_id) <> new.world_id
     or (select world_id from public.characters where id = new.to_id) <> new.world_id then
    raise exception 'both characters must belong to world %', new.world_id;
  end if;
  return new;
end $$;

create trigger relationships_same_world
  before insert or update on public.relationships
  for each row execute function public.relationship_same_world();

-- Access helpers. security definer so policies can read membership without recursion.
create function public.can_read_world(w uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from worlds
    where id = w
      and (is_public
           or owner_id = auth.uid()
           or exists (select 1 from world_members m where m.world_id = w and m.user_id = auth.uid()))
  );
$$;

create function public.can_edit_world(w uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from worlds
    where id = w
      and (owner_id = auth.uid()
           or exists (select 1 from world_members m
                      where m.world_id = w and m.user_id = auth.uid() and m.role = 'editor'))
  );
$$;

alter table public.worlds        enable row level security;
alter table public.world_members enable row level security;
alter table public.characters    enable row level security;
alter table public.relationships enable row level security;

create policy worlds_read   on public.worlds for select using (public.can_read_world(id));
create policy worlds_insert on public.worlds for insert with check (owner_id = auth.uid());
create policy worlds_update on public.worlds for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy worlds_delete on public.worlds for delete using (owner_id = auth.uid());

create policy members_read  on public.world_members for select using (public.can_read_world(world_id));
create policy members_owner on public.world_members for all
  using (exists (select 1 from public.worlds w where w.id = world_id and w.owner_id = auth.uid()))
  with check (exists (select 1 from public.worlds w where w.id = world_id and w.owner_id = auth.uid()));

create policy characters_read  on public.characters for select using (public.can_read_world(world_id));
create policy characters_write on public.characters for all
  using (public.can_edit_world(world_id)) with check (public.can_edit_world(world_id));

create policy relationships_read  on public.relationships for select using (public.can_read_world(world_id));
create policy relationships_write on public.relationships for all
  using (public.can_edit_world(world_id)) with check (public.can_edit_world(world_id));
