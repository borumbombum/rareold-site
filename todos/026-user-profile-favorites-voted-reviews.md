Status: TODO

# User profile page (favorites + voted + reviews)

## Context

The current `/user/[userId]/favorites` page shows only favorited whiskies. It has a profile header (avatar, name, admin badge, logout) and a grid/list/compact of favorited products. The page is linked from the header avatar when logged in.

This task turns it into a **full profile page** with three sections: favorites, voted whiskies, and the user's own reviews. The route changes from `/user/[userId]/favorites` to `/user/[userId]`, and the old path redirects.

## Requirements

### 1. Route rename

- Move `src/routes/user/[userId]/favorites/` → `src/routes/user/[userId]/`
- Add a redirect in a new `src/routes/user/[userId]/favorites/+page.server.ts`: `redirect(301, localizeHref('/user/' + params.userId, { locale }))`
- Update `Header.svelte`: change the favorites link from `/user/{id}/favorites` to `/user/{id}`

### 2. Server data

`src/routes/user/[userId]/+page.server.ts` (moved + expanded):

- Owner-only guard: compare `params.userId` to `getSessionUser`, redirect if mismatch (existing pattern)
- Three data sources:
  - `listFavoriteIds(userId)` → slugs for favorites (existing)
  - `getUserVotedSlugs(userId)` → slugs for voted (existing in `votes.ts`)
  - **New:** `getUserReviews(userId)` → user's reviews, most recent first, limit 20
- `getKarmaMap(union_of_slugs)` for favorites + voted products
- Map slugs to whisky objects via `getWhiskyBySlug`
- Return `{ user, favorites, voted, reviews, products, karma, countryCode, view }`

### 3. New query

`src/lib/server/reviews.ts` — add `getUserReviews(userId, db)`:
```sql
SELECT r.id, r.product_id, r.user_id, u.name AS user_name, u.avatar AS user_avatar,
       r.score, r.comment, r.country, r.created_at
FROM reviews r
LEFT JOIN users u ON u.id = r.user_id
WHERE r.user_id = ?
ORDER BY r.created_at DESC
LIMIT 20
```

### 4. Page component

`src/routes/user/[userId]/+page.svelte`:

**Profile header** (existing, unchanged):
- Avatar, name, admin badge, logout button

**Section 1 — Favoritos:**
- Icon: `Heart` (lucide, existing)
- Title: `favorites_title` message + count badge
- `ViewToggle` (grid/list/compact)
- Product cards/rows/compact — filtered from `favorites` slugs
- Empty state: `favorites_empty` message + link to home

**Section 2 — Votados:**
- Icon: `ThumbsUp` (lucide, new)
- Title: `voted_title` message + count badge
- `ViewToggle` (grid/list/compact)
- Product cards/rows/compact — filtered from `voted` slugs
- Optional: show +1/-1 badge per product if `getUserVotes(userId)` is implemented
- Empty state: `voted_empty` message + link to home

**Section 3 — Comentarios:**
- Icon: `MessageCircle` (lucide, new)
- Title: `reviews_mine_title` message + count badge
- No ViewToggle (reviews are always a list)
- Review cards showing: stars, comment text, product name (linked), date
- Empty state: `reviews_mine_empty` message + link to home

Each section is always visible (even when empty) so the user discovers the feature.

### 5. New component

`src/lib/components/UserReviewCard.svelte`:
- Props: `review: Review`, `productName: string`, `productSlug: string`
- Shows: star rating (filled/unfilled), comment text (truncated), product name as link, formatted date
- Tailwind consistent with existing `ReviewSection.svelte` review cards

### 6. Messages

Add to `messages/es.json`:
- `"voted_title": "Mis votados"`
- `"voted_empty": "Todavía no votaste whiskies. Andá al ranking y votá con el botón."`
- `"reviews_mine_title": "Mis comentarios"`
- `"reviews_mine_empty": "Todavía no hiciste comentarios."`

Add to `messages/pt.json`:
- `"voted_title": "Meus votados"`
- `"voted_empty": "Ainda não votou em whiskies. Vá ao ranking e vote."`
- `"reviews_mine_title": "Meus comentários"`
- `"reviews_mine_empty": "Ainda não fez comentários."`

### 7. Optional enhancement

`getUserVotes(userId)` in `votes.ts`: returns `{ entity_id: string, value: number }[]` instead of just slugs. Enables showing a small +1 (green) or -1 (red) badge on each voted product card, so the user remembers which way they voted.

## Acceptance criteria

- `/user/{userId}` is the profile page with three sections: favoritos, votados, comentarios
- Each section shows correct data: favorites by karma, voted by karma, reviews by date
- Empty sections show a helpful message with a link to take action
- Profile header (avatar, name, admin, logout) unchanged
- `/user/{id}/favorites` redirects to `/user/{id}` (301)
- Header avatar links to `/user/{id}`
- ViewToggle works for favoritos and votados sections
- `npm run check`, `npm test`, `npm run build` pass

## Progress

