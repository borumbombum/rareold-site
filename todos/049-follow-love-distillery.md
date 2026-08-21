# Follow / Love Distilleries

Status: TODO

## Context

Users can already favorite/love individual whiskies (task 014) — Turso `favorites` table, server helpers, API, client store, `FavoriteButton.svelte`. We replicate the same architecture for distilleries. The follow button lives on the distillery public page (task 046, prerequisite) and potentially on distillery names shown elsewhere. This lays the groundwork for a future notification system (new products, reviews, events related to followed distilleries).

**Prerequisite**: Task 046 (distillery public page) must be completed first — it's the primary UI surface for the follow button.

## Requirements

1. **DB**: Migration `distillery_followers` table — `user_id` + `distillery_id` composite PK, `ON DELETE CASCADE` on both FKs, timestamp. Same pattern as `0008_favorites.sql`.

2. **Server** (`src/lib/server/distillery-followers.ts`):
   - `listFollowedDistilleryIds(userId)` → `string[]` of distillery IDs.
   - `toggleDistilleryFollow(userId, distilleryId, on)` → insert or delete, idempotent.

3. **API** (`src/routes/api/distillery-followers/+server.ts`):
   - `GET` → `{ distilleryIds: string[] }` for session user (401 unauthed, `no-store`).
   - `POST { distillery_id, on }` → toggle (401 unauthed).
   - Mirrors `/api/favorites` exactly.

4. **Client store** (`src/lib/stores/distillery-followers.svelte.ts`):
   - `Set<string>` of followed distillery IDs, seeded from `+layout.server.ts`.
   - `toggleFollow(id, on)` — optimistic update + API call + toast on failure.
   - Same pattern as `favorites.svelte.ts`.

5. **Layout hydration** (`src/routes/+layout.server.ts`):
   - Import `listFollowedDistilleryIds`.
   - When authed, load followed distillery IDs and return as `distilleryFollowers` alongside existing `favorites`.

6. **Component** (`src/lib/components/FollowDistilleryButton.svelte`):
   - Props: `distilleryId: string`, `distilleryName: string`, `size: 'sm' | 'md'`.
   - Lucide `Heart` (filled when following, outline when not).
   - Optimistic toggle, login modal when not authed, toast on failure.
   - Follows `FavoriteButton.svelte` pattern.

7. **Mount on distillery page**: Add `FollowDistilleryButton` to the distillery public page header (task 046), below the meta line (founded year, region, website).

8. **i18n**: Keys × 4 locales (es/en/pt/ja):
   - `distillery_follow` / `distillery_unfollow`
   - `distillery_followers_title` (for profile)

9. **Tests**: `tests/distillery-followers.test.ts` following `favorites.test.ts` pattern.

## Acceptance Criteria

- [ ] Migration creates `distillery_followers` table.
- [ ] Logged-in user can follow/unfollow from the distillery public page.
- [ ] Heart icon fills optimistically, reverts on failure with toast.
- [ ] Not-authed taps open login modal (no API call).
- [ ] Follow state persists across visits (Turso, hydrated in layout).
- [ ] Server functions and API follow established patterns.
- [ ] `npm run check`, `npm test`, `npm run build` pass.

## Implementation Plan

### 1. DB Migration
Scan `db/migrations/` for next available number. Create:
```sql
CREATE TABLE IF NOT EXISTS distillery_followers (
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    distillery_id TEXT NOT NULL REFERENCES distilleries(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    PRIMARY KEY (user_id, distillery_id)
);
CREATE INDEX IF NOT EXISTS idx_distillery_followers_user ON distillery_followers(user_id);
```

### 2. Server — `src/lib/server/distillery-followers.ts`
- `listFollowedDistilleryIds(userId, db?)`: `SELECT distillery_id FROM distillery_followers WHERE user_id = ? ORDER BY created_at DESC`.
- `toggleDistilleryFollow(userId, distilleryId, on, db?)`: INSERT/DELETE, idempotent (same pattern as `toggleFavorite`).

### 3. API — `src/routes/api/distillery-followers/+server.ts`
- GET: session check → `listFollowedDistilleryIds` → `{ distilleryIds }`.
- POST: parse `{ distillery_id, on }`, session check → `toggleDistilleryFollow`.

### 4. Client store — `src/lib/stores/distillery-followers.svelte.ts`
- `followedDistilleries: Set<string>` reactive state.
- `seedDistilleryFollowers(ids)`: called from `+layout.svelte`.
- `toggleDistilleryFollow(id, on)`: optimistic + API + toast.

### 5. Layout — `src/routes/+layout.server.ts`
- Add `import { listFollowedDistilleryIds } from '$lib/server/distillery-followers'`.
- When authed: `const distilleryFollowers = await listFollowedDistilleryIds(user.id)`.
- Return `distilleryFollowers` in the load result.

### 6. Layout client — `src/routes/+layout.svelte`
- Import `seedDistilleryFollowers`.
- Call in `$effect` alongside existing `seedFavorites`.

### 7. Component — `src/lib/components/FollowDistilleryButton.svelte`
- Same structure as `FavoriteButton.svelte`: Heart icon, optimistic state, login modal, toast.
- Check `followedDistilleries.has(distilleryId)` for current state.
- On click: if not authed → open login modal; else → `toggleDistilleryFollow`.

### 8. Mount on distillery page
- In `src/routes/destileria/[slug]/+page.svelte` (from task 046), add `<FollowDistilleryButton>` in the hero/header area.

### 9. i18n
- `distillery_follow`: "Follow" / "Seguir" / "Seguir" / "フォローする"
- `distillery_unfollow`: "Unfollow" / "Dejar de seguir" / "Deixar de seguir" / "フォロー解除"
- `distillery_followers_title`: "Followed Distilleries" / "Destilerías seguidas" / "Destilarias seguidas" / "フォロー中の蒸留所"

### 10. Tests
- `tests/distillery-followers.test.ts`: toggle on/off, list returns correct IDs, idempotent operations, cross-user isolation.

## Progress

- 2026-08-21 (buffy): Task created. Awaiting implementation.
