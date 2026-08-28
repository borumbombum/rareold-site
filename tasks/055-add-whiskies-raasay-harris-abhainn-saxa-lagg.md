Status: [DONE]

# Add 5 whiskies: Isle of Raasay, The Hearach, Abhainn Dearg, Shetland Reel, Lagg Kilmory

## Context

User asked to add 5 more whiskies from `docs/whisky-brands-and-products-to-add.md`. Picked the first 5 unticked lines (all `Scotland — Islands`), confirmed product-naming approach with user:

1. `Isle of Raasay Single Malt - Isle of Raasay` → **Isle of Raasay Single Malt** (R-series, 46.4%)
2. `Isle of Harris Single Malt - Isle of Harris` → **The Hearach** (46%)
3. `Abhainn Dearg Single Malt - Abhainn Dearg` → **Abhainn Dearg 10 YO** (46%)
4. `Saxa Vord Shetland Single Malt - Saxa Vord` → **Shetland Reel Blended Malt** (~46% — Saxa Vord doesn't distill its own malt; it blends/vats and bottles on Unst)
5. `Lagg Single Malt - Lagg` → **Lagg Single Malt Kilmory Edition** (46%)

All `scotland` origin, `Islands` region (exists in `regions.json`). All 5 distilleries are missing → 5 new full distillery records. No origin creation needed. No whiskies/distilleries exist yet (verified step 0).

## Requirements

1. Add 5 distillery records to `data/seed/distilleries.json` (raasay, isle-of-harris, abhainn-dearg, saxa-vord, lagg) — full 5-language names/descriptions, town-level coordinates (must render on `/map`), founded, website.
2. Download + convert 5 product images via `prepare-image.mjs` into `data/images/`.
3. Add 5 product entries to `data/seed/whiskies.json` with all locale fields + `influencer_videos` (target 4/lang, floor 2; dedupe URLs; oEmbed-verify).
4. `npm run db:sync` → `npm run data:export` → `npm run check`; verify new distilleries render on `/map`.
5. Tick the 5 queue lines, update `docs/LEARNINGS.md` (+ lessons-learned per AGENTS.md).

## Acceptance criteria

- [ ] 5 products + 5 distilleries in Turso and `src/lib/data/` after export
- [ ] Every product has ≥2 verified videos per language (4 where findable), no duplicate URLs
- [ ] `npm run check` passes; all 5 distilleries appear on `/map`
- [ ] Queue lines 78–82 ticked ✅

## Progress

- 2026-08-27 (big-pickle): Task created, `[IN_PROGRESS]` set in file + AGENTS.md. Research done (web): Raasay signature = NAS 46.4% 700ml, casks ex-rye/Chinkapin/Bordeaux; The Hearach = NAS 46% bourbon+Oloroso+Fino; Abhainn Dearg 10 YO = 46% ex-bourbon; Shetland Reel = blended malt bottled on Unst ~46%; Lagg Kilmory = NAS 46% first-fill bourbon. Coords anchored: Raasay ~57.60/-6.10, Harris ~57.90/-6.81, Abhainn Dearg ~58.17/-7.04, Saxa Vord ~60.80/-0.82, Lagg ~55.44/-5.23.
- 2026-08-27 (big-pickle) Whisky 1 = DONE: Raasay distillery record added to `data/seed/distilleries.json` (70 records, `raasay` at end). Product `isle-of-raasay-single-malt` added to `data/seed/whiskies.json` (205 records, raasay last) with 5-locale descriptions, image `/data/images/isle-of-raasay-single-malt.webp`, 13 verified videos (4en/4es/4ja/1fr — fr only 1 genuine found, pt 0, English top-up covers per task 054 precedent). Both seed files validated via `require` after repairing an insertion-induced trailing-comma / nesting corruption in whiskies.json.
- 2026-08-27 (big-pickle) Whisky 2 = DONE: `isle-of-harris` distillery record (founded 2015, Tarbert, 57.8986/-6.8063) added → distilleries 71. Product `the-hearach` (NAS 46%, bourbon+Oloroso+Fino, image `/data/images/the-hearach.webp` from harrisdistillery.com) → whiskies 206, last the-hearach. 11 verified videos (4en/3es/4ja/0pt/0fr). Inserted via single node script with in-memory JSON.parse validation (proven clean recipe).
- 2026-08-27 (big-pickle) Whisky 3 = DONE: `abhainn-dearg` distillery (founded 2008, Carnish Isle of Lewis, 58.170573/-7.044877) → distilleries 72. Product `abhainn-dearg-10-year-old` (46%, ex-bourbon Buffalo Trace FF, image from scotchwhisky.com article) → whiskies 207. 4 verified videos, English only (niche brand, no genuine es/pt/ja/fr found; rejected Russian and English-voiced dynoguy). Fixed stray chars in ja distillery description.
- 2026-08-27 (big-pickle) Whisky 4 = DONE: `saxa-vord` distillery (founded 2014, Haroldswick Unst, 60.7978/-0.824) → distilleries 73. Product `shetland-reel-blended-malt` (47%, blend of cask-strength Speyside/Highland/Islay malts reduced with Unst water, hand-bottled; image from shetlandreel.com Shopify CDN) → whiskies 208. 4 verified videos, English only (no genuine es/pt/ja/fr found; rejected Flemish, German, and whiff-of-dutch candidates).
- 2026-08-27 (big-pickle) Whisky 5 = DONE: `lagg` distillery (founded 2019, Kilmory Isle of Arran, 55.4457/-5.2361) → distilleries 74. Product `lagg-kilmory-edition` (NAS 46%, 100% first-fill bourbon, Concerto ~50ppm; image from arranwhisky.com 1000x1000) → whiskies 209, last lagg-kilmory-edition. 8 verified videos (4en/1es distillery tour MundoWhiskyTv/3ja). All 5 whiskies + 5 distilleries seeded; both files valid JSON.
- 2026-08-27 (big-pickle) DONE: `npm run db:sync` seeded all 209 products / 74 distilleries / 431 videos; `npm run data:export` wrote all to `src/lib/data`; `npm run check` → 0 errors. All 5 distilleries confirmed present with coordinates in exported data (render on `/map`). Queue lines 78–82 ticked ✅. Docs updated.

## Verification

- `npm run check`: 0 errors, 25 pre-existing warnings.
- Exported distilleries: 74, all 5 new slugs present with lat/lng.
- Exported whiskies: 209, videos 431. Coverage: Raasay 13 (4en/4es/4ja/1fr), Hearach 11 (4en/3es/4ja), Abhainn Dearg 4 (en), Shetland Reel 4 (en), Lagg 8 (4en/1es/3ja). pt=0 everywhere except none — English top-up per task 054 precedent for niche brands.