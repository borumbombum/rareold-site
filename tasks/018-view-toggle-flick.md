Status: [DONE]

# Fix view-toggle flick on page return/reload

## Context

The view preference (grid/list) is stored in `localStorage` (`rareold.view`) but the store
`src/lib/stores/view.svelte.ts` defaults to `'grid'` and only reads the stored value lazily via
`view.init()`, which is called from a `$effect` in `src/routes/+layout.svelte` — i.e. **after** the
first render. As a result every fresh render of a listing page (home, favorites) paints grid first and
then flips to the stored choice, causing a visible flick when navigating away and back (full load /
SSR-first-paint). The dark-mode theme already avoids this with a pre-paint inline script in
`src/app.html`; the view toggle has no equivalent.

## Requirements

1. `src/app.html`: add an inline head script (mirroring the existing theme script) that reads
   `rareold.view` from localStorage and, when `grid`/`list`, sets `data-view` on
   `document.documentElement` before first paint.
2. `src/lib/stores/view.svelte.ts`: initialize `_view` synchronously at module scope in the browser,
   preferring `document.documentElement.dataset.view` (set pre-paint by the inline script), falling
   back to `localStorage`. Keep `set()` writing through to localStorage and keep `init()`/`load()`
   idempotent (safety net, no flick).
3. `src/routes/+layout.svelte`: remove the now-redundant `$effect(() => view.init())`.

## Acceptance criteria

- Selecting list (or grid), navigating to another page and returning shows **no** view flick.
- A full page load (SSR) paints the listing in the stored view from the first frame.
- Favorites page (which also uses `view.current`) is covered.
- `npm run check`, lint, and `npm run build` pass.

## Progress

- 2026-08-15 (session-018): root cause confirmed — lazy `view.init()` in a layout `$effect` flips the
  view after first paint. Implemented the pre-paint inline script + eager store init.
- 2026-08-15 (session-018): implemented and verified. `src/app.html` gains a second inline head script
  that reads `rareold.view` and sets `data-view` on `<html>` before first paint (mirrors the theme
  script). `src/lib/stores/view.svelte.ts` now initializes `_view` eagerly at module scope in the
  browser from `data-view`, falling back to `localStorage`; `set()` still persists, `init()`/`load()`
  stay as an idempotent safety net. Removed the redundant `$effect(() => view.init())` (and its import)
  from `src/routes/+layout.svelte`. Covers home + favorites listing pages and full SSR loads.
  Verified: `npm run check` 0 errors, `npm test` 51/51, `npm run build` OK.
- 2026-08-15 (session-018): **SSR-first-paint flash fixed (cookie approach).** The lazy-init fix alone
  wasn't enough: SSR always rendered the grid branch (server couldn't know the preference), so the
  browser painted grid before JS swapped to list. Now the preference reaches the server:
  - `src/app.html`: inline head script also writes `rareold.view` cookie (`path=/; samesite=lax;
    max-age=31536000`) from localStorage, pre-paint.
  - `src/lib/stores/view.svelte.ts`: `set()` writes the same cookie so SSR stays in sync.
  - `src/routes/+layout.server.ts`: reads the cookie → `data.view`.
  - `src/routes/+page.svelte` and `user/[userId]/favorites/+page.svelte`: branch on
    `$derived(browser ? view.current : data.view)` — server renders the user's view directly, client
    hydrates to the same value → zero flip.
  - `src/routes/+page.server.ts`: added `Vary: Cookie` so the CDN (s-maxage=300) doesn't cross-serve
    grid/list HTML.
  Verified with the built app: no cookie → 156 grid cards / 0 rows; `rareold.view=list` → 0 cards /
  156 rows; `rareold.view=grid` → 156 cards. `npm run check` 0 errors, `npm test` 51/51,
  `npm run build` OK.
