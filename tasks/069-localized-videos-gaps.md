Status: [TODO] Backfill Remaining Localized Videos

## Context

Task 053 backfilled influencer videos to the catalog's honest-dry ceiling. Final state: 3111 videos across 302 products, but **179 of 302 products are still missing ≥1 of es/pt/ja/fr**, and **8 products have zero videos at all** (Catto's 12/25, La Alazana Peated, Madoc ×3 found-dry; Royal Salute 30/62 admin-decision). These gaps are documented-dry *today* — no in-language, exact-expression review exists in the searchable YouTube space. But new and older videos surface on YouTube over time, so this is an append-only periodic re-probe: revisit the gaps later and fill whatever newly appears.

Sources of truth: `src/lib/data/influencer_videos.json` (export) + `data/seed/whiskies.json` (seed). Videos are NOT nested in the whiskies export.

## Requirements

- Re-run the per-product gap analysis: for every product, list which of es/pt/ja/fr are missing (using `src/lib/data/influencer_videos.json`).
- For the largest remaining gaps, re-run the `youtube-search` skill (yt-search.mjs + yt-invidious + oEmbed verify) to catch newly-uploaded in-language, exact-expression reviews.
- Inject any newly-found verified videos into `data/seed/whiskies.json` `influencer_videos`, then `npm run db:sync`, `npm run data:export`.
- Never pad a slot with wrong-language or wrong-expression content (honest-dry rule).
- Verify full seed↔export parity (0 orphans/missing/dups/label-mismatch) and `npm run check` (0 errors / 25 baseline warnings).

## Acceptance criteria

- [ ] A fresh gap analysis exists showing current es/pt/ja/fr coverage per product.
- [ ] Largest gaps re-probed (youtube-search skill); any found videos injected, oEmbed-verified, db:sync + data:export run.
- [ ] seed↔export parity exact; no duplicate URLs.
- [ ] `npm run check` passes.
- [ ] Still-dry slots re-documented.

## Progress

- 2026-09-03: Task created from task 053 close-out analysis (179/302 missing ≥1 localized lang; 8 zero-video products).
