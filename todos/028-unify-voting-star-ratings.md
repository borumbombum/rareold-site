Status: TODO [HIGH PRIORITY — pick this task FIRST before any other TODO]

# Unify voting: star ratings replace up/down votes

## Context — the problem

Today there are **two separate rating systems**:
1. **VoteButton** (+1/-1 upvote/downvote) → stored in `votes` table, summed into `karma` table, used for ranking
2. **ReviewSection** (1-5 star rating + comment) → stored in `reviews` table, displayed on product pages only

This is confusing: users see an orange "Vote" button AND a separate star rating form. The up/down votes are the ranking signal, but they carry no nuance (just +1/-1). The star ratings are richer but don't affect ranking.

## What changes

**Star ratings + comments become the single ranking system.** The up/down vote infrastructure is deprecated.

| Surface | Before | After |
|---------|--------|-------|
| **List pages** (grid/list/compact) | VoteButton: toggles +1/-1 vote | VoteButton: opens a **modal** with star rating + comment. Label says "Votar" (new) or "Cambiar voto" (already reviewed) |
| **Product page** | VoteButton + score count in data box, ReviewSection below | Data box shows **average stars + review count** (no VoteButton). Comment form stays in ReviewSection (or merged into data box) |
| **Ranking** | Sorted by karma (sum of +1/-1) | Sorted by **average star rating** (then by review count as tiebreaker) |
| **Schema.org** (task 025) | Already uses `AggregateRating` from reviews | No change needed — this task aligns with it |
| **User profile** (task 026) | "Votados" shows up/down voted whiskies | "Votados" shows whiskies the user has reviewed (with their star rating visible) |
| **Activity feed** (task 027) | Shows latest reviews | Unchanged — already shows reviews with stars |
| **DB** | `votes` + `karma` tables | `reviews` table is the source of truth. `votes`/`karma` tables kept but no longer written to |

## Requirements

### 1. New ranking query

`src/lib/server/reviews.ts` — add `getRatingMap(productIds)`:
```sql
SELECT product_id,
       ROUND(AVG(score), 1) AS avg_rating,
       COUNT(*) AS review_count
FROM reviews
WHERE product_id IN (?, ?, ...)
GROUP BY product_id
```

Returns `Map<string, { avg_rating: number; review_count: number }>`.

`src/lib/server/data.ts` — `getKarmaMap` is replaced by `getRatingMap` (or renamed). The `karma` field becomes `avg_rating` and `vote_count` becomes `review_count`.

### 2. New type

`src/lib/types.ts` — update or add `EntityRating`:
```ts
export interface EntityRating {
    entity_id: string;
    rank: number;
    avg_rating: number;   // 0–5, one decimal
    review_count: number;
}
```

### 3. Client store

`src/lib/stores/karma.svelte.ts` → update internals:
- `KarmaEntry` → `{ avg_rating: number; review_count: number }`
- `seedKarma`, `refreshKarma` → use new API response shape
- **Remove `applyDelta`** (no more optimistic +1/-1)

`src/lib/stores/voted.svelte.ts` → rename to `reviewed.svelte.ts`:
- Tracks which products the current user has reviewed (instead of voted)
- `isReviewed(slug)` instead of `isVoted(slug)`
- Seeded from the new API endpoint

### 4. API changes

**`GET /api/karma`** → rename to `GET /api/rating` (or keep URL, change response):
```json
{
  "items": [{ "entity_id": "slug", "avg_rating": 4.2, "review_count": 12 }],
  "reviewed": ["slug1", "slug2"]
}
```

**`POST /api/vote`** → **remove or repurpose**:
- Option A: Delete it. The review POST is the new vote.
- Option B: Repurpose to accept `{ product_id, score, comment }` and call `insertReview` + update rating map. Keeps the same URL, changes the payload.

**`POST /api/reviews`** → stays, now the primary vote endpoint:
- Change `insertReview` to **upsert**: `ON CONFLICT(product_id, user_id) DO UPDATE SET score, comment, created_at` — enforces one review per user per product.
- After insert/upsert: invalidate rating cache.

### 5. VoteButton → ReviewModal

`src/lib/components/VoteButton.svelte` → **rewrite** to:
- Props: `slug`, `country`, `productName`, `productImage`
- On click: if not authed → open login. If authed → open a **modal** (`Modal.svelte`)
- Modal content:
  - Product name + small image
  - Star rating selector (1–5, same as current ReviewSection form)
  - Comment textarea (optional)
  - Submit button
  - If user already reviewed: pre-fill stars + comment, label says "Cambiar voto" / "Alterar voto"
  - If new: label says "Votar" / "Votar"
- On submit: POST to `/api/reviews`, update the rating store, show toast
- Button label in lists: `★ Votar` (new) or `★ Cambiar voto` (existing review)

### 6. Product page changes

`src/routes/whisky/[slug]/+page.svelte`:
- **Remove VoteButton** from the data box
- Data box shows: average stars (large, amber) + "X comentarios" count + FavoriteButton
- ReviewSection stays below (or comment form moves into data box)
- Star display uses `avg_rating` from the rating store

### 7. Ranking sort

All listing pages (`+page.svelte`, `origen/[slug]/+page.svelte`, favorites) change sort from:
```ts
karmaStore.get(b.slug).karma - karmaStore.get(a.slug).karma
```
to:
```ts
ratingStore.get(b.slug).avg_rating - ratingStore.get(a.slug).avg_rating
// tiebreaker: review_count
```

### 8. Messages

- `"vote_change"`: "Cambiar voto" / "Alterar voto"
- `"vote_average"`: "Puntuación media" / "Pontuação média"
- `"reviews_count"`: "{count} comentarios" / "{count} comentários"

### 9. DB migration

`db/migrations/0009_unify_votes.sql`:
- Add `UNIQUE(product_id, user_id)` constraint on `reviews` table (one review per user per product)
- Mark `votes` and `karma` tables as deprecated (add comment, no delete)

## Files affected

| File | Change |
|------|--------|
| `src/lib/types.ts` | `EntityKarma` → `EntityRating` (or new type) |
| `src/lib/server/reviews.ts` | Add `getRatingMap()`, change `insertReview` to upsert |
| `src/lib/server/votes.ts` | Deprecate (keep for backward compat, no new writes) |
| `src/lib/server/data.ts` | Replace `getKarmaMap` with rating-based version |
| `src/lib/stores/karma.svelte.ts` | Update to rating data shape, remove `applyDelta` |
| `src/lib/stores/voted.svelte.ts` | → `reviewed.svelte.ts` (tracks reviewed slugs) |
| `src/routes/api/vote/+server.ts` | Remove or repurpose |
| `src/routes/api/reviews/+server.ts` | Add upsert, add user review check |
| `src/routes/api/karma/+server.ts` | Rename to `/api/rating`, new response shape |
| `src/lib/components/VoteButton.svelte` | Rewrite: opens modal with star+comment |
| `src/lib/components/ReviewSection.svelte` | May merge into product page data box |
| `src/routes/whisky/[slug]/+page.svelte` | Remove VoteButton, show avg stars in data box |
| `src/routes/+page.svelte` | Update sort to use avg_rating |
| `src/routes/origen/[slug]/+page.svelte` | Same sort change |
| `src/routes/user/[userId]/+page.svelte` | "Votados" → reviewed products with star badge |
| Messages (es, pt) | New keys for change vote, avg rating, reviews count |
| Tests | Update vote/review tests |

## Impact on other tasks

| Task | Impact |
|------|--------|
| **025** Schema.org | Already aligned — `AggregateRating` from reviews. No change needed |
| **026** User profile | "Votados" section shows reviewed products with star rating instead of up/down |
| **027** Activity feed | No change — already shows reviews with stars |
| **020** Server-authoritative vote state | **Superseded** — `reviewed` store replaces `voted` store |
| **024** Compact view | VoteButton in compact rows changes to star+comment modal trigger |

## Acceptance criteria

- Single rating system: star reviews (1–5 + optional comment) stored in `reviews` table
- VoteButton on list pages opens a modal with star selector + comment form
- If user already reviewed: modal pre-fills, label says "Cambiar voto"
- Product page data box shows average stars + review count (no VoteButton)
- Ranking sorted by average star rating (review count as tiebreaker)
- One review per user per product (upsert, not multiple inserts)
- `votes`/`karma` tables deprecated (no new writes)
- All existing tests updated, new tests for upsert + rating map
- `npm run check`, `npm test`, `npm run build` pass

## Progress

