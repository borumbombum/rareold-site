# Add 5 USA whiskies (Bulleit 95 Rye, Michter's Single Barrel Rye, High West Double Rye!, Westward, Stranahan's)

Status: [DONE]

## Context

User asked to proceed with the next batch top-down from the pending queue (`docs/whisky-brands-and-products-to-add.md`). Batch picks the next 5 unticked lines:

1. Bulleit 95 Rye - Bulleit
2. Michter's US\*1 Single Barrel Rye - Michter's
3. High West Double Rye! - High West
4. Westward American Single Malt - Westward
5. Stranahan's Colorado Whiskey - Stranahan's

All are USA whiskies. Bulleit and Michter's distilleries already exist; High West, Westward and Stranahan's are new (3 new distillery records). Region note: Bulleit 95 Rye is a blend of straights (predominantly Indiana — MGP); High West is Utah; Westward is Oregon; Stranahan's is Colorado. Rye and craft origin group.

## Requirements

- 5 new products + 3 new distilleries (high-west, westward, stranahans) seeded with 5-language content and coordinates, following the `add-product` skill.
- Official/clean transparent bottle images for all 5 (via `prepare-image.mjs`).
- Influencer videos per language (es/en/pt/ja/fr), exact-expression only, never pad.
- `npm run db:sync`, `npm run data:export`, `npm run check` — verify counts grow and products appear in `src/lib/data/whiskies.json`.

## Acceptance criteria

- [x] 5 new products live in Turso and `src/lib/data/whiskies.json` with `distillery_id` resolved and videos embedded.
- [x] 3 new distilleries with complete records incl. coordinates and 5-language descriptions.
- [x] At least 2 videos per language per product where findable, all exact-expression and in-language.
- [x] Queue lines ticked ✅; `npm run check` passes (0 errors).
- [x] No commit/push unless explicitly ordered.

## Progress

- 2026-09-12: Created task. De-dup verified — none of the 5 whiskies exist; bulleit and michters distilleries exist, high-west/westward/stranahans are new.
- 2026-09-12: Researched all 5 products (agents). ABVs: Bulleit 95 Rye 45 (95/5 rye mash, MGP Indiana, distilled-in label = Kentucky grouping), Michter's SB Rye 42.4 (NAS, Louisville), High West Double Rye! 46 (two-rye blend, Utah), Westward ASM 45 (Pacific NW two-row, Oregon), Stranahan's 47 (Colorado Rocky Mountain Whiskey, 4-7 yr barrels).
- 2026-09-12: Images: bulleit-95-rye (Diageo CTF transparent ~2160px), michters SB rye (onshorecellars 1000x1000 white), high-west-double-rye (Shopify transparent PNG), westward (official westwardwhiskey.com transparent PNG), stranahans (internetwines Shopify white 1000x1000 — official dark-bg shots rejected). All produced via `prepare-image.mjs`.
- 2026-09-12: Videos researched in-parallel (one agent per product) + 36-ID oEmbed re-audit (all live, all exact-expression, all in-language). Coverage: Bulleit en4/pt4/ja2/es1/fr0; Michter's SB Rye en4/es2/pt2/ja1/fr1 (fr = LMDW brand presentation); High West en4/es1/pt1/ja0/fr0; Westward en4 only; Stranahan's en4/es1. Niche non-en gaps = honest-search zeros, English top-up at runtime.
- 2026-09-12: `npm run db:sync` → distilleries 179 (+3: high-west, westward, stranahans), products 407 (+5), videos 4121 (+36). `npm run data:export` → 5 products in `src/lib/data/whiskies.json`; new regions usa-utah/usa-oregon/usa-colorado in `regions.json`. `npm run check` → 0 errors (29 pre-existing warnings). Queue lines 299-304 ticked ✅. Not committed/pushed.