Status: TODO

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
