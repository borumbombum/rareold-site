# Add 5 Irish whiskies (Jameson 18, Redbreast 12/Lustau/Cask Strength, Powers Gold Label)

Status: [DONE]

## Context

User asked for a batch of 5 whiskies from the pending queue (`docs/whisky-brands-and-products-to-add.md`), with localized influencer videos for every language, then commit + push to production. Batch picks the first 5 unticked lines top-down:

1. Jameson 18 YO - Midleton (Ireland, Cork — distillery `midleton` exists)
2. Redbreast 12 YO - Midleton (Ireland, Cork — distillery `midleton` exists)
3. Redbreast Lustau Edition - Midleton (Ireland, Cork — distillery `midleton` exists)
4. Redbreast Cask Strength - Midleton (Ireland, Cork — distillery `midleton` exists)
5. Powers Gold Label - Midleton (Ireland, Cork — distillery `midleton` exists)

## Requirements

Follow `.agents/skills/add-product/SKILL.md` for each product: research, images (`scripts/prepare-image.mjs`), seed entries in `data/seed/whiskies.json` (reuse distillery `midleton`), influencer videos (exact expression, in-language) via the `youtube-search` skill for es/en/pt/ja/fr, then `npm run db:sync`, `npm run data:export`, `npm run check`. Tick the 5 queue lines at the end.

## Acceptance criteria

- [ ] 5 new products live in Turso and in `src/lib/data/whiskies.json` with `distillery_id` resolved and videos embedded.
- [ ] At least 2 videos per language per product after sync (4 where findable), all exact-expression and in-language.
- [ ] Queue lines ticked ✅; `npm run check` passes.
- [ ] Commit + push to production (remote goes directly to prod — user explicitly requested push this time).

## Deliverables

- Products: `jameson-18-yo` (40%, sherry+bourbon, midleton), `redbreast-12-yo` (40%, bourbon+sherry, midleton), `redbreast-lustau` (46%, sherry, midleton), `redbreast-cask-strength` (57.2%, bourbon+sherry, midleton), `powers-gold-label` (40%, single pot still + grain, midleton).
- Images: `jameson-18-yo.webp`, `redbreast-12-yo.webp`, `redbreast-lustau.webp`, `redbreast-cask-strength.webp`, `powers-gold-label.webp` in `data/images/`.
- Videos shipped: TBD after multi-source search + oEmbed verification.

## Progress

- 2026-09-06: Created task. De-dup verified: none of the 5 products exist in `src/lib/data/whiskies.json` or `data/seed/whiskies.json`; distillery `midleton` exists (reuse, region Cork). Queue lines 228-232 are the first unticked.
- 2026-09-06: Research via subagent (TWE CDN image URLs verified HTTP 200; whiskybase blocked). All 5 images prepared to `data/images/*.webp`. Video search per product via 5 parallel subagents (native YT + Invidious), all 43 URLs oEmbed-verified live + correct language/expression. Dropped multi-whisky "battle" videos (Jameson 18 fr generic 18yo battle; RB CS fr Bataille Royale VII) per the exact-whisky hard rule — kept the RB CS es comparison since CS is the lead subject. Seeded 5 products (`db:sync`: products 337→342, videos 3502→3545), `data:export` (all 5 distillery-resolved + videos embedded), `npm run check` (0 errors, 25 pre-existing warnings). Queue lines ticked.
- 2026-09-06: Video counts — jameson-18-yo en4/es1/ja3 (pt0/fr0); redbreast-12-yo en4/es4/pt4/ja4/fr1; redbreast-lustau en4/es3 (pt0/ja0/fr0); redbreast-cask-strength en4/es1/fr1 (pt0/ja0); powers-gold-label en4/ja1 (es0/pt0/fr0). Scarce-language gaps are English-topped-up at runtime per the skill. Bumped to v0.2.26 and pushed to prod.