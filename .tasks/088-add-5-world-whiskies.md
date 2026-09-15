# Add 5 whiskies: queue sweep across Canada/China/Australia (Shelter Point, Macaloney's Island, The Chuan, Sullivans Cove x2)

Status: [DONE]

## Context

Batch from the top of the queue (lines 341, 342, 354, 358, 359):

1. Shelter Point Single Malt - Shelter Point (Canada, BC)
2. Macaloney's Island Single Malt - Macaloney's (Canada, BC)
3. The Chuan Pure Malt - The Chuan (China — NOT Taiwan; CORRECTION in research: 叠川 Diechuan is Pernod Ricard's Emeishan distillery, Sichuan)
4. Sullivans Cove French Oak - Sullivans Cove (Australia, Tasmania)
5. Sullivans Cove American Oak - Sullivans Cove (Australia, Tasmania)

Research added origins `china` + `australia` metadata to `ORIGIN_META` (countries/emoji), and regions `China` + `Tasmania` (auto-created from product region strings at db time). BC whiskies reuse existing region `Canadian Whisky` (Glenora precedent).

Anchor rule: single producing site wins; brand/owner-HQ records only for multi-site blends.

Sullivans Cove x2 → SAME distillery record (one site, two expressions).

Queue lines to tick: 341, 342, 354, 358, 359. Pending after batch: 27 → 22.

## Requirements

- 5 new products seeded with 5-language content (es/pt/en/ja/fr).
- New distillery records as research dictates (producing-site anchor rule); coordinates + founded year + 5-language descriptions.
- Official/clean transparent bottle images for all 5 via `prepare-image.mjs` + pixel pass.
- Influencer videos per language (es/en/pt/ja/fr), exact-expression only, never pad.
- `npm run db:sync`, `npm run data:export`, `npm run check` (0 errors).

## Acceptance criteria

- [x] 5 new products live in Turso and `src/lib/data/whiskies.json` with `distillery_id` resolved and videos embedded (12 en videos total; verified in export).
- [x] New distilleries have complete records incl. coordinates and 5-language descriptions; anchors documented in Progress.
- [x] Videos in as many languages as exist, all exact-expression and in-language; honest zeros elsewhere.
- [x] Queue lines 341, 342, 354, 358, 359 ticked ✅; `npm run check` passes (0 errors, 29 baseline warnings).
- [x] No commit/push unless explicitly ordered.

## Progress

- 2026-09-15: Closed. Research: 4 agents (Shelter Point, Macaloney's, The Chuan, Sullivans Cove). **Key corrections/facts:** The Chuan (叠川) = Pernod Ricard China, Emeishan Sichuan, master distiller Yang Tao, triple oak (ex-bourbon/sherry/Chinese Cathay oak), launched Dec 2023, NOT Taiwan — new origin `china` + region `China`. Sullivans Cove = ONE distillery record (Cambridge, TAS, founded 1994, Maguire + Bill Lark, Ross Billings master) hosting both expressions; new origin `australia` + region `Tasmania`. Shelter Point = "Classic Single Malt" (renamed from Artisanal 2022), 46/750, WWA 2018 Best Canadian Single Malt. Macaloney's "An Loy" (renamed from Glenloy 2022), 46/700, WWA 2022 Best in Canada gold.
- 2026-09-15: Images prepared + pixel pass OK for all 5: shelter-point-single-malt (transparent cutout, 0.71 opaque), macaloneys-island-single-malt (cutout, 0.31 opaque), the-chuan-pure-malt (white-box 0.66 white — only obtainable; sources hunted: liquidgold/winepeers/simplyalcohol/whiskykeyhk/masterofmalt/chelsea-intl/dutyfreehunter/kgroupwine/mizunarathe/pns all failed; Moodie Davitt photos are news shots — used kgroupwine Shopify retail shot per white-box precedent), sullivans-cove-french-oak + sullivans-cove-american-oak (transparent cutouts, 1240x1900 studio shots off official Shopify store).
- 2026-09-15: Videos researched (3 of 5 subagents cancelled mid-flight → re-run 2; The Chuan re-run cancelled twice → searched directly in-session). Final: Shelter Point en 4 (7QQkgSNGtdw, 4UJ89BuuiAg, gCm7KBE1VkM, kOsz4Za9AP8), Macaloney's en 3 (FLVy_9m8BMk, t94c4_1PO2M, gc1TBGQcPU0; dropped hfNgdK8LnB8 — Italian-channel narration unverified; dropped ja/audio), The Chuan 0 honest (only zh-language tasting CC Wine Voyage, architecture/news; Tierri pt candidate not named → rejected), Sullivans Cove FO en 1 (_jGi-BgsK9A Malt Activist single cask HH537; HH = French Oak cask line; rejected wufzYl8KjPI comparison-framed), Sullivans Cove AO en 4 (Deul71b1mmA, ipmEuVYBEFE, yggGlNDWZqs, eXH6KCWHxVw; dropped ja BAR岩田 radio per audio rule). 12 en total.
- 2026-09-15: Seeded (text splice; top key `whiskies`; 437 whiskies/200 distilleries), db:sync (200 distilleries/437 products/4334 videos/44 regions), data:export, check green. Queue 341/342/354/358/359 ticked, pending 27→22. Docs updated.