# Add 5 Canadian whiskies: Canada rush 2 (Lot 40, J.P. Wiser's 18, Alberta Premium Dark Horse, Forty Creek Barrel Select, Glenora Canadian Single Malt)

Status: [DONE]

## Context

Next batch top-down (Canada section continues after 086):

1. Lot 40 Rye - Lot 40
2. J.P. Wiser's 18 YO - J.P. Wiser's
3. Alberta Premium Dark Horse - Alberta Distillers
4. Forty Creek Barrel Select - Forty Creek
5. Glenora Canadian Single Malt - Glenora

Origin `canada` + region `canadian-whisky` already exist (Legacy, 086). No new origins/regions expected. Who owns the producing site decides the distillery record:

- **Lot 40 + J.P. Wiser's**: both distilled at the Hiram Walker & Sons plant, Windsor, ON — the same producing site as the `canadian-club` record (brand owners Corby / Pernod Ricard). Research decides whether each anchors to a NEW producing-site record or reuses the existing one.
- **Alberta Premium Dark Horse**: Alberta Distillers Ltd, Calgary (Beam Suntory).
- **Forty Creek Barrel Select**: Forty Creek Distillery (Kittling Ridge), Grimsby, ON (Campari).
- **Glenora Canadian Single Malt**: Glenora Distillery, Glenville, Cape Breton, NS (independent; Glen Breton).

Queue lines to tick: 336, 337, 338, 339, 340. Pending after batch: 32 → 27.

## Requirements

- 5 new products seeded with 5-language content (es/pt/en/ja/fr).
- New distillery records as research dictates (producing-site anchor rule); coordinates + founded year + 5-language descriptions.
- Official/clean transparent bottle images for all 5 via `prepare-image.mjs` + pixel pass.
- Influencer videos per language (es/en/pt/ja/fr), exact-expression only, never pad.
- `npm run db:sync`, `npm run data:export`, `npm run check` (0 errors).

## Acceptance criteria

- [x] 5 new products live in Turso and `src/lib/data/whiskies.json` with `distillery_id` resolved and videos embedded.
- [x] Any new distilleries have complete records incl. coordinates and 5-language descriptions; anchors documented in Progress.
- [x] At least 2 videos per language per product where findable, all exact-expression and in-language.
- [x] Queue lines 336, 337, 338, 339, 340 ticked ✅; `npm run check` passes (0 errors).
- [x] No commit/push unless explicitly ordered.

## Progress

- 2026-09-14: Created task. De-dup + anchor check pending (research).
- 2026-09-14: Research done (5 agents, de-dup clean). **Anchors settled:** Lot 40 + J.P. Wiser's both distill at the Hiram Walker & Sons plant → reuse the existing `canadian-club` distillery record (no new site records; avoids duplicating the same producing site). New distillery records: `alberta-distillers` (Alberta Distillers Ltd, Calgary, founded 1946, coords 51.023028/-114.027114, Suntory Global Spirits), `forty-creek` (Forty Creek Distillery, Grimsby, founded 1992, 43.20250/-79.58306, Campari), `glenora` (Glenora Distillery, Cape Breton NS, founded 1990, 46.1528/-61.3235).
- 2026-09-14: Product naming — Glenora's real product is **Glen Breton Rare 10 Year Old** (first North American single malt, first release 2000); J.P. Wiser's 18 keeps the Whisky Advocate 2013 "Canadian Whisky of the Year" only (NOT earlier years).
- 2026-09-14: Images prepared via `prepare-image.mjs` + trim pass; all 5 transparent-corner cutouts (lot-40 21.1→ok; wisers 23.3; alberta 10.2; forty-creek 30.1; glenora 20.2 KB).
- 2026-09-14: Videos: **22 total, all re-verified live via `yt-verify`**. Lot 40: 4 en + 1 es (`YRmqjIe_owU` `yr6sA8uPGrI` `f8433a21SUA` `wU89mOBhK0k` / `3cl48LaWH7Q`). Wiser's 18: 4 en (`SYgD9sZj5Eo` `5cRzWBidvwY` `UpOXW8d-eAE` `6PtjHGJMXe8`); ja radio pick on "Wiser's Oldest 18" dropped as ambiguous-exactness + audio-only. Alberta Dark Horse: 4 en (`2gyGCUMjeho` `qoVubEFQbt0` `BVPc30H_CkI` `cyojkPOikkE`). Forty Creek: 4 en + 1 es (`gAUiLhGfsB4` `YhNOTgQljLk` `MJ0F0ooC8Bk` `mhb8cIaafFw` `/ YF_Og-6EAUg`). Glen Breton 10: 4 en (`5RVrTMLEchU` `DXvpMHTPqmI` `s9cTD2qq1vs` `RfVC3yW_Re8`). Honest zeros: ja/es/pt/fr where nothing exact exists.
- 2026-09-14: Seed text-splice OK (5 products + 3 distilleries byte-identical after json round-trip check). `db:sync` → **196 distilleries / 432 products / 4322 videos / 42 regions**. `data:export` OK (videos under `videos` key). `npm run check` → 0 errors / 29 warnings. Queue pending 32 → 27.
- 2026-09-14: Docs (lessons-learned / LEARNINGS) prepended. Awaiting commit/push order.
- 2026-09-14: Follow-up deep-search pass (user request "make a better search") for ALL missing es/pt/fr/ja slots — 3 language-focused subagents, multi-angle katakana/romaji queries via yt-search + yt-invidious + oEmbed verification of every borderline candidate. Result: **all confirmed honest zeros**. Only 1 new candidate surfaced (ja: `KKce8yR-dJM` ハイラボ "フォーティークリーク" Donki first-taste) but its title never names バレルセレクト (expression unconfirmed) and the channel is highball-first → rejected for exact-expression strictness, consistent with the first-pass rejection. Coverage stays: en 4× all, es 2× (Lot 40, Forty Creek); ja/pt/fr 0×. No seed change; no re-export needed.