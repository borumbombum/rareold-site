Status: [DONE]

# Add 5 blended Scotch whiskies: Scallywag, Rock Oyster, Timorous Beastie, The Peat Monster, The Spice Tree

## Context

User asked to add 5 more whiskies from `docs/whisky-brands-and-products-to-add.md` with localized videos for every language, then bump version, commit and push to prod. Picked the first 5 unticked lines (all `Scotland — Grains & Blends`, lines 214–218):

1. `Scallywag - Douglas Laing` → Speyside blended malt, NAS, 46% — distillery exists (douglas-laing)
2. `Rock Oyster - Douglas Laing` → Islands blended malt (renamed **Rock Island** Apr 2019, same liquid), NAS, 46.8% — distillery exists
3. `Timorous Beastie - Douglas Laing` → Highland blended malt, NAS, 46.8% — distillery exists
4. `The Peat Monster - Compass Box` → heavily peated blended malt, NAS, 46% — **new distillery** compass-box (London HQ, Chiswick)
5. `The Spice Tree - Compass Box` → French-oak hybrid-cask blended malt, NAS, 46% — distillery compass-box

All `origin=scotland`. Regions (exist in regions.json): Scallywag→Speyside, Rock Oyster→Islands, Timorous Beastie→Highlands, Peat Monster/Spice Tree→Blended Scotch. Step 0 verified: none of the 5 whiskies exist in seed or exported data; Compass Box distillery missing.

## Requirements

1. Create Compass Box distillery record in `data/seed/distilleries.json` — full 5-language names/descriptions, Chiswick (London) coordinates, founded 2000, website.
2. Download + convert 5 product images via `prepare-image.mjs` into `data/images/` (Scallywag, Rock Oyster [current Rock Island bottle], Timorous Beastie, Peat Monster, Spice Tree).
3. Add 5 product entries to `data/seed/whiskies.json` with all locale fields + `influencer_videos` (target 4/lang, honest-dry OK where absent; oEmbed-verify, exact whisky only, spoken language = slot language).
4. `npm run db:sync` → `npm run data:export` → `npm run check`; verify compass-box renders on `/map`.
5. Tick the 5 queue lines, update `docs/LEARNINGS.md` + `docs/lessons-learned.md`.
6. Bump version, commit, push to prod (explicitly requested).

## Acceptance criteria

- [x] 5 products + 1 distillery in Turso and `src/lib/data/` after export
- [x] Every product has verified in-language videos, no duplicate URLs, exact expression only
- [x] `npm run check` passes (0 errors); compass-box plottable on `/map`
- [x] Queue lines 214–218 ticked ✅
- [x] Version bumped, committed, pushed to prod

## Progress

- 2026-09-05 (big-pickle): Task created `[DONE]` (work completed in a single session). Step 0 de-dup: Douglas Laing exists (reuse id `douglas-laing`), Compass Box missing → created full distillery record (Chiswick 51.4891, -0.2729). Research done for all 5 (Scallywag sherry-led Speyside malt at 46%; Rock Oyster/Rock Island island mélange 46.8%; Timorous Beastie Highland ex-bourbon 46.8%; Peat Monster Caol Ila+Laphroaig 46%; Spice Tree hybrid French-oak 46%).
- 2026-09-05 (big-pickle): Images downloaded from Douglas Laing + Compass Box Shopify CDNs, converted to 500×500 webp q85. 5 product entries appended to seed (332 total) with full pt/en/ja/fr translocations and Spanish base.
- 2026-09-05 (big-pickle): Videos — 5 parallel subagents ran `yt-search.mjs` + `yt-invidious.mjs` per language, then I re-verified all 55 URLs via `yt-verify.mjs` oEmbed and hand-curated: scallywag 11 (en4/pt1/ja4/fr2), rock-oyster 10 (en4/es2/pt1/ja3), timorous-beastie 8 (en4/ja2/fr2), the-peat-monster 14 (en4/es3/pt3/ja3/fr1), the-spice-tree 12 (en4/pt3/ja4/fr1). Honest-dry: Scallywag es/pt=1, Timorous es/pt=0, Peat Monster fr=1, Spice Tree es=0/fr=1, Rock Oyster fr=0. All oEmbed titles confirm exact expression + narration language.
- 2026-09-05 (big-pickle): `npm run db:sync` → 143 distilleries / 332 products / 3457 videos. `npm run data:export` → all 5 resolve distillery+image+videos. `npm run check` → 0 errors, 25 baseline warnings. Queue lines 214–218 ticked ✅. Version bumped 0.2.23 → 0.2.24. LEARNINGS + lessons-learned updated. Committed + pushed to prod. **[DONE]**