# Add 5 Japan whiskies 2 (Coffey Malt, Nikka Days, Fuji Blended, Chichibu x2)

Status: [DONE]

## Context

Next batch top-down from the pending queue. Japan continues:

1. Nikka Coffey Malt - Nikka
2. Nikka Days - Nikka
3. Fuji Blended Whisky - Fuji Gotemba
4. Chichibu Ichiro's Malt Single Malt - Chichibu
5. Chichibu On The Way - Chichibu

Distilleries: nikka (exists, Tokyo HQ) and miyagikyo (exists) reused. 2 new distillery records: fuji-gotemba (Mt Fuji foothills, Shizuoka, Honshu) and chichibu (Saitama, Honshu). Regions: all Honshu — no new region this batch.

## Requirements

- 5 new products + 2 new distilleries (fuji-gotemba, chichibu) seeded with 5-language content and coordinates.
- Coffey Malt links distillery_id miyagikyo (Coffey stills site); Nikka Days links nikka (brand blend anchor, Tokyo HQ).
- Official/clean transparent bottle images for all 5 via `prepare-image.mjs`.
- Influencer videos per language (es/en/pt/ja/fr), exact-expression only, never pad (ja via real katakana names).
- `npm run db:sync`, `npm run data:export`, `npm run check`.

## Acceptance criteria

- [ ] 5 new products live in Turso and `src/lib/data/whiskies.json` with `distillery_id` resolved and videos embedded.
- [ ] 2 new distilleries with complete records incl. coordinates and 5-language descriptions.
- [ ] At least 2 videos per language per product where findable, all exact-expression and in-language.
- [ ] Queue lines 318-322 ticked ✅; `npm run check` passes (0 errors).
- [ ] No commit/push unless explicitly ordered.

## Progress

- 2026-09-13: Created task. De-dup verified — none of the 5 exist; fuji-gotemba and chichibu distilleries are new; nikka/miyagikyo reused.
- 2026-09-13: Researched. Coffey Malt 45% NAS (100% malted barley, Coffey stills at Miyagikyo; legally "grain" whisky) → links miyagikyo. Nikka Days 40% NAS 2018 (grain+malt, no label-standard JSLMA) → links nikka. Fuji Blended (FUJI Single Blended Japanese Whisky) 43% NAS 2022 (grain+malt single distillery; cask: bourbon + wine/beer) → new distillery fuji-gotemba (35.3366/138.8967, 1973, Shizuoka). **NAMED-DECISION (user confirmed):** queue "Chichibu Ichiro's Malt Single Malt" → actual iconic NAS = "Ichiro's Malt & Grain World Blended Whisky White Label" 46% (world blend, Chichibu malt + world whiskies, mizunara marrying vat) → product slug `ichiros-malt-white-label`, links chichibu. On The Way → 2024 Floor Malted ed. 54.5% NAS (Chichibu-only floor-malted stock) → new distillery chichibu (36.0465/139.0544, 2008, Saitama). All regions Honshu — no new region.
- 2026-09-13: Images (prepare-image.mjs): nikka-coffey-malt + nikka-days (official Nikka USA Shopify 2048² transparent), fuji-blended-whisky (woodencork 1000² white-box — accepted, precedent 082), chichibu-on-the-way (official High Road Spirits PNG, transparent), ichiros-malt-white-label (kabukiwhisky white-bg, corner-transparent). All corner-checked.
- 2026-09-13: Video research (5 agents) → 40 candidates collected; 2 rejected (AN-hQ7McgTc "Nikka Days vs From The Barrel", k_EW7AtYiYI "Fuji vs Single Malt" — both comparisons, violates exact-rule). Remaining 38 all verified live via yt-verify.mjs. Coverage: Coffey Malt ja4/en4; Nikka Days ja4/en4/es2/pt1/fr1; Fuji ja4/en2; White Label ja4/en4; On The Way ja1/en2/fr1. es/pt/fr honest zeros where none exact.
- 2026-09-13: Seeded 2 distilleries (fuji-gotemba, chichibu) + 5 products (417 total). On The Way ABV = 54.5% (confirmed whiskybase/official, not 54%). db:sync → regions 41, distilleries 185, products 417, videos 4220. data:export ok. npm run check → 0 errors.
- 2026-09-13: Queue lines 318-322 ticked ✅ (line 321 recorded as White Label world blend per user decision). Task complete.