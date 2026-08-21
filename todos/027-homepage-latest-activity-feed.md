Status: DONE

## Progress

- 2026-08-20: Starting implementation. Adding DB query, data layer, components, homepage integration.

# Homepage latest activity feed (hero → activity → filters)

## Context

The homepage currently flows: `HeroHome` → origin filters → product grid. The user wants a new section **between the hero and the filters** showing the latest 4 community reviews — user avatar, star rating (yellow), whisky bottle image, and comment text. Desktop: 4 cards in a horizontal row. Mobile: swipeable carousel, one card per slide, full width with standard padding.

## Requirements

### 1. Data query

`src/lib/server/reviews.ts` — add `getLatestReviews(limit, db)`:

```sql
SELECT r.id, r.product_id, r.user_id, u.name AS user_name, u.avatar AS user_avatar,
       r.score, r.comment, r.country, r.created_at
FROM reviews r
LEFT JOIN users u ON u.id = r.user_id
WHERE r.comment IS NOT NULL AND r.comment != ''
ORDER BY r.created_at DESC
LIMIT ?
```

Only reviews with actual comments (not just star ratings). Returns `Review[]`.

### 2. Data layer

`src/lib/server/data.ts` — add `getLatestActivity(limit)`:
- Calls `getLatestReviews(limit)`
- Joins each review with the whisky catalog (via `getWhiskyBySlug`) to get product name, image, slug
- Returns `{ review: Review; product: Whisky }[]`
- Cached 5 min (same pattern as `getReviews`)

### 3. Server load

`src/routes/+page.server.ts` — add `getLatestActivity(4)` to the existing `Promise.all` or sequential fetch. Pass `activity` to the page data.

### 4. ActivityCard component

`src/lib/components/ActivityCard.svelte` (new):
- Props: `review: Review`, `product: Whisky`
- Layout:
  - Top: user avatar (circle, 32px) + user name
  - Stars: yellow filled/unfilled `Star` icons (same as `ReviewSection`)
  - Bottle: small product image thumbnail (48x48, rounded, object-contain)
  - Comment: truncated to 2 lines (`line-clamp-2`), text-sm
  - Product name: linked to detail page, text-xs, muted
- Tailwind: `rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900`
- Click whole card → `goto(localizeHref('/whisky/' + product.slug))`
- Cursor pointer on the card

### 5. ActivityFeed component

`src/lib/components/ActivityFeed.svelte` (new):
- Props: `items: { review: Review; product: Whisky }[]`
- **Desktop** (≥640px): `flex gap-4` — 4 `ActivityCard`s side by side
- **Mobile** (<640px): CSS scroll-snap carousel:
  - Container: `flex overflow-x-auto snap-x snap-mandatory gap-3 px-4 sm:px-0`
  - Each card: `snap-center shrink-0 w-full sm:w-auto sm:flex-1`
  - Smooth native scrolling, no JS library
- Optional: small dot indicators below carousel on mobile (4 dots, active one highlighted)
- Section title above: `activity_title` message (es: "Lo que dice la comunidad", pt: "O que diz a comunidade")
- Tailwind section wrapper: `py-6`

### 6. Homepage integration

`src/routes/+page.svelte`:
- Import `ActivityFeed`
- Insert between `<HeroHome>` and `<section id="ranking">`:
  ```svelte
  {#if data.activity.length > 0}
      <ActivityFeed items={data.activity} />
  {/if}
  ```
- Section is hidden when no reviews with comments exist

### 7. Messages

Add to `messages/es.json`:
- `"activity_title": "Lo que dice la comunidad"`

Add to `messages/pt.json`:
- `"activity_title": "O que diz a comunidade"`

### Key details

- **CSS scroll snap** — no JS carousel dependency. Works on all modern browsers. Smooth native scroll on mobile.
- **Images** — bottle images already have 30-day client cache (`Cache-Control: public, max-age=2592000, immutable`). User avatars are standard URLs.
- **Text truncation** — `line-clamp-2` on comment text keeps cards uniform height.
- **Link behavior** — each card links to `/whisky/{slug}` so users can read the full review and leave their own.
- **No new dependencies** — pure Tailwind + CSS scroll snap.
- **Performance** — query cached 5 min at runtime, only 4 rows, minimal payload.

## Acceptance criteria

- Homepage shows latest 4 reviews with comments between hero and origin filters
- Each card shows: user avatar, name, star rating, whisky bottle image, truncated comment, product name (linked)
- Desktop (≥640px): 4 cards in a horizontal flex row
- Mobile (<640px): swipeable carousel, one card per slide, full width with standard `px-4` padding
- Cards are clickable and navigate to the product detail page
- Section hidden when no reviews with comments exist
- `npm run check`, `npm test`, `npm run build` pass

## Progress


- 2026-08-21 (ox-alpha): Verified implemented in code (ActivityFeed.svelte + ActivityCard.svelte wired into homepage, commit 62a4ac2) and marked DONE during housekeeping.
