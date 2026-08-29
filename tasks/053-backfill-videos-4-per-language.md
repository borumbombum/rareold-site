Status: [IN_PROGRESS]

# Backfill influencer videos to 4 per language

## Context

The `add-product` skill (updated 2026-08-22) now targets **4 videos per language** (hard floor of 2, English tops up at runtime) for every new product. The existing catalog predates that rule: only 12 of ~176 products have any videos at all, none meet 4×5, and at least one product (whistlepig-10-yo) lists the same English URL under pt — a dead slot since the runtime dedups by URL.

## Requirements

1. Work product by product through the catalog (`data/seed/whiskies.json`), following the updated add-product skill Step 5 rules:
   - Target 4 videos per language × es/en/pt/ja/fr; hard floor of 2 when honest searching comes up dry
   - Fallback order: exact expression → same distillery → same style/region category tasting
   - Verify every URL via YouTube oEmbed before seeding; fill `label` from title/channel
   - Never duplicate a URL within a product (fix existing dupes, e.g. whistlepig-10-yo)
2. Seed edits go into `data/seed/whiskies.json` `influencer_videos` arrays, then `INSERT OR IGNORE` into Turso via targeted script or `npm run db:sync`, then `npm run data:export`.
3. Batch sensibly (e.g. 5 products per session) and log progress below so the work can resume across sessions.

## Acceptance criteria

- [ ] Every catalog product has ≥2 videos in each of es/en/pt/ja/fr (4 where findable), all verified via oEmbed
- [ ] No duplicate URLs within any product
- [ ] Turso and `src/lib/data/whiskies.json` agree after export
- [ ] `npm run check` passes

## Progress

- 2026-08-22 (ox-alpha-v050): Task created after updating the add-product skill to the 4-per-language / floor-2 rule. Not started.
- 2026-08-28 (big-pickle): Batch 1 — oldest 5 products (1770 ×4, Akashi Blue). 47 URLs oEmbed-verified. Glasgow pt/fr genuinely dry (ASR-confirmed). db:sync 825→873, check 0 errors. Details in commit a0241d9.
- 2026-08-29 (big-pickle): Wave 1 (8 research agents) for the next 57 products across 8 distillery clusters (White Oak/Akashi ×6, Jura ×8, Kavalan ×8, Heaven Hill ×9, Tomatin/Cu Bòcan ×7, Waterford ×7, Kilchoman ×6, Old Pulteney ×6). 731 videos written to `data/seed/whiskies.json`, then:
  - All 380 unique URLs re-verified by me via oEmbed (all 200). Dropped 1 mislabeled es (Whisky Masters Japanese channel) from Akashi.
  - Purged 3 stale Turso rows whose URLs were replaced (db-sync is INSERT OR IGNORE only → orphans survive otherwise).
  - db:sync 870→1600 rows, data:export 1600, `npm run check` 0 errors / 25 baseline warnings.
  - Coverage qc: every product ≥1 per non-dry language; Jura/Waterford/Old Pulteney/Kilchoman/Heaven Hill fully populated. All "dry" slots match agent declarations.
  - **Known agent gap:** Kavalan (all 8 products marked es/pt/ja/fr dry — false; Japanese/Spanish/PT content clearly exists, e.g. ソリスト/コンサートマスター), Tomatin Cask Strength/14/Legacy, Cu Bòcan ×3, Kilchoman Sauternes (FR content exists). Top-up agents queued.
- 2026-08-29 (big-pickle): Wave 2a — re-researched lost deliverables (Talisker ×3, Glenturret ×3, Tomatin ×4) plus top-ups for 30 more products (Ardbeg ×4, Laphroaig ×3, Kavalan ×8, Tomatin legacy/Cu Bòcan, Kilchoman Sauternes/px/Machir/Loch Gorm, Bunnahabhain 18, Ardnahoe, WhistlePig, Whisky New Forms). 9 research agents → 200 unique candidate IDs, all 200 oEmbed-verified (HTTP 200), 197 injected into `data/seed/whiskies.json`:
  - 3 curated out after oEmbed: glenturret-12 ja (John's Drams = EN channel mislabeled ja), ardnahoe-inaugural-release es (Caol Ila review) + pt (Bunnahabhain review) — wrong distillery/brand.
  - Fixed pre-existing stale intra-product dups (seed + Turso): laphroaig-lore fr duplicated the en URL, whistlepig-10-yo pt duplicated the en URL → 2 Turso rows DELETEd, both refilled with proper finds.
  - db:sync 1600→1795 rows, data:export 1795, `npm run check` 0 errors / 25 baseline warnings. Seed↔export verified identical for all 37 touched products.
  - Coverage: talisker-10 back to 4×4×4×4×4. Documented genuine dry spots (agent + oEmbed confirmed): talisker-18/-DE es+fr; glenturret ×3 fr (12 ja also empty after dropping the EN-channel row); tomatin fr, cask-strength ja, 14 pt; cu-bocan es/pt/ja/fr; kavalan solist-vinho fr; whisky-new-forms es/pt/fr; whistlepig-10-yo pt (only rye-category fallback exists).
- Next: Wave 2b — remaining ~28 distillery clusters / ~105 products with 0 videos (Highland Park, Aberlour, Glenfiddich-12 gaps, Speyside batch, Indian trio, etc.). Same flow: dispatch agents → collect → oEmbed-verify → inject seed → purge stale Turso rows → db:sync → data:export → check.
