# Add 5 Japan whiskies 3 (Mars Komagatake, Mars Maltage Cosmo, Akkeshi, Kanosuke, Shizuoka)

Status: [DONE]

## Context

Next batch top-down from the pending queue. Japan continues:

1. Mars Komagatake Single Malt - Mars Shinshu
2. Mars Maltage Cosmo - Mars Shinshu
3. Akkeshi Single Malt - Akkeshi
4. Kanosuke Single Malt - Kanosuke
5. Shizuoka Single Malt Pot Still - Shizuoka

All 4 distilleries are new: mars (Mars Shinshu Distillery, Nagano — Honshu), akkeshi (Hokkaido), kanosuke (Kagoshima, Kyushu), shizuoka (Shizuoka, Honshu). Region: akkeshi → japan-hokkaido (exists); kanosuke likely japan-kyushu (new region?). All 5 products + 4 distilleries need de-dup-verified full records.

## Requirements

- 5 new products + 4 new distilleries (mars, akkeshi, kanosuke, shizuoka) seeded with 5-language content and coordinates.
- Anchoring: single-site products link the producing distillery (komagatake → mars; akkeshi → akkeshi; kanosuke → kanosuke; shizuoka → shizuoka). Mars Maltage Cosmo is a brand-level blend → mars HQ anchor per established pattern (confirm during research).
- Official/clean transparent bottle images for all 5 via `prepare-image.mjs`.
- Influencer videos per language (es/en/pt/ja/fr), exact-expression only, never pad; ja searches via real label katakana (e.g. 駒ヶ岳, マルテージ コスモ, 音狩, 嘉之助, 静岡).
- `npm run db:sync`, `npm run data:export`, `npm run check`.

## Acceptance criteria

- [ ] 5 new products live in Turso and `src/lib/data/whiskies.json` with `distillery_id` resolved and videos embedded.
- [ ] 4 new distilleries with complete records incl. coordinates and 5-language descriptions.
- [ ] At least 2 videos per language per product where findable, all exact-expression and in-language.
- [ ] Queue lines ticked ✅ for the 5 lines; `npm run check` passes (0 errors).
- [ ] No commit/push unless explicitly ordered.

## Progress

- 2026-09-13: Created task. De-dup verified — none of the 5 exist; all 4 distilleries new. Existing Japan distilleries: white-oak, yamazaki, hakushu, chita, suntory, yoichi, miyagikyo, nikka, fuji-gotemba, chichibu.
- 2026-09-13: Researched (5 agents). **Komagatake** = the 2025-year-round flagship "Single Malt KOMAGATAKE" NAS 45% (distillery renamed Mars Shinshu→Mars Komagatake 2024; keep queue "Mars Shinshu" link but we create distillery record as `mars` = "Mars Komagatake Distillery", Nagano 35.7476/137.9011, founded 1985). **Maltage Cosmo** = 43% blended malt (self pot-still malt + imported Scottish malt, vatted at Komagatake) → links same `mars` record (blend anchored to producing site, not Hombo HQ — Hombo HQ is a shochu maker, no whisky-brand record). **Akkeshi** = canonical is **Kanro 寒露** 55% (1st of the 24-solar-terms series, 15000 btl, WWA 2021 Best Japanese SM) → record "Akkeshi Single Malt Kanro", distillery akkeshi (Hokkaido 43.0758/144.8208, founded 2016). **Kanosuke** = 48% core NAS (ex-shochu re-charred key cask) → distillery kanosuke (Kyushu **new region**, 31.6033/130.3356, founded 2017). **Shizuoka** = **Pot Still K** 55.5% (ex-Karuizawa "K" still; W still is wood-fired, not Karuizawa) → distillery shizuoka (Honshu 35.1205/138.3255, founded 2016).
- 2026-09-13: Images (prepare-image.mjs) + pixel pass: mars-komagatake-single-malt + mars-maltage-cosmo = opaque Hombo studio (corners white, ok); akkeshi-kanro-single-malt (dekanta, transparent corners), kanosuke-single-malt (official shopify, transparent corners), shizuoka-pot-still-k (whiskyshopusa bigcommerce, transparent corners).
- 2026-09-13: Video research (5 agents) → 35 candidates, all verified live via yt-verify.mjs. Coverage: Komagatake ja4/en3; Cosmo ja4/en4/fr1; Kanro ja4/en1; Kanosuke ja4/en4; Shizuoka ja4/en2. es/pt/fr honest zeros (Kanro, Kanosuke, Shizuoka).
- 2026-09-13: Seeded 4 distilleries (mars, akkeshi, kanosuke, shizuoka) + 5 products (422 total). db:sync → regions 42 (**japan-kyushu auto-created**), distilleries 189, products 422, videos 4255. data:export ok. npm run check → 0 errors.
- 2026-09-13: Queue lines 323-327 ticked ✅. Task complete.