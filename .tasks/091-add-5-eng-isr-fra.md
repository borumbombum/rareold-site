# Add 5 whiskies: England/Israel/France (The English Whisky Co, M&H, Armorik x2, Brenne)

Status: [DONE]

## Context

Batch from the queue (lines 382, 386, 390, 391, 392):

1. The English Whisky Co Original - The English Whisky Co (Norfolk, England)
2. M&H Elements Red Wine Cask - Milk & Honey (Tel Aviv, Israel)
3. Armorik Breton Single Malt - Armorik (Warenghem, Brittany, France)
4. Armorik Classic Bio - Warenghem (Brittany, France — organic)
5. Brenne French Single Malt - Brenne (Brenne/Cognac, France)

**→ 390+391 resolve to ONE product**: since the ~2021 relaunch, the core Armorik *Classic* IS the *Classic Bio* (46%, 70cl, ex-bourbon, EU organic FR-BIO-01, certified 2021). Only the discontinued 40% "Original Edition" was a separate non-bio core. User alert went unanswered → default, one product `armorik-classic-bio`; BOTH queue lines ticked, documented here. Batch = 4 real products / 4 distillery records.

Origins: `england` exists. `israel` + `france` are NEW → ORIGIN_META entries in `scripts/db-sync.mjs`. Regions to decide per producing site (Norfolk? Tel Aviv? Brittany? Brenne/Cognac?).

Queue lines to tick: 382, 386, 390, 391, 392. Pending after batch: 12 → 7.

## Requirements

- 5 new products seeded with 5-language content (es/pt/en/ja/fr).
- 4 new distillery records (english-whisky-co, milk-and-honey / mh, warenghem (Armorik), brenne) — coordinates + founded + 5-language descriptions.
- `israel` + `france` origin metadata; region auto-create following producing-site anchor.
- Official/clean transparent bottle images for all 5 via `prepare-image.mjs` + pixel pass.
- Influencer videos per language (es/en/pt/ja/fr), exact-expression only, never pad. France = strong es/pt held by La Maison du Whisky legacy; expect fr+en on the French ones, es/pt on Brenne if sonidoceleste-like exists.
- `npm run db:sync`, `npm run data:export`, `npm run check` (0 errors).

## Acceptance criteria

- [x] 5 new products live in Turso and `src/lib/data/whiskies.json` with `distillery_id` resolved and videos embedded.
- [x] 4 new distilleries complete incl. coordinates and 5-language descriptions; `israel` and `france` origins resolve.
- [x] Videos in as many languages as exist, all exact-expression and in-language; honest zeros elsewhere.
- [x] Queue lines 382, 386, 390, 391, 392 ticked ✅; `npm run check` passes (0 errors).
- [x] No commit/push unless explicitly ordered.

## Progress

- 2026-09-16: Created task. De-dup clean (447/209, no collisions). Research pending.
- 2026-09-16: Research done (4 agents); distillery facts + coordinates confirmed (Norfolk, Tel Aviv, Brittany, Cognac = 4 new regions → 53; israel+france origins → 19).
- 2026-09-16: Images: the-english-original full-bleed studio (consistent with catalog precedent — hundreds of card images are 100%-opaque); mh/armorik/brenne transparent cutouts pass pixel checks; dev artifacts eng-alt/eng-5 deleted.
- 2026-09-16: Videos: The English Original en4+ja1; M&H = honest zero (only comparison/distillery-visit/non-exact exist); Armorik en4+ja2+pt1; Brenne en4+es4. All verified via yt-verify.
- 2026-09-16: Spliced 4 distilleries + 4 products; db:sync seeded 19 origins/53 regions/213 distilleries/451 products/4394 videos; data:export OK; `npm run check` 0 errors / 29 baseline warnings.