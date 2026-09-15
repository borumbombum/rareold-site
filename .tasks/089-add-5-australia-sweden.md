# Add 5 whiskies: Australia x3 + Sweden x1 (Lark, Morris, Starward x2, Mackmyra)

Status: [IN_PROGRESS]

## Context

Batch from the queue (lines 360, 361, 362, 363, 367):

1. Lark Classic Cask - Lark (Australia, Tasmania)
2. Morris Muscat Barrel - Morris (Australia, NSW)
3. Starward Nova - Starward (Australia, Victoria, Melbourne)
4. Starward Two-Fold - Starward (Australia, Victoria, Melbourne)
5. Mackmyra Svensk Ek - Mackmyra (Sweden, Gävle)

Origins: `australia` exists (088). `sweden` is NEW → ORIGIN_META entry in `scripts/db-sync.mjs`. Regions: `Tasmania` exists; `Victoria`, `New South Wales`, `Sweden` auto-create from product region strings.

Queue lines to tick: 360, 361, 362, 363, 367. Pending after batch: 22 → 17.

## Requirements

- 5 new products seeded with 5-language content (es/pt/en/ja/fr).
- 4 new distillery records (producing-site anchor rule): lark, morris, starward, mackmyra — coordinates + founded + 5-language descriptions.
- `sweden` origin metadata + region auto-create.
- Official/clean transparent bottle images for all 5 via `prepare-image.mjs` + pixel pass.
- Influencer videos per language (es/en/pt/ja/fr), exact-expression only, never pad.
- `npm run db:sync`, `npm run data:export`, `npm run check` (0 errors).

## Acceptance criteria

- [x] 5 new products live in Turso and `src/lib/data/whiskies.json` with `distillery_id` resolved and videos embedded.
- [x] 4 new distilleries complete incl. coordinates and 5-language descriptions; `sweden` origin resolves.
- [x] Videos in as many languages as exist, all exact-expression and in-language; honest zeros elsewhere.
- [x] Queue lines 360, 361, 362, 363, 367 ticked ✅; `npm run check` passes (0 errors, 29 baseline warnings).
- [x] No commit/push unless explicitly ordered.

## Progress

- 2026-09-15: Created task. De-dup clean (437/200, no collisions).
- 2026-09-15: Research (4 agents): **Lark Classic Cask** = flagship/Signature Collection, 43%/500ml AU/NAS, Bill Lark 1992 recipe, tawny-led small casks + Tasmanian peat, first release 1998; distillery founded 1992 Pontville TAS (-42.69/147.26). **Morris Muscat Barrel** = flagship 46%/700ml/NAS, ex-red-wine casks + extended Muscat fortified finish (up to 20yo muscat), distillery Copper & Grain founded 2016 at Rutherglen **Victoria (not NSW)** (-36.055/146.462), Casella Family Brands. **Starward Nova** = flagship 41%/700ml/NAS all red-wine-barrel; **Two-Fold** = entry 40%/700ml/NAS, 60% Manildra wheat spirit + 40% house malt (blended), NO Scotch ever; Nova name is current (reversed rename Wine Cask→Nova). Distillery founded 2007 (company), first release 2013, Port Melbourne 2016/17 (-37.8293/144.9392), David Vitale. **Mackmyra Svensk Ek** = 46.1%/700ml/NAS, casks 68/12/10/10 (ex-bourbon/new Oloroso/new Swedish oak Visingsö/new American), Swedish oak is the defining lead minority; distillery founded 1999 Valbo (60.63971/16.96541), bankruptcy Aug 2024, reopened Oct 2024 under Lennart Hero + No.1 Capital.
- 2026-09-15: Origin `sweden` added to ORIGIN_META (Suécia/Suécia/スウェーデン/Suède, 🇸🇪). Regions `Victoria` + `Sweden` auto-created; `Tasmania` reused.
- 2026-09-15: Images all pass; Starward bottles were narrow (bbox 0.27w/0.84h) → trim pass zoomed both to 0.32w/1.00h full-height transparent cutouts. Others: lark (dark cutout 0.53×0.98), morris (studio 0.80 opaque), mackmyra (studio cutout 0.80 opaque).
- 2026-09-15: Videos 18 total, all verified live: Lark en 4 (VPBfD1Ra1HY, SVKXlmKvqkM, hUrNmQ_iMe0, m27pukP6sSE); Morris **0 honest** (only comparison/roundup: Whisky Neighbour "Morris Single Malt and Muscat Barrel", Good Dram Show "World Whiskies", OurWhisky "Abasolo & Morris"; official Morris 1:34 promo + Cellar Reserve 48% rejects); Nova en 4 + ja 1 (ひとくちウイスキー) + fr 1 (La Maison du Whisky); Two-Fold en 4 + ja 1 (ゆかりご飯; rejected Dram FM radio); Mackmyra en 3 (dropped "Svensk Ek vs Vinterrök" comparison + "Mack/Bruks/Svensk Ek/Svensk Rök" roundup).
- 2026-09-15: Seeded (text splice; 442 whiskies/204 distilleries), db:sync (204/442/4352 videos/46 regions/15 origins), data:export, check green (0 errors/29 warnings). Queue 360/361/362/363/367 ticked, pending 22→17. Docs updated.