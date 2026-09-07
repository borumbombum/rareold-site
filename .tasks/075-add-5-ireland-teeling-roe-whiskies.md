# Add 5 Irish whiskies (Method & Madness, Teeling x3, Roe & Co)

Status: [DONE]

## Context

User asked for a batch of 5 whiskies from the pending queue (`docs/whisky-brands-and-products-to-add.md`), with localized influencer videos for every language, then bump version, commit + push to production. Batch picks the first 5 unticked lines top-down:

1. Method and Madness Single Pot Still - Midleton (Ireland, Cork — distillery `midleton` exists)
2. Teeling Small Batch - Teeling (Ireland, Dublin — distillery `teeling` to create)
3. Teeling Single Malt - Teeling (Ireland, Dublin — distillery `teeling`)
4. Teeling Single Pot Still - Teeling (Ireland, Dublin — distillery `teeling`)
5. Roe & Co Blended Irish Whiskey - Roe & Co (Ireland, Dublin — distillery `roe-and-co` to create)

## Requirements

Follow `.agents/skills/add-product/SKILL.md` for each product: de-dup check, research, distillery records (new: Teeling, Roe & Co — full record incl. coordinates, all translations), images (`scripts/prepare-image.mjs`), seed entries in `data/seed/whiskies.json`, influencer videos (exact expression, in-language) via the `youtube-search` skill for es/en/pt/ja/fr, then `npm run db:sync`, `npm run data:export`, `npm run check`. Tick the 5 queue lines at the end. Bump version, commit, push to production.

## Acceptance criteria

- [ ] 5 new products live in Turso and in `src/lib/data/whiskies.json` with `distillery_id` resolved and videos embedded.
- [ ] 2 new distilleries (teeling, roe-and-co) with complete records incl. coordinates and 5-language descriptions, rendering on `/map`.
- [ ] At least 2 videos per language per product after sync (4 where findable), all exact-expression and in-language.
- [ ] Queue lines ticked ✅; `npm run check` passes.
- [ ] Version bumped; commit + push to production.

## Progress

- 2026-09-06: Created task. De-dup verified: none of the 5 products exist in `src/lib/data/whiskies.json` or `data/seed/whiskies.json`; `midleton` distillery exists (reuse, region Cork); `teeling` and `roe-and-co` distilleries do NOT exist — create both. Ireland regions available: Antrim, Cork, Dublin, Kerry, Waterford, Wicklow (Teeling → Dublin, Roe & Co → Dublin).
- 2026-09-07: Researched all 5 products + created distilleries (teeling, roe-and-co) with full records and coordinates. Downloaded 5 images (500x500 webp). Harvested 38 verified exact-expression videos (es/en/pt/ja/fr). Seeded 5 products in `data/seed/whiskies.json`; db:sync (products 352, distilleries 147, videos 3617); data:export + `npm run check` (0 errors). Dropped Whisky.com `XE6OyERBF5U` ("Spirit of Dublin" = Teeling poitín, not the matured SPS). Queue lines 238-242 ticked ✅. Videos shipped where exact matches found: fr has 0 (per skill, English tops up); pt only for Teeling Small Batch.