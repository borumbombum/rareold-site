# Add 5 US whiskies (Barrell, Jack Daniel's x2, George Dickel, Uncle Nearest)

Status: [DONE]

## Context

User asked for a batch of 5 whiskies from the pending queue (`docs/whisky-brands-and-products-to-add.md`), following the `add-product` skill workflow. Batch picks the next 5 unticked lines top-down:

1. Barrell Bourbon - Barrell Craft Spirits
2. Jack Daniel's Old No. 7 - Jack Daniel's
3. Gentleman Jack - Jack Daniel's
4. George Dickel Barrel Select - George Dickel
5. Uncle Nearest 1884 Small Batch - Uncle Nearest

All are USA whiskies. Jack Daniel's x2 and George Dickel are Tennessee (TN), Barrell and Uncle Nearest are craft producers. 4 new distilleries needed (Barrell Craft Spirits, Jack Daniel's, George Dickel, Uncle Nearest).

Note: first batch to add Tennessee (origins/tnc) data alongside Kentucky.

## Requirements

Follow `.agents/skills/add-product/SKILL.md` for each product: de-dup check, research, distillery records, images, seed entries, influencer videos (exact expression, in-language) for es/en/pt/ja/fr, then db:sync, data:export, check. Tick the 5 queue lines at the end. Do NOT commit/push unless explicitly asked (remote pushes to production).

## Acceptance criteria

- [x] 5 new products live in Turso and in `src/lib/data/whiskies.json` with `distillery_id` resolved and videos embedded.
- [x] 4 new distilleries with complete records incl. coordinates and 5-language descriptions, rendering on `/map`.
- [x] At least 2 videos per language per product where findable, all exact-expression and in-language.
- [x] Queue lines ticked ✅; `npm run check` passes (0 errors).
- [x] No commit/push.

## Progress

- 2026-09-12: Created task. De-dup verified — none of the 5 target whiskies or their 4 distilleries exist.
- 2026-09-12: Seeded 4 distilleries (barrell-craft-spirits, jack-daniels, george-dickel, uncle-nearest) + 5 products in `data/seed/` with 5-language localized content and `distillery_id` links. Region `Tennessee` (usa-tennessee) is new and auto-derived from products. Product ABVs: Barrell Bourbon 58.5 (Batch 038), JD Old No. 7 40, Gentleman Jack 40, Dickel Barrel Select 43, Uncle Nearest 1884 46.5.
- 2026-09-12: Images: 5 transparent cutouts produced via `prepare-image.mjs` (official brand renders — JD live-jd24-backend PNGs, georgedickel.com CTF asset, unclenearest.com PNG). Barrell kept its earlier webp from the previous pass.
- 2026-09-12: Videos researched in-parallel (one agent per product), all verified via oEmbed (40 live checks). Coverage: JD Old No. 7 en/es/pt/ja 4/4/4/4; Gentleman Jack en/es/pt/ja 4/4/3/3; Dickel en/ja 4/1; Uncle Nearest en 4; Barrell en 4 (no in-language non-en coverage exists). es/pt/fr empty slots are honest-search gaps — English tops up at runtime. Dropped 1 unverifiable "ja" pick (Cynical Mikey — could not confirm Japanese narration).
- 2026-09-12: `npm run db:sync` → distillery 176 (+4), products 402 (+5), videos 4085 (+43). `npm run data:export` → 5 products present in `src/lib/data/whiskies.json`, `usa-tennessee` in `regions.json`. `npm run check` → 0 errors (29 pre-existing warnings). Queue lines 291-295 ticked ✅.