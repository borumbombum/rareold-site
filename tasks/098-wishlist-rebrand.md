Status: [TODO]

# Rebrand favorites → wishlist

## Context

The "favorites" feature (heart button, `/api/favorites`, profile section) is a facelift rename to **wishlist**, with a **bookmark** icon replacing the heart. This is a UI-facing rebrand only — the `favorites` table in Turso keeps its name (live user data, no migration). No change to the separate vote/rating feature nor the distillery-follow feature (which shares the `animate-heart-pop` CSS token and must be left untouched).

Decreed scope (user decision): full rename of code identifiers (component, store, server module, API route, tests, i18n keys) + bookmark icon; **drop** all legacy URLs — `/api/wishlist` replaces `/api/favorites`, and the `/user/[id]/favorites` 301-redirect route is deleted.

## Requirements

### 1. i18n — `messages/{en,es,pt,fr,ja}.json`

Rename 7 keys and update values (bookmark wording; translations below):

| Old key | New key | en | es | pt | fr | ja |
|---|---|---|---|---|---|---|
| `favorite` | `wishlist` | Wishlist | Lista de deseos | Lista de desejos | Liste de souhaits | ウィッシュリスト |
| `favorites_title` | `wishlist_title` | My wishlist | Mi lista de deseos | Minha lista de desejos | Ma liste de souhaits | マイウィッシュリスト |
| `favorites_empty` | `wishlist_empty` | You haven't saved any whiskies yet. Tap the bookmark on any card to add them. | Todavía no guardaste whiskies. Toca el marcador en cualquier tarjeta para agregarlos. | Você ainda não guardou whiskies. Toque no marcador em qualquer cartão para adicioná-los. | Vous n'avez pas encore enregistré de whiskies. Touchez le signet sur une fiche pour les ajouter. | まだウイスキーを保存していません。カードのブックマークをタップして追加してください。 |
| `favorite_added` | `wishlist_added` | Added to wishlist | Agregado a la lista de deseos | Adicionado à lista de desejos | Ajouté à la liste de souhaits | ウィッシュリストに追加しました |
| `favorite_removed` | `wishlist_removed` | Removed from wishlist | Quitado de la lista de deseos | Removido da lista de desejos | Retiré de la liste de souhaits | ウィッシュリストから削除しました |
| `favorite_add` | `wishlist_add` | Add to wishlist | Agregar a la lista de deseos | Adicionar à lista de desejos | Ajouter à la liste de souhaits | ウィッシュリストに追加 |
| `favorite_remove` | `wishlist_remove` | Remove from wishlist | Quitar de la lista de deseos | Remover da lista de desejos | Retirer de la liste de souhaits | ウィッシュリストから削除 |

Then run the build once so the Vite paraglide plugin regenerates `src/lib/paraglide/`. Never hand-edit generated files.

### 2. Component — `src/lib/components/FavoriteButton.svelte` → `WishlistButton.svelte`

- Import lucide `Bookmark` instead of `Heart`; render `<Bookmark size={iconSize} fill={isFav ? 'currentColor' : 'none'} />`.
- Store import `favorites` → `wishlist` (`$lib/stores/wishlist.svelte`).
- `fetch('/api/favorites')` → `fetch('/api/wishlist')`.
- Messages: `title={m.wishlist()}`, toast `m.wishlist_added()`/`m.wishlist_removed()`, label `m.wishlist_remove()`/`m.wishlist_add()`.
- Keep the pop animation and particle burst, reusing existing CSS untouched (`animate-heart-pop`, `.heart-particle`).
- Rename internal `isFav` → `isSaved` (or similar) for clarity. Update consumers:
  - `src/lib/components/ProductCard.svelte` (:8, :78)
  - `src/lib/components/ProductRow.svelte` (:8, :79)
  - `src/routes/whisky/[slug]/+page.svelte` (:12, :208)

### 3. Store — `src/lib/stores/favorites.svelte.ts` → `wishlist.svelte.ts`

- Export `wishlist` in place of `favorites` (same API: `ids`, `has`, `hydrate`, `add`, `remove`).
- Update `src/routes/+layout.svelte` (:15, :38) — `wishlist.hydrate(data.wishlist)`.
- Update `src/routes/user/[userId]/+page.svelte` (:21).

### 4. Server module — `src/lib/server/favorites.ts` → `wishlist.ts`

- `listFavoriteIds` → `listWishlistIds`, `toggleFavorite` → `toggleWishlist`. SQL still reads/writes the `favorites` table (DB name unchanged).
- Update importers: `src/routes/+layout.server.ts` (data field `favorites` → `wishlist`, :9/:14/:18), `src/routes/user/[userId]/+page.server.ts` (`favoriteSlugs` → `wishlistSlugs`, :19/:25/:35), API route.

### 5. API route — `src/routes/api/favorites/` → `src/routes/api/wishlist/`

- Update imports + function names. Error string `'favorite failed'` → `'wishlist failed'`. Route stays `GET` (slugs) and `POST` (`product_id`, `on`).

### 6. Profile page — `src/routes/user/[userId]/+page.svelte`

- Icon `Heart` → `Bookmark` (:7, :119).
- `favoriteProducts` → `wishlistProducts`; `data.favoriteSlugs` → `data.wishlistSlugs` (:52–56, :122–148).
- `m.favorites_title()` → `m.wishlist_title()`, `m.favorites_empty()` → `m.wishlist_empty()` (:72, :95, :120, :131).
- Comment `<!-- Favoritos -->` → `<!-- Wishlist -->`.

### 7. Legacy redirect — delete

- Remove `src/routes/user/[userId]/favorites/+page.server.ts` and the folder (drop legacy, per user decision).

### 8. Tests — `tests/favorites.test.ts` → `tests/wishlist.test.ts`

- Update import path, `describe('wishlist')`, and function names (`listWishlistIds`, `toggleWishlist`).

### 9. Docs (non-blocking but expected)

- `docs/TOOLS.md` :14 protected-tables list mention.
- `docs/LEARNINGS.md` :419 mention.
- `docs/lessons-learned.md` — add final note about the rebrand.
- `static/santandalong.html` — standalone demo; update `title="Wishlist"` and swap inline heart path for a bookmark.

### 10. Leave alone (do not rebrand)

- `db/migrations/0008_favorites.sql` + table `favorites` (no migration; keep name).
- `src/lib/server/dbfile.ts` comment (PII exclusion still lists `favorites`).
- `FollowDistilleryButton.svelte` and `distillery-followers.svelte.ts` — separate feature sharing the heart-pop token.
- Vote/rating system (`votes`, ThumbsUp, `VoteButton`).
- CSS keyframes/classes in `src/app.css` (`heartPop`, `heartParticleBurst`, `.heart-particle`, `--animate-heart-pop`).
- `src/lib/data/whiskies.json` / `data/seed/*` content copy (product descriptions).

## Acceptance criteria

- No user-facing "favorite(s)"/corazón/favorito text remains: grep `favorite|Favorite` in `src/` and `messages/` returns only the `favorites` DB table + `dbfile.ts` comment.
- Bookmark icon shown on the wishlist button (empty = outline, saved = filled) and in the profile section header.
- `/api/wishlist` GET/POST works; old `/api/favorites` and `/user/[id]/favorites` no longer resolve (dropped legacy).
- Wishlist still hydrated from layout on login; toggling works optimistically and reverts on error; unauthed tap opens login modal.
- Distillery follow button and vote feature unaffected.
- Locale files: all 5 languages have the 7 new keys with no leftover `favorite_*` keys.
- `npm run check`, `npm run test`, `npm run build` pass.

## Progress

- 2026-09-23: Task created. Full inventory done (components, store, server, API, routes, i18n ×5 locales, tests, docs). User decisions: bookmark icon, full rename, keep `favorites` DB table, drop legacy URLs `/api/favorites` + `/user/[id]/favorites`. Next: begin implementation starting with i18n keys.