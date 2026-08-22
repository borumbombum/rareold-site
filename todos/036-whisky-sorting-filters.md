Status: DONE

# Add user-selectable sorting for whisky lists

## Context

Currently whiskies are only sorted by rating (avg_rating desc, then review_count desc, then name). The user wants additional sort options: latest added, worst rated, alphabetical, etc. This should be a dropdown or pill selector on the homepage and origin pages.

## Requirements

1. Add a sort dropdown/select to the homepage (`src/routes/+page.svelte`) and origin pages (`src/routes/origen/[slug]/+page.svelte`)
2. Available sort options:
   - **Top rated** (current default) — by avg_rating desc
   - **Most reviewed** — by review_count desc
   - **Latest** — by created_at or insertion order desc
   - **Worst rated** — by avg_rating asc
   - **A-Z** — alphabetical by localized name
3. Sort state should be stored in `filters.svelte.ts` store and persisted in URL query param or localStorage
4. Sorting happens client-side (the data is already loaded as JSON)
5. The sort selector should match the existing UI style (small, minimal, Tailwind)
6. Add translated labels for sort options in all locale message files
7. Default sort remains "Top rated"

## Acceptance criteria

- Sort selector visible on homepage and origin pages
- Changing sort re-orders the product grid/list immediately
- Sort preference persists across page loads (localStorage or URL)
- All 5 sort options work correctly
- Responsive — works on mobile
- `npm run build` succeeds

## Progress

- 2026-08-21 (ox-alpha): Added `SortKey` type + `sort` state to `filters.svelte.ts` with localStorage persistence (`rareold.sort`, `initSort()`/`setSort()`). Shared `sortWhiskies()` in `src/lib/utils/sort.ts` (top/reviews/latest/worst/az; latest = DB insertion order via `p.rowid AS insertion_order` in db-export — no `created_at` column exists in products table). New `SortSelect.svelte` (rounded-full select matching ViewToggle style) placed next to ViewToggle on homepage and origin pages. Translated `sort_*` labels added to all 5 message files. Verified: data:export OK (160 whiskies), build OK, svelte-check 0 errors.
