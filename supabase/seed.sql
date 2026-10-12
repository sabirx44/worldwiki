-- Demo world "The Salt Crown". Run in the Supabase SQL editor AFTER you have signed in
-- to the app once, and replace the email below with the one you signed in with.
do $$
declare
  owner uuid := (select id from auth.users where email = 'YOUR_EMAIL_HERE');
  w uuid;
  p jsonb;
begin
  if owner is null then raise exception 'Sign in to the app once, then put that email in seed.sql'; end if;
  delete from public.worlds where slug = 'the-salt-crown';

  insert into public.worlds (owner_id, slug, name, summary, is_public)
  values (owner, 'the-salt-crown', 'The Salt Crown',
          'Three generations of the House of Vell, who rule a harbour city built on salt and debt.', true)
  returning id into w;

  -- name, slug, epithet, born, died, body text (one string per paragraph)
  for p in select * from jsonb_array_elements('[
    ["Aster Vell","aster-vell","The Salt Queen","Year 312","Year 371",["Took the crown at nineteen after the harbour revolt and married [[Corin Hale]] to buy the fleet''s loyalty.","Mother of [[Ren Vell]] and [[Ilse Vell]]. She trusted her daughter''s judgement more than her son''s, and said so in public."]],
    ["Corin Hale","corin-hale","Admiral of the Grey Fleet","Year 309","Year 365",["A shipwright''s son who rose to command the fleet. His marriage to [[Aster Vell]] ended the war between the crown and the docks.","He taught [[Ren Vell]] to sail and never forgave himself for the storm of 358."]],
    ["Ren Vell","ren-vell","The Reluctant Heir","Year 334",null,["Elder child of [[Aster Vell|the Salt Queen]]. Married [[Mara Quill]] against his mother''s wishes.","Rules in name; his sister [[Ilse Vell]] rules in fact."]],
    ["Ilse Vell","ilse-vell","Keeper of the Ledgers","Year 337",null,["Runs the salt treasury and every debt the city owes. Her brother [[Ren Vell]] signs what she writes.","Married [[Odo Brine]], a moneylender, for his books rather than his heart."]],
    ["Mara Quill","mara-quill","The Archivist","Year 336",null,["Daughter of the city archivist. Her marriage to [[Ren Vell]] brought the old records into the palace.","Mother of [[Tobin Vell]] and [[Sefa Vell]]."]],
    ["Odo Brine","odo-brine","The Lender","Year 330",null,["Lends to captains and kings alike. Husband of [[Ilse Vell]] and father of [[Petra Brine]]."]],
    ["Tobin Vell","tobin-vell","Heir of the Salt Crown","Year 359",null,["Son of [[Ren Vell]] and [[Mara Quill]]. Raised mostly by his aunt [[Ilse Vell]], whom he fears and admires."]],
    ["Sefa Vell","sefa-vell","The Cartographer","Year 362",null,["Draws the maps the fleet still uses. Closer to her grandfather [[Corin Hale]]''s world of ships than to court."]],
    ["Petra Brine","petra-brine","The Rival","Year 360",null,["Daughter of [[Ilse Vell]] and [[Odo Brine]]. Believes she, not [[Tobin Vell]], should wear the Salt Crown."]]
  ]'::jsonb)
  loop
    insert into public.characters (world_id, name, slug, epithet, born, died, body)
    values (w, p->>0, p->>1, p->>2, p->>3, p->>4,
      jsonb_build_object('type','doc','content',
        (select coalesce(jsonb_agg(jsonb_build_object('type','paragraph','content',
           jsonb_build_array(jsonb_build_object('type','text','text', para)))), '[]'::jsonb)
         from jsonb_array_elements_text(p->5) as para)));
  end loop;

  insert into public.relationships (world_id, from_id, to_id, kind)
  select w, a.id, b.id, r.kind::public.relation_kind
  from (values
    ('aster-vell','corin-hale','spouse'),
    ('aster-vell','ren-vell','parent'), ('corin-hale','ren-vell','parent'),
    ('aster-vell','ilse-vell','parent'), ('corin-hale','ilse-vell','parent'),
    ('mara-quill','ren-vell','spouse'),
    ('ilse-vell','odo-brine','spouse'),
    ('ren-vell','tobin-vell','parent'), ('mara-quill','tobin-vell','parent'),
    ('ren-vell','sefa-vell','parent'), ('mara-quill','sefa-vell','parent'),
    ('ilse-vell','petra-brine','parent'), ('odo-brine','petra-brine','parent')
  ) as r(f, t, kind)
  join public.characters a on a.world_id = w and a.slug = r.f
  join public.characters b on b.world_id = w and b.slug = r.t
  -- spouse rows are stored once, smaller id first
  where r.kind = 'parent' or a.id < b.id
  union all
  select w, b.id, a.id, 'spouse'::public.relation_kind
  from (values ('aster-vell','corin-hale'), ('mara-quill','ren-vell'), ('ilse-vell','odo-brine')) as s(f, t)
  join public.characters a on a.world_id = w and a.slug = s.f
  join public.characters b on b.world_id = w and b.slug = s.t
  where b.id < a.id;
end $$;
