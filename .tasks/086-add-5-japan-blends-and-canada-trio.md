# Add 5 whiskies: Japan blend pair + Canada trio (Hatozaki, Togouchi, Crown Royal x2, Canadian Club 12)

Status: [DONE]

## Context

Next batch top-down from the queue. Two leftovers from Japan, then Canada begins:

1. Hatozaki Finest Blended - Hatozaki (Japan)
2. Togouchi Blended Whisky - Togouchi (Japan)
3. Crown Royal Deluxe - Crown Royal (Canada)
4. Crown Royal Northern Harvest Rye - Crown Royal (Canada)
5. Canadian Club 12 YO - Canadian Club (Canada)

New distilleries expected: hatozaki, togouchi, crown-royal, canadian-club. All 5 products + 4 distilleries need de-dup-verified full records. Origin `canada` + region `canadian-whisky` (`canada-canadian-whisky`) ALREADY exist (Legacy). Japan stays Honshu.

## Requirements

- 5 new products + 4 new distilleries seeded with 5-language content and coordinates.
- Anchoring per house rule: blends without a single producing site → brand record at owner HQ; single-site products → producing distillery. Confirm during research (Crown Royal = brand record; Crown Royal Northern Harvest Rye 2016 World's Best; Canadian Club 12 → brand record at Hiram Walker).
- Official/clean transparent bottle images for all 5 via `prepare-image.mjs`.
- Influencer videos per language (es/en/pt/ja/fr), exact-expression only, never pad. Hatozaki/Togouchi ja via real names (シングルモルト東志/ハトザキ?) — label names needed.
- `npm run db:sync`, `npm run data:export`, `npm run check`.

## Acceptance criteria

- [x] 5 new products live in Turso and `src/lib/data/whiskies.json` with `distillery_id` resolved and videos embedded.
- [x] 4 new distilleries with complete records incl. coordinates and 5-language descriptions.
- [x] At least 2 videos per language per product where findable, all exact-expression and in-language.
- [x] Queue lines 328, 329, 333, 334, 335 ticked ✅; `npm run check` passes (0 errors).
- [x] No commit/push unless explicitly ordered.

## Progress

- 2026-09-13: Created task. De-dup verified — none of the products or distilleries exist. Origin canada + region canadian-whisky already present (Legacy Canadian Whisky).
- 2026-09-14: Research complete (5 agents; Togouchi re-dispatched after one cancellation). Coordinates web-verified: Kaikyo 34.644777/135.012116, Sakurao 34.355226/132.340050 (whisky.com), Gimli 50.655152/-97.002782 (whisky.com), Hiram Walker 42.327/-83.008.
- 2026-09-14: Anchor decisions — both Canadian brands recorded at their single producing site (Gimli for crown-royal, founded 1968; Hiram Walker for canadian-club, founded 1858), bypassing owner HQ per producing-site rule. Sakurao record founded 2017 (distillery; company Chugoku Jozo founded 1918-10-08, renamed Sakurao 2021).
- 2026-09-14: Images: 5 webps prepared. hatozaki = opaque white-box; togouchi, crown-royal-deluxe, canadian-club-12 = transparent cutouts (corner alpha 0). NHR Rye Contentful PNG 404'd → replaced with ReserveBar CDN jpg (opaque white-box). Pixel pass clean.
- 2026-09-14: Videos: 45/45 verified live via yt-verify (Hatozaki 7, Togouchi 10, CR Deluxe 12, NHR 8, CC12 8). Honest ja pick for Hatozaki is Basuke Suzuki (generic 波門崎ウイスキー; only ja sole-subject). Rejected: Togouchi agent's `mdLssT4iWYM` (typo; correct `mOLssT4iWYM`), CC12 comparison-style `Og0_-61ODfo`.
- 2026-09-14: Seeded 4 distilleries (hatozaki/sakurao/crown-royal/canadian-club) + 5 products; splice-inserted into seed JSONs (avoided full-reformat due to pre-existing dup-key in seed). db:sync → 193 distilleries / 427 products / 4300 videos / 42 regions. data:export OK (videos under `videos` key). `npm run check` → 0 errors, 29 warnings (baseline).
- 2026-09-14: Queue 328/329/333/334/335 ticked ✅. Pending 37 → 32.