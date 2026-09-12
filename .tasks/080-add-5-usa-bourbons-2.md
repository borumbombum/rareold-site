# Add 5 US bourbons (Michter's, Willett x2, Peerless, Rabbit Hole)

Status: [DONE]

## Context

User asked for a batch of 5 whiskies from the pending queue (`docs/whisky-brands-and-products-to-add.md`), following the `add-product` skill workflow. Batch picks the next 5 unticked lines top-down:

1. Michter's US*1 Small Batch Bourbon - Michter's
2. Willett Pot Still Reserve - Willett
3. Noah's Mill - Willett
4. Kentucky Peerless Small Batch - Peerless
5. Rabbit Hole Dareringer - Rabbit Hole

All are USA/Kentucky bourbons. 4 new distilleries needed (Michter's, Willett, Peerless, Rabbit Hole).

## Requirements

Follow `.agents/skills/add-product/SKILL.md` for each product: de-dup check, research, distillery records, images, seed entries, influencer videos (exact expression, in-language) for es/en/pt/ja/fr, then db:sync, data:export, check. Tick the 5 queue lines at the end. Do NOT commit/push (remote pushes to production).

## Acceptance criteria

- [x] 5 new products live in Turso and in `src/lib/data/whiskies.json` with `distillery_id` resolved and videos embedded.
- [x] 4 new distilleries with complete records incl. coordinates and 5-language descriptions, rendering on `/map`.
- [x] At least 2 videos per language per product where findable, all exact-expression and in-language.
- [x] Queue lines ticked ✅; `npm run check` passes.
- [x] No commit/push.

## Progress

- 2026-09-11: Created task. De-dup verified — none of the 5 target whiskies or their 4 distilleries exist. Research completed for all products + distilleries.
- 2026-09-11: Launched parallel agents: 1 image agent (all 5 images from official distillery/first-party sites → 500x500 webp) + 5 video agents (youtube-search skill, oEmbed-verified). Video totals: Michter's US1 en4/es4/ja3; Willett Pot Still en4/ja4; Noah's Mill en4/es2/pt1/ja1; Peerless en4/es1; Dareringer en4/es1/fr2. Rejected: Noah's Mill 15yo '90 (different expression) + compilation video; pt/ja/fr gaps shipped empty per skill (English tops up at runtime).
- 2026-09-11: Appended 4 distilleries (michters, willett, kentucky-peerless, rabbit-hole — full records with lat/lng + es/pt/en/ja/fr) and 5 products to seed files. One-pass oEmbed audit of all 39 URLs: all live, titles match exact expressions.
- 2026-09-11: db:sync (distilleries 172, products 397, videos 4044); data:export (397 whiskies, 172 distilleries, 4044 videos); check 0 errors / 29 baseline warnings. Queue lines 286-290 ticked. Task DONE. No commit/push.
- 2026-09-12: Fixed two ABV errors via direct Turso SQL (db:sync only backfills locale columns): Dareringer 45 → 46.5% (official 93 proof), Peerless 54.45 → 54.55%. Removed 3 comparison/multi-expression videos that violated the strict exact-expression rule (Michter's es "Small Batch & Rye", Michter's ja "Bourbon & Rye", Peerless es "+Single Barrel"); replaced Michter's es with oEmbed-verified EnumlIWBD5E (Hablando de Whisky), left Peerless es empty (no exact match). Final videos 4044 → 4042. Re-exported (397/172/4042), check 0 errors / 29 warnings. No commit/push.
