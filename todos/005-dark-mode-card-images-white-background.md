Status: DONE

## Progress

- 2026-08-15 — Set image containers to `dark:bg-white` in `ProductCard.svelte:36`, `ProductRow.svelte:39`, detail page `whisky/[slug]/+page.svelte:80`, and `SearchBar.svelte:129`. Light mode unchanged. Verified: `npm run check` 0 errors.

# White background for product card images in dark mode

## Context

Most images are webp with white or transparent backgrounds. In dark mode the card image containers currently use a dark background, so the images look wrong. They should sit on a white background.

## Requirements

- In dark mode, product image containers get a white background.

## Acceptance criteria

- Image wrappers use white background in dark mode:
  - `src/lib/components/ProductCard.svelte` (line ~44 `bg-zinc-50 dark:bg-zinc-950`)
  - `src/lib/components/ProductRow.svelte` (line ~36)
  - detail page `src/routes/whisky/[slug]/+page.svelte` (line ~70)
  - SearchBar result thumbnails (`SearchBar.svelte` line ~139 `dark:bg-zinc-900`)
- Light mode unchanged.

## Progress

