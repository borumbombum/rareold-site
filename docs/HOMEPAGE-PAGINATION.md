# Homepage pagination (infinite scroll)

The homepage (`/`) shows the ranking catalog without a "Load more" button. Instead it uses
**infinite scroll** powered by the browser `IntersectionObserver` API: more products load
automatically just before you reach the bottom of the loaded list.

## How it works

- The homepage loads the **full catalog** from the build-time JSON (`data.products`) on the
  client — there is **no backend/Db/JSON round-trip per page**. Pagination is pure client-side
  slicing of the already-sorted `ranked` array in `src/routes/+page.svelte`.
- On load, only the **first 100** products render (`PAGE_SIZE = 100`, `visible` state).
- A tiny, zero-sized `<div>` sentinel sits just after the last rendered product. An
  `IntersectionObserver` watches it with `rootMargin: "200px 0px"`, which expands the viewport's
  detection box by 200px on the bottom edge. As a result, the callback fires **200px before the
  user reaches the end of the loaded content** — not at the bottom.
- When the callback fires while products remain, `visible += PAGE_SIZE` (100 more). The sentinel
  moves down with each batch, so it keeps re-triggering as you scroll until **all** products are
  shown. Once `visible >= ranked.length`, the observer disconnects (a11y-friendly: nothing left
  to load).

## Filtering and sorting reset

Sort, origin, and region changes (via the `filters` store) recompute the `ranked` array. A
`$effect` keyed on `filters.origin | filters.region | filters.sort` detects the change, resets
`visible` back to `PAGE_SIZE`, and re-arms the observer, so a filtered/sorted view starts fresh
at the first 100 and scroll-feeds again.

## Rank stability

`rank={i + 1}` is computed from the full sorted `ranked` list, not the visible slice, so product
ranks stay correct and stable across batches.

## Code location

All logic lives in `src/routes/+page.svelte` (state + `armObserver()` + the `$effect` that resets
and re-arms). The three view branches (grid / list / compact) each render `ranked.slice(0, visible)`.

## Scope and scale ceiling

Only the homepage paginates today; origin pages (`/origen/[slug]`) still render all products.
This is a stopgap that keeps the current JSON-based frontend fast. The long-term plan is the
**Local SQLite migration (task 067)**, which supersedes the earlier pagination tasks (056–059)
with a self-hosted search index — infinite scroll remains the UX, but the backing data layer
scales much further.
