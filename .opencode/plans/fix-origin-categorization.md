# Fix origin categorization + Canada pills + Germany origin + Indian whiskies

## Context

User audit found real errors from previous sessions:
- **Madoc ×3** wrongly `origin=uruguay / region=Maldonado`. Fact-checked: Madoc is from **Dina Huapi, Patagonia, Río Negro, Argentina** (madocwhisky.com; Whisky Magazine profile of Pablo Tognetti). The distillery record already says `country=argentina`; only products are wrong.
- **Uruguay hero image** (`photo-1589909202802-8f4aadce1849`) is Buenos Aires, not Montevideo.
- **Canada** must show in the main origin pill row, not the "More origins" overflow dropdown.
- **Germany** origin must exist even though empty.
- Bonus bug: `london-distillery-company` still has `country='other'` (origin was deleted in task 041).
- India only has 3 whiskies because the 5 queued ones were never added (not misplaced). User wants them added NOW.

User decisions: keep Uruguay as empty origin (with fixed image); add all 5 Indian whiskies.

## Changes

### 1. Madoc → Argentina
- Turso: `UPDATE products SET origin_id='argentina', region_id='argentina-patagonia' WHERE id LIKE 'madoc-%'`
- Seed whiskies.json: same 3 rows updated (origin/region).
- Distillery `madoc`: set `region='Patagonia'`, `latitude=-41.0578`, `longitude=-71.3512` (Dina Huapi) in seed + Turso → also fixes map page marker.
- Verify descriptions don't claim Uruguay (spot-check says they already say Argentina ✓).

### 2. London Distillery Company country fix
- Seed distilleries.json + Turso UPDATE: `country='other'` → `'england'`.

### 3. Hero images
- Replace uruguay hero URL with a verified real Montevideo/Punta del Este Unsplash photo.
- Add germany hero (German landmark, e.g., Rhine/Neuschwanstein).
- Process: candidate URLs → HEAD-check 200/image-jpeg → confirm subject via captions before committing. Keep argentina's obelisk image.

### 4. Pin Canada in origin pills
- `origins.ts`: export `PINNED_ORIGINS: OriginKey[] = ['canada']`.
- Visible pills = pinned first, then top-by-count up to `MAX_VISIBLE_ORIGINS` total; rest stays in overflow ("More origins"). Apply in `OriginFilters.svelte` AND `Drawer.svelte` so both surfaces agree.

### 5. Germany origin (empty)
- `ORIGIN_META` in db-sync.mjs: `germany` (name_es Alemania, name_pt Alemanha, name_ja ドイツ, name_fr Allemagne, flag 🇩🇪).
- `schema.ts` countryNames: `germany: 'Germany'`.
- Hero image entry (from #3). No regions/products.
- `db:sync` creates row; `data:export` includes it; smoke-test `/origen/alemania` renders empty grid without errors.

### 6. Add 5 Indian whiskies (follow add-product skill)
Queue lines 330–334 in docs/whisky-brands-and-products-to-add.md:
1. Paul John Edited — Paul John (Goa)
2. Paul John Classic Select Casks — Paul John
3. Rampur Indian Single Malt — Rampur (Uttar Pradesh)
4. Indri-Trini Single Malt — Indri (Haryana)
5. Kamet Indian Single Malt — Kamet

Per product/brand:
- Research proof of distillery location; new distilleries `paul-john`, `rampur`, `indri`, `kamet` (+ lat/lng for the map, website, founded).
- Regions: reuse `india-bangalore`? No — Paul John is Goa, Rampur UP, Indri Haryana. Create needed regions in ORIGIN_META (e.g., india-goa, india-rampur, india-indri…) and assign sensibly.
- Images: source bottle shot → `prepare-image.mjs` → WebP under public/data/images.
- Descriptions in structured format translated es/en/pt/ja/fr; influencer videos per language if findable (skill default).
- Seed entries → `db:sync` → `data:export` → tick queue lines ✅.

### 7. Verify & wrap
- `npm run db:sync` then `npm run data:export` once after all DB changes.
- Expected counts: scotland 103, ireland 21, usa 12, taiwan 8, japan 7, argentina 7, india 8, wales 4, canada 1, england 1, uruguay 0, germany 0.
- `npm run build` + `npm run check` clean; preview smoke tests: `/origen/argentina` (7), `/origen/india` (8), `/origen/uruguay` (empty ok), `/origen/alemania` (empty ok), `/map` markers updated.
- Update AGENTS.md "Next tasks" statuses if touched by this work; no commit/push unless asked.
