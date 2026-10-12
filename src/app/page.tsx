import Link from "next/link";
import { publicWorlds } from "@/lib/data";
import { hasSupabase } from "@/lib/supabase/server";

export default async function Home() {
  const worlds = hasSupabase() ? await publicWorlds() : [];
  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
      <p className="text-sm uppercase tracking-[0.18em] text-muted">A wiki for invented worlds</p>
      <h1 className="mt-3 max-w-3xl font-display text-4xl leading-[1.08] sm:text-6xl">
        Every character, family and secret of your world, linked.
      </h1>
      <p className="mt-6 max-w-2xl text-lg text-muted">
        Write characters as wiki pages, link them with <code className="rounded bg-card px-1.5 py-0.5 font-mono text-[15px] text-link">[[Name]]</code>,
        and the family tree and backlinks build themselves. Share a world with co-writers, or publish it for readers.
      </p>

      {!hasSupabase() && (
        <div className="mt-10 rounded-xl border border-missing/40 bg-card p-5 text-sm">
          <b>Setup needed:</b> add the Supabase URL and anon key to <code>.env.local</code>, run the migration and the seed (see README).
        </div>
      )}

      <h2 className="mt-16 font-display text-2xl">Published worlds</h2>
      {worlds.length ? (
        <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {worlds.map((w) => (
            <li key={w.slug}>
              <Link href={`/w/${w.slug}`} className="block h-full rounded-xl border border-line bg-card p-5 transition-colors hover:border-ink">
                <span className="font-display text-xl">{w.name}</span>
                <p className="mt-2 text-sm text-muted">{w.summary}</p>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-muted">No published worlds yet.</p>
      )}
    </div>
  );
}
