# Add 5 US bourbons (Four Roses x3, Wild Turkey x2)

Status: [DONE]

## Context

User asked for a batch of 5 whiskies from the pending queue (`docs/whisky-brands-and-products-to-add.md`), following the `add-product` skill. Batch picks the first 5 unticked lines top-down:

1. Four Roses Yellow Label - Four Roses (USA, Kentucky)
2. Four Roses Small Batch - Four Roses (USA, Kentucky)
3. Four Roses Single Barrel - Four Roses (USA, Kentucky)
4. Wild Turkey 101 - Wild Turkey (USA, Kentucky)
5. Wild Turkey Rare Breed - Wild Turkey (USA, Kentucky)

## Requirements

Follow `.agents/skills/add-product/SKILL.md` for each product: de-dup check, research, distillery records (2 new: four-roses, wild-turkey — full records incl. coordinates and 5-language translations), images (`scripts/prepare-image.mjs`), seed entries in `data/seed/whiskies.json`, influencer videos (exact expression, in-language) via the `youtube-search` skill for es/en/pt/ja/fr, then `npm run db:sync`, `npm run data:export`, `npm run check`. Tick the 5 queue lines at the end. Do NOT commit/push (remote pushes to production).

## Acceptance criteria

- [x] 5 new products live in Turso and in `src/lib/data/whiskies.json` with `distillery_id` resolved and videos embedded.
- [x] 2 new distilleries (four-roses, wild-turkey) with complete records incl. Lawrenceburg KY coordinates and 5-language descriptions, rendering on `/map`.
- [x] At least 2 videos per language per product where findable, all exact-expression and in-language (FR absent for Small Batch/Single Barrel/101/Rare Breed; no FR/ES for Rare Breed — English tops up at runtime per skill).
- [x] Queue lines ticked ✅; `npm run check` passes (0 errors, 29 baseline warnings).
- [x] No commit/push.

## Progress

- 2026-09-10: Created task. De-dup verified — none of the 5 target whiskies or their 2 distilleries exist.
- 2026-09-10: Researched all 5 products + 2 distilleries via web search. Product name decision: Four Roses entry bourbon ships as "Four Roses Bourbon" (current official name since 2018 rebrand; the old "Yellow Label" name is legacy). Distillery facts: Four Roses founded 1888 by Paul Jones Jr., owned by Kirin, Lawrenceburg KY (37.973, -84.898); Wild Turkey first distilled 1869, owned by Gruppo Campari, Lawrenceburg KY (38.043, -84.853).
- 2026-09-10: Appended 2 distilleries + 5 products to seed files with translations in es/pt/en/ja/fr. Images: 3 official Four Roses transparent PNG renders + 1 official WT101 hero + 1 official Rare Breed render, all processed to 500x500 webp via `prepare-image.mjs`.
- 2026-09-10: Video discovery delegated to 5 parallel agents following the `youtube-search` skill; each verified candidates via oEmbed. Totals per product: four-roses-bourbon en4/es2/pt2/ja4/fr1; four-roses-small-batch en4/es3/pt2/ja2; four-roses-single-barrel en4/es1/ja2; wild-turkey-101 en3/es2/pt3/ja2; wild-turkey-rare-breed en3/pt1/ja3.
- 2026-09-10: db:sync (products 382, distilleries 165, videos 3938); data:export + check (0 errors, 29 baseline warnings). Verified exported products have distillery resolved + `videos` embedded; both new distilleries carry lat/lng for `/map`. Queue lines 269-273 ticked.
- 2026-09-10: One-pass `yt-verify.mjs` audit of all 47 URLs found `kwdD6_bNOUk` (WT101 pt) DEAD → deleted from Turso + seed, re-synced (videos 3937), re-exported (WT101 pt now 2, above floor). Task DONE. No commit/push (not requested).