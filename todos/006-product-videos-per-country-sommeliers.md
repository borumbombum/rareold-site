Status: TODO

# Product videos section per country (sommeliers)

## Context

Each product should have a list of videos from different sommeliers. The list of videos should be per country in translations, since this is localized content. Today the data model only has a single nullable `video` URL string per product (`whiskies.json`, typed `video: string | null` in `src/lib/types.ts` line ~319), and the UI renders a single PlayButton opening one URL (`ProductCard.svelte`, `ProductRow.svelte`, `[slug]/+page.svelte`, `VideoModal.svelte`). The migration `db/migrations/0002_products_video.sql` comment explicitly marks per-country sommelier videos as future work.

## Requirements

- Data model supports a list of videos per product, grouped/labeled per country.
- Localized content (es/pt) via Paraglide messages.
- UI section on the product detail page listing the sommelier videos.

## Acceptance criteria

- `whiskies.json` / types expose a per-country videos list (replacing/augmenting the single `video`).
- Detail page renders a videos section listing each sommelier video.
- Localized labels via `messages/*.json` + generated `src/lib/paraglide/`.

## Progress

