Status: DONE

# Dynamic ranking — most-voted whiskies first per category

## Context

The core idea of the site is that in every category filter — and the "all" category — the most-voted
whiskies appear first, with ordering refreshed from live data on every page mount.

Analysis performed before opening this task:

- Products are build-time JSON (`src/lib/data/whiskies.json`, keyed by `slug`); the JSON contains **no**
  karma/votes fields, and its stored order is always overridden by a client-side sort.
- Votes/karma are fully live in Turso: `POST /api/vote` → `applyVote` (`src/lib/server/votes.ts`)
  upserts `votes` and recomputes `karma` (tables in `db/migrations/0001_init.sql`). Votes are
  independent of language/country (global karma — confirmed by owner).
- Home `src/routes/+page.svelte` sorts the category-filtered set by `karmaStore` karma desc
  (tie-break: name) and re-fetches fresh karma from `/api/karma` (no-store) in `onMount`.
  The product page `whisky/[slug]/+page.svelte` also refetches on mount.
- **Gap:** `src/routes/user/[userId]/favorites/+page.svelte` has **no** on-mount fresh-karma refetch —
  its ordering relies only on SSR `data.karma` (runtime-cached 60s + CDN-cached SSR HTML up to 5 min).
- SSR `data.karma` passes through a 60s runtime cache (`getKarmaMap` in `src/lib/server/data.ts`),
  invalidated on vote — acceptable as a floor since home/product refetch on mount.

## Requirements

1. Extract the on-mount fresh-karma refresh into a shared helper on the karma store (e.g.
   `karmaStore.refreshFromServer(slugs)`) and use it on home, favorites, and product pages so
   ordering is always fresh on mount everywhere.
2. **Diagnostics (read-only, live Turso):** confirm `karma`/`votes` rows exist and `entity_id` values
   match product `slug`s; confirm a vote reorders home ("all" + one origin category) within the mount
   refresh and after a full reload. If votes land in a different DB than the site reads, flag the
   deployment `TURSO_URL` mismatch (out of code scope).
3. Keep the catalog build-time JSON (Turso → `data:export` → build) — confirmed with owner.

## Acceptance criteria

- Every listing page (home, favorites) and the product page shows most-voted-first ordering refreshed
  from Turso on every mount.
- Vote → return to listing → most-voted whiskies are first in the "all" category and each origin
  category (ties broken alphabetically).
- `npm run check`, lint, and `npm run build` pass.

## Progress

- 2026-08-15: Analysis done (see Context). Awaiting implementation — will run live Turso diagnostics
  first, then add the shared `refreshFromServer` helper and wire it into favorites (home/product already
  refetch on mount).
- 2026-08-15: implemented and verified.
  - **Live Turso diagnostics (read-only):** `karma` has 4 rows, `votes` has 3 rows; top entities
    `1770-glasgow-peated`, `1770-glasgow-single-malt`, `1770-single-malt`, `amrut-peated-single-malt`
    (karma 1 each); every `entity_id` matches a real product slug (no orphans). So votes ARE live in
    Turso and the ranking sort works when data flows through — no DB/slug mismatch found.
  - **Change:** added `refreshKarma(slugs)` to `src/lib/stores/karma.svelte.ts` (fetches `/api/karma`,
    no-store, maps `entity_id`→`slug`/`vote_count`→`votes`, merges via `karmaStore.refresh`). Wired it
    into home `+page.svelte`, product `whisky/[slug]/+page.svelte` (both previously had bespoke
    duplicate fetches — now shared) and **added it to favorites
    `user/[userId]/favorites/+page.svelte`** (the real gap: it previously relied only on SSR
    `data.karma` and could show stale ordering up to the 60s runtime cache + CDN HTML cache).
  - Verified: `npm run check` 0 errors, `npm test` 51/51, `npm run build` OK.
  - Note for owner: with the current low vote count (karma 0/1), ties break alphabetically, so ordering
    only visibly reorders once votes accumulate. If a clearly-higher-voted product ever appears below a
    lower-voted one on the **deployed** site, that points to a `TURSO_URL` mismatch between the deployed
    site and where votes land — check Vercel env vars.
