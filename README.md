# Worldwiki

A shared wiki for invented worlds. Each character is a page; typing `[[Name]]` links pages together, and the family tree and backlinks are built from the data. A world can be private, shared with co-writers, or published for readers.

**Live demo:** https://vvd.sabirhussein.com (published world: *The Salt Crown*)

## What it shows

- **Access control in the database.** Postgres row-level security decides who can read and edit each world (owner, editors, viewers, or the public). The app never filters permissions itself, so a bug in a page can't leak a private world. See `supabase/migrations/0001_init.sql`.
- **Wiki links that survive renames.** Bodies are stored as Tiptap JSON with plain `[[Name]]` text; links and backlinks are resolved at read time (`src/lib/wiki.ts`).
- **A family tree from relationships.** Generations come from parent links, married-in spouses sit beside their partner, and bad data (a parent cycle) can't hang the page (`src/lib/tree.ts`, drawn with React Flow).
- **A reader site.** Published worlds are readable without an account; edit controls and routes only exist for owners and editors.

## Stack

Next.js (App Router, server actions) · TypeScript · Tailwind CSS · Supabase (Postgres, Auth, row-level security) · Tiptap · React Flow · Vitest · Playwright · GitHub Actions

## Run it

1. Create a Supabase project. Copy `.env.example` to `.env.local` and fill in the project URL and anon key.
2. In the Supabase SQL editor, run `supabase/migrations/0001_init.sql`.
3. `npm install` then `npm run dev`, and sign in once with your email (magic link).
4. Put that email in `supabase/seed.sql` and run it in the SQL editor to create *The Salt Crown*.

## Tests

- `npm test`: unit tests for wiki links, backlinks, slugs and the tree layout.
- `npm run e2e`: Playwright, desktop and phone. A reader opens the world, follows the tree and a wiki link, and can't reach the editor.
- CI runs lint, type check, unit tests and the build on every push; the end-to-end tests run when the Supabase secrets are configured.
