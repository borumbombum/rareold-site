# Add 5 whiskies: Northern Europe sweep (High Coast, Kyrö, Stauning, Cotswolds, Bimber)

Status: [IN_PROGRESS]

## Context

Batch from the queue (lines 368, 372, 376, 380, 381):

1. High Coast Hav - High Coast (Sweden, Ådalen/Ångermanland)
2. Kyrö Malt Rye - Kyrö (Finland, Isokyrö) — EARLIEST 100% rye whisky
3. Stauning Rye - Stauning (Denmark, Skjern) — floor-malted farm rye
4. Cotswolds Single Malt - Cotswolds (England, Stourton)
5. Bimber Re-Charred Oak - Bimber (England, London)

Origins: `sweden` (089) and `england` exist. `finland` + `denmark` are NEW → ORIGIN_META entries in `scripts/db-sync.mjs`. Regions: `Sweden` exists; new regions Finland, Denmark (or better region strings) to research; England region decision needed (Cotswolds distillery at Stourton, Bimber at London → likely a shared "England" region string or existing one).

Queue lines to tick: 368, 372, 376, 380, 381. Pending after batch: 17 → 12.

## Requirements

- 5 new products seeded with 5-language content (es/pt/en/ja/fr).
- 5 new distillery records (producing-site anchor rule): high-coast, kyro, stauning, cotswolds, bimber — coordinates + founded + 5-language descriptions.
- `finland` + `denmark` origin metadata; region auto-create.
- Official/clean transparent bottle images for all 5 via `prepare-image.mjs` + pixel pass.
- Influencer videos per language (es/en/pt/ja/fr), exact-expression only, never pad.
- `npm run db:sync`, `npm run data:export`, `npm run check` (0 errors).

## Acceptance criteria

- [x] 5 new products live in Turso and `src/lib/data/whiskies.json` with `distillery_id` resolved and videos embedded.
- [x] 5 new distilleries complete incl. coordinates and 5-language descriptions; `finland` and `denmark` origins resolve.
- [x] Videos in as many languages as exist, all exact-expression and in-language; honest zeros elsewhere.
- [x] Queue lines 368, 372, 376, 380, 381 ticked ✅; `npm run check` passes (0 errors).
- [x] No commit/push unless explicitly ordered.

## Progress

- 2026-09-16: Created task. De-dup clean (442/204, no collisions).
- 2026-09-16: Research (5 agents):
  - **High Coast Hav** (ex-Box renamed 2018; Origins series flagship): 48%/70cl/NAS, peated (~23% peated malt ≈11ppm); 66.85% accelerated in 40L Hungarian+Swedish oak then >6 yrs ex-bourbon, 30.84% straight ex-bourbon, 2.67% Hungarian-oak finish; NCF natural colour. Distillery founded 2007 (co. Ådalen Destilleri), distilling 2010 at former Box power station, Bjärtrå/Kramfors, Ångermanland (63.0015, 17.7985); Nasdaq First North listed 2022; not renamed-again-trademark risk (Box→High Coast due Compass Box dispute).
  - **Kyrö Malt Rye**: 47.2%/700ml/NAS 100% malted Finnish wholegrain rye, double pot distilled, new American white oak + ex-bourbon, NCF; launched 2019/2020 core. Distillery founded 2012 (commercial Apr 2014), 1908 cheese dairy, Isokyrö, S. Ostrobothnia (62.98435, 22.35343). NOT "Earliest"-tagged (that claim false).
  - **Stauning Rye** (official R.Y.E. Whisky): 48%/700ml/NAS, 60% floor-malted Danish rye + 40% floor-malted Danish barley, heavily-charred virgin American oak; first official product (rye 2011). Distillery founded 2005 (Denmark's oldest), Stauning/Skjern, West Jutland (55.9528, 8.4033); Diageo DV majority 2025 after Distill Ventures wind-down; Redzepi/Refslund were NOT investors.
  - **Cotswolds Single Malt** (Signature): 46%/700ml/NAS ~3yo, 70% STR red-wine barriques (J.Dias) + 30% first-fill ex-bourbon (Basil Hayden); unpeated floor-malted local barley. The 2023 "sherry-led relaunch / foundation spirit / master distiller David Smith" claim = FALSE (David Smith is CEO of Fielden; Signature unchanged). Distillery 2014, Stourton, Shipston-on-Stour, Warwickshire (52.02581, -1.56598); largest English malt producer; Berry Bros. & Rudd stake 2023. First release Oct 2017.
  - **Bimber Re-Charred Oak**: 51.9%/70cl/NAS (~3yo), 100% hand re-charred ex-bourbon American white oak to Level 4 Alligator Char; batch 1 = Bimber's 2nd release (2019). "Bimber The Original" does NOT exist (never peated core). Distillery 2015 Park Royal, London NW10 (51.52581, -0.26518); new Speyside site Dunphail 2023; founder's real identity Łukasz Ratajewski (used pseudo Dariusz Plazewski ~20yrs, arrested Feb 2024).
- 2026-09-16: Origins `finland` (Suomi–Finlandia/Finlândia/フィンランド/Finlande 🇫🇮) + `denmark` (Dinamarca/Dinamarca/デンマーク/Danemark 🇩🇰) → ORIGIN_META; regions `Finland`, `Denmark`, `Cotswolds` auto-created (Sweden + London reused).
- 2026-09-16: Images all pass pixel heuristics. kyro-malt-rye was a white-background og:image (86.8% whiteOfOpaque, opaque corners) → white-bg-to-alpha pass + trim/fit-zoom rebuild (final 26.1% opaque, 0.38×0.93, transparent corners). Others: high-coast (label-forward cutout 73.1%), stauning (clean cutout 24%), cotswolds (label-forward 76.7%), bimber (cutout 57.6%).
- 2026-09-16: Videos 22, all oEmbed re-verified live: Hav en 4 (Whiskey Novice, Alcohol Content, Whiskey Pop, Whisky Scout; rejected 1:14 TikTok snippet + distillery promo; "Hav Oak Spice" label variant excluded); Kyrö en 4 (Whisky.com, Whiskey Vault, Moa Nilsson, pooheadjohnson) + ja 1 (ひとくちウイスキー; rejected distillery feature fr "Les Grands Alambics" as non-review); Stauning en 4 (Whisky Shared, Whisky.com Batch 2, Whisky For Everyone, Whisky Whims; zeros ja/fr/es/pt); Cotswolds en 4 + ja 1 (ひとくちウイスキー; rejected 3-hour 甘粕おさけ livestream, LMDW promo, auto-translated es) ; Bimber en 4 (Whisky Shared, WhiskyJason, New Dram Drinker, Damned By The Dram; rejected Polish exact review per slot rules + English channels' auto-localized titles).
- 2026-09-16: Seeded (text splice; 447 whiskies/209 distilleries), db:sync (209/447/4374 videos/49 regions/17 origins), data:export, check green (0 errors/29 warnings). Queue 368/372/376/380/381 ticked, pending 17→12. Docs updated.