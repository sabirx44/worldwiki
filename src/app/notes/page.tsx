import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Notes on vvd",
  description: "What I noticed while using vvd for the first time, and the fix I would ship for each.",
  robots: { index: false, follow: false },
};

type Note = {
  title: string;
  where: string;
  saw: React.ReactNode;
  fix: React.ReactNode;
  code?: string;
  img?: { src: string; alt: string; w: number; h: number };
};

const notes: Note[] = [
  {
    title: "Two counts on one screen disagree",
    where: "World home, Camelot demo",
    saw: (
      <>
        The header says <b>67 documents</b> and <b>146 connections</b>. The line at the bottom of the same screen says{" "}
        <b>34 documents · 126 links</b>.
      </>
    ),
    fix: (
      <>
        My question first: do these count different things (folders, unlinked cards, links in both directions)? If they do, I&apos;d
        name them differently. If they don&apos;t, I&apos;d derive both from one selector so they can never drift apart.
      </>
    ),
    code: `const stats = useWorldStats(worldId); // one source
<Header documents={stats.documents} connections={stats.links} />
<GraphFooter documents={stats.documents} links={stats.links} />`,
    img: { src: "/notes/editor-home-phone.jpg", alt: "vvd world home showing 67 documents in the header and 34 documents in the footer", w: 457, h: 873 },
  },
  {
    title: "Recent lists the same page four times",
    where: "World home, Recent",
    saw: <>After opening King Arthur a few times, Recent shows “King Arthur” four times in a row and pushes everything else out.</>,
    fix: <>Keep one entry per document and move it to the top on each visit: a unique key on (user, document) and an upsert of the visit time.</>,
    code: `insert into recent_docs (user_id, doc_id, visited_at)
values ($1, $2, now())
on conflict (user_id, doc_id) do update set visited_at = excluded.visited_at;`,
  },
  {
    title: "Signed-out visitors get a 401 on every tool page",
    where: "/t/codex, /t/amber-archive",
    saw: (
      <>
        Without an account, each tool page asks Electric for <code>installed_tools</code> of <code>world_id=fake-world</code>. The
        request is refused with 401 and logs “An error occurred while syncing collection” in the console.
      </>
    ),
    fix: <>Only subscribe when there is a session and a real world. Anonymous previews read static sample data instead.</>,
    code: `useShape({
  collection: "installed_tools",
  worldId,
  enabled: Boolean(session) && worldId !== PREVIEW_WORLD_ID,
  onError: reportOnce,
});`,
  },
  {
    title: "The preview adds a second page heading",
    where: "/t/amber-archive, /pricing",
    saw: (
      <>
        The Terminal page has two <code>h1</code>s, “Terminal” and “Welcome to Fake World”, because the live preview renders its
        own page heading. /pricing has no <code>h1</code> at all. Search engines and screen readers lean on that one heading.
      </>
    ),
    fix: <>Render the preview inside an <code>inert</code> region with its headings shifted down a level, and give /pricing its heading.</>,
  },
  {
    title: "On a phone, the world picker cuts the world’s name",
    where: "/worlds at 366 px wide",
    saw: <>The world card is 420 px wide on a 366 px screen, so “Camelot (demo)” starts off-screen and reads “…elot (demo)”.</>,
    fix: <>Let the card shrink with the screen and truncate long names at the end, never the start.</>,
    code: `.world-card { width: min(420px, 100%); min-width: 0; }
.world-card__name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }`,
    img: { src: "/notes/worlds-card-phone.png", alt: "vvd world picker on a phone with the world name cut off on the left", w: 366, h: 209 },
  },
];

export default function NotesPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <p className="text-sm uppercase tracking-[0.18em] text-muted">First-week notes</p>
      <h1 className="mt-3 font-display text-4xl leading-tight sm:text-5xl">Five things I&apos;d fix in vvd first</h1>
      <p className="mt-5 text-lg text-muted">
        I used vvd as a new user on 12 and 13 October 2026, signed out and signed in, on a phone-sized screen. Each note has what
        I saw, the fix I&apos;d ship, and where it helps a code sketch. I haven&apos;t seen your code, so treat the sketches as
        a starting point for a conversation.
      </p>

      <ol className="mt-12 space-y-14">
        {notes.map((n, i) => (
          <li key={n.title} className="grid gap-4 [&>*]:min-w-0">
            <div>
              <p className="font-mono text-xs text-muted">
                {i + 1} of {notes.length} · {n.where}
              </p>
              <h2 className="mt-1 font-display text-2xl sm:text-3xl">{n.title}</h2>
            </div>
            <p>
              <span className="font-medium">What I saw. </span>
              {n.saw}
            </p>
            <p>
              <span className="font-medium">What I&apos;d ship. </span>
              {n.fix}
            </p>
            {n.code && (
              <pre className="overflow-x-auto rounded-lg border border-line bg-card p-4 font-mono text-[13px] leading-relaxed">
                <code>{n.code}</code>
              </pre>
            )}
            {n.img && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={n.img.src}
                alt={n.img.alt}
                width={n.img.w}
                height={n.img.h}
                loading="lazy"
                className="max-h-[520px] w-auto max-w-full rounded-lg border border-line"
              />
            )}
          </li>
        ))}
      </ol>

      <section className="mt-16 rounded-xl border border-line bg-card p-6">
        <h2 className="font-display text-2xl">The same checks in Worldwiki</h2>
        <p className="mt-3 text-muted">
          Worldwiki&apos;s end-to-end tests open every public page signed out, on a desktop and on a phone, and fail the build if a
          page logs a console error, gets a 4xx response, has anything other than one <code>h1</code>, or scrolls sideways.
        </p>
        <p className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
          <Link href="/w/the-salt-crown" className="wikilink">Open the demo world</Link>
          <a href="https://github.com/sabirx44/worldwiki/blob/main/e2e/public.spec.ts" className="wikilink">Read the test</a>
        </p>
      </section>

      <p className="mt-10 text-sm text-muted">Sabir Hussein · mdsabbirhossenx44@gmail.com</p>
    </article>
  );
}
