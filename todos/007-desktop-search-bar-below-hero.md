Status: TODO

# Big search bar below the ranking title hero on desktop

## Context

On desktop there should be a big search bar directly below the text ranking title hero. A full-featured `SearchBar` component already exists (`src/lib/components/SearchBar.svelte`: input, dropdown results, keyboard nav, flag/origin badges) but it is rendered in the sticky Header (`Header.svelte` lines ~38-40), not under the hero. The homepage hero (`src/routes/+page.svelte` lines ~64-72) has only title + subtitle + count.

## Requirements

- Big search bar below the hero/ranking title on desktop.
- Reuse the existing `SearchBar` component and its global data access (`src/lib/data/whiskies.ts`).

## Acceptance criteria

- Homepage hero shows a big search bar underneath on desktop.
- Search still works (results, keyboard nav, badges) as in the header version.
- Mobile layout unaffected / sensible.

## Progress

