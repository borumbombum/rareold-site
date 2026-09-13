# Add 5 Japan whiskies (Hibiki Harmony, Yoichi, Miyagikyo, Nikka From The Barrel, Coffey Grain)

Status: [DONE]

## Context

Next batch top-down from the pending queue. Japan:

1. Hibiki Japanese Harmony - Hibiki
2. Yoichi Single Malt - Yoichi
3. Miyagikyo Single Malt - Miyagikyo
4. Nikka From The Barrel - Nikka
5. Nikka Coffey Grain - Nikka

Hibiki is Suntory's house blend (Yamazaki/Hakushu/Chita); Yoichi and Miyagikyo are Nikka's two malt distilleries; From The Barrel is a Nikka cross-site blend; Coffey Grain is distilled at Miyagikyo. 4 new distillery records: suntory (Osaka HQ anchor), yoichi, miyagikyo, nikka (Tokyo HQ anchor). New region japan-hokkaido (Yoichi); Honshu exists.

## Requirements

- 5 new products + 4 new distilleries (suntory, yoichi, miyagikyo, nikka) seeded with 5-language content and coordinates.
- Coffey Grain links distillery_id miyagikyo (producing site). From The Barrel links nikka (brand anchor Tokyo). Hibiki links suntory (Osaka HQ).
- Official/clean transparent bottle images for all 5 via `prepare-image.mjs`.
- Influencer videos per language (es/en/pt/ja/fr), exact-expression only, never pad (ja must find real Japanese videos).
- `npm run db:sync`, `npm run data:export`, `npm run check`.

## Acceptance criteria

- [x] 5 new products live in Turso and `src/lib/data/whiskies.json` with `distillery_id` resolved and videos embedded.
- [x] 4 new distilleries with complete records incl. coordinates and 5-language descriptions.
- [x] At least 2 videos per language per product where findable, all exact-expression and in-language.
- [x] Queue lines 313-317 ticked ✅; `npm run check` passes (0 errors).
- [x] No commit/push unless explicitly ordered.

## Progress

- 2026-09-12: Created task. De-dup verified — none of the 5 exist; existing Japan distilleries are white-oak, yamazaki, hakushu, chita. Region japan-honshu exists; japan-hokkaido to be auto-created.
- 2026-09-12: Researched (agents). Hibiki 43% NAS (mix of 5 casks incl Mizunara, malt Yamazaki/Hakushu + grain Chita); Yoichi 45% NAS (coal-fired karu stills, peated, Hokkaido); Miyagikyo 45% NAS (sherry-forward, steam-heated); From The Barrel 51.4% 500ml (malt+grain vat re-casked at Tochigi); Coffey Grain 45% NAS (95% corn, Coffey stills at Miyagikyo). Coordinates: suntory 34.695/135.495 (Osaka, 1899); yoichi 43.18722/140.79167 (1934); miyagikyo 38.30806/140.65056 (1969); nikka 35.71016/139.80059 (Tokyo HQ).
- 2026-09-12: Images done (prepare-image.mjs). hibiki (official House of Suntory transparent 1500²), miyagikyo (official nikkawhiskyusa 2048² transparent), nikka-from-the-barrel (official nikkawhiskyusa 2048² transparent), nikka-coffey-grain (official Nikka USA Shopify 2048² transparent), yoichi (retailer spades.com.mt transparent cutout 650x1000; official nikka.com lineup render rejected — translucent smoke bg α=71 at corners). All verified α=0 corners post-resize.
- 2026-09-12: Video research agents (5, per product) were launched then CANCELLED by user. Relaunched on confirmation: 61 videos total, all exact-expression (oEmbed verified, all 61 re-audited via yt-verify.mjs — all 200). Coverage: Hibiki ja4/en4/es3/pt1/fr0; Yoichi ja4/en4/es3/fr1/pt0; Miyagikyo ja4/en4/es2/pt0/fr0; From The Barrel ja4/en4/es4/pt3/fr2; Coffey Grain ja4/en4/es1/fr1/pt0 (ja searched as カフェグレーン — the real product name; コフィーグレーン spellings dead-ended).
- 2026-09-12: Images: hibiki (official house.suntory.com transparent PNG), miyagikyo (official nikkawhiskyusa 2048²), nikka-from-the-barrel (official nikkawhiskyusa 2048² transparent), nikka-coffey-grain (official Nikka USA Shopify 2048²), yoichi (retailer spades.com.mt transparent cutout).
- 2026-09-12: Seeded 4 distilleries (suntory, yoichi, miyagikyo, nikka) + 5 products with 5-language content. `npm run db:sync` → regions 41 (+1 japan-hokkaido), distilleries 183 (+4), products 412 (+5), videos 4182 (+61). `npm run data:export` → all 5 in whiskies.json with distillery_id resolved (hibiki→suntory, yoichi→yoichi, miyagikyo→miyagikyo, ftb→nikka, coffey grain→miyagikyo producing site). `npm run check` → 0 errors (29 pre-existing warnings). Queue lines 313-317 ticked ✅. Not committed/pushed.