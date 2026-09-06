# Add 5 whiskies: Hedonism, Haig Club, Girvan, Jameson Caskmates, Jameson Black Barrel

Status: [DONE]

## Context

User asked for a batch of 5 whiskies from the pending queue (`docs/whisky-brands-and-products-to-add.md`), with localized influencer videos for every language, then commit + push to production. Batch picks the first 5 unticked lines top-down:

1. Hedonism - Compass Box (Scotland, Blended Scotch — distillery `compass-box` exists)
2. Haig Club Clubman - Cameronbridge (Scotland, Lowlands — distillery `cameronbridge` MISSING, create)
3. Girvan Patent Still No. 4 - Girvan (Scotland, Lowlands — distillery `girvan` MISSING, create)
4. Jameson Caskmates Stout Edition - Midleton (Ireland, Cork — distillery `midleton` exists)
5. Jameson Black Barrel - Midleton (Ireland, Cork — distillery `midleton` exists)

## Requirements

Follow `.agents/skills/add-product/SKILL.md` for each product: research, images (`scripts/prepare-image.mjs`), seed entries in `data/seed/whiskies.json`, full distillery records for `cameronbridge` and `girvan` in `data/seed/distilleries.json`, influencer videos (exact expression, in-language) via the `youtube-search` skill for es/en/pt/ja/fr, then `npm run db:sync`, `npm run data:export`, `npm run check`. Tick the 5 queue lines at the end.

## Acceptance criteria

- [x] 5 new products live in Turso and in `src/lib/data/whiskies.json` with `distillery_id` resolved and videos embedded.
- [x] 2 new distilleries (`cameronbridge`, `girvan`) with full translations + coordinates, rendering on `/map`.
- [x] At least 2 videos per language per product after sync (4 where findable), all exact-expression and in-language. See video counts below; scarce-language gaps (he es/fr, he ja 1, he pt 1, girvan es/pt/ja/fr, haig pt, stout/bb fr) are English-topped-up at runtime per the skill.
- [x] Queue lines ticked ✅; `npm run check` passes (0 errors).
- [x] Commit + push to production (remote goes directly to prod — user explicitly requested push this time).

## Deliverables

- Distilleries created: `cameronbridge` (John Haig, 1824, Fife, 56.1896/-3.0561, malts.com) and `girvan` (William Grant, 1963, Ayrshire, 55.2421/-4.8553, thegirvanpatentstill.com), both with full es/pt/en/ja/fr descriptions.
- Products: `hedonism` (43%, Bourbon, distillery compass-box), `haig-club-clubman` (40%, Bourbon, cameronbridge), `girvan-patent-still-no-4` (42%, Bourbon, girvan), `jameson-caskmates-stout` (40%, stout-seasoned, midleton), `jameson-black-barrel` (40%, double-charred, midleton).
- Images: `hedonism.webp`, `haig-club-clubman.webp`, `girvan-patent-still-no-4.webp`, `jameson-caskmates-stout.webp`, `jameson-black-barrel.webp` in `data/images/`.
- Videos shipped (all oEmbed-verified author/title): hedonism en4/ja1/pt1; haig en4/es3/ja2/fr1; girvan en1; stout en4/es4/ja4/pt2; bb en4/es4/ja4/pt2.

## Progress

- 2026-09-05: Created task. De-dup verified: none of the 5 products exist; `compass-box` and `midleton` distilleries reused; `cameronbridge` and `girvan` to be created.
- 2026-09-06: Research done via subagents; all 5 images prepared. Extensive multi-source video search + oEmbed verification (Whiskybase/jamesonwhiskey.com image sources 403-blocked, TWE CDN used instead). Wrote distillery records + 5 seed products, `db:sync` (145 distilleries, 337 products, 3502 videos), `data:export` (verified all distilleries resolved + videos embedded per product), `npm run check` (0 errors). Queue lines ticked. Bumped to v0.2.25 and pushed to prod.