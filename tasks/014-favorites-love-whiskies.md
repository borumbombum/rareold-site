Status: [DONE]

# Logged-in users can Love/Favorite whiskies

## Context

Voting already follows the per-user pattern: Turso `votes` + `karma`, optimistic `VoteButton` (`src/lib/components/VoteButton.svelte`) that opens the login modal when not authed and posts to `POST /api/vote`. Auth is server-side (`getSessionUser`, `src/lib/server/session.ts`) and `+layout.server.ts` hydrates the session client-side (`session.svelte.ts`). Favorites extend this: a per-user list of saved products in Turso, surfaced on cards/rows/detail and on a dedicated `/user/[userId]/favorites` page.

## Requirements

1. **DB**: idempotent migration `db/migrations/0008_favorites.sql` (pattern of `0007_resellers.sql`):
   - `favorites(user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE, created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')), PRIMARY KEY (user_id, product_id))` + index on `user_id`.

2. **Server**: `src/lib/server/favorites.ts` — `listFavoriteIds(userId)` and `toggleFavorite(userId, productId, on)` (Turso, `votes.ts` style).

3. **API**: `src/routes/api/favorites/+server.ts`
   - `GET` → `{ slugs: string[] }` for the session user (401 when not authed).
   - `POST` `{ product_id, on }` → toggle (401 when not authed), `Cache-Control: no-store`.

4. **Client store**: `src/lib/stores/favorites.svelte.ts` seeded from `+layout.server.ts` (which already returns `user`; add the authed user's favorite slugs), following `session.svelte.ts`.

5. **UI**: `src/lib/components/FavoriteButton.svelte` (lucide `Heart`, optimistic toggle, login modal when not authed, toast on failure — `VoteButton` pattern), mounted on home `ProductCard`, `ProductRow`, and the product detail page (placement avoids the share/play buttons).

6. **Favorites page**: localized route `/user/[userId]/favorites` (`src/routes/user/[userId]/favorites/+page.svelte` + `+page.server.ts`). Owner-only: `+page.server.ts` compares the path userId to `getSessionUser` and redirects (home) otherwise. Loads the user's favorited whiskies, renders ranked by karma with `ViewToggle` + `ProductCard`/`ProductRow`, empty state when none. Reached from a heart icon in `Header.svelte` (visible only when logged in) via `localizeHref('/user/' + user.id + '/favorites')`.

7. **Messages**: Paraglide keys in `messages/es.json` and `messages/pt.json`: `favorite`, `favorites_title`, `favorites_empty`, `favorite_added`, `favorite_removed`.

8. **Tests**: `tests/favorites.test.ts` following `votes.test.ts` (db helper: list/toggle + auth).

## Acceptance criteria

- Logged-in users favorite/unfavorite from cards, rows, and the product page; heart state is consistent across pages and persists across visits.
- Not-authed taps open the login modal (no API call).
- `/user/{userId}/favorites` (localized, owner-only) lists favorited whiskies ranked by karma with an empty state.
- `npm run check` and `npm run test` pass; build works.

## Progress

- 2026-08-15 — Implemented and verified: migration `db/migrations/0008_favorites.sql`; `src/lib/server/favorites.ts`; `src/routes/api/favorites/+server.ts` (GET `{slugs}` / POST `{product_id,on}`, 401 unauthed, `no-store`); `src/lib/stores/favorites.svelte.ts` seeded from `+layout.server.ts` (+layout.svelte `$effect` hydrate); `src/lib/components/FavoriteButton.svelte` (lucide Heart, optimistic, login modal when unauthed, toast on failure) mounted on `ProductCard`, `ProductRow`, and detail vote bar; owner-only `/user/[userId]/favorites` page (profile header, karma-ranked with ViewToggle + cards/rows, empty state, back link); messages `favorite`/`favorites_title`/`favorites_empty`/`favorite_added`/`favorite_removed` in es+pt; `tests/favorites.test.ts` (3 tests). Header avatar now links to the profile (no longer logs out) with a separate logout icon.
- Verified: `npm run build` (db:sync applied 0008, paraglide regenerated, build OK), `npm run check` 0 errors, `npm test` 46/46.
