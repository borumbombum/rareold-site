Status: DONE

# Remove `brand` — distillery object is the single source

## Context

Products used to carry a free-text `brand` column. Since 039 every product links to a real distillery (`products.distillery_id`), and the exported JSON already showed the distillery name in the brand line. This task removes the legacy `brand` concept entirely: DB column dropped, export embeds a slim distillery object, all frontend/admin code reads the distillery. Visitor-facing output must stay pixel-identical (it already renders distillery names today).

## Requirements

- Migration `0018_products_drop_brand.sql`: `ALTER TABLE products DROP COLUMN brand` (local + prod).
- `db-export.mjs`: no `brand` key; each whisky gets `"distillery": { id, name, name_es, name_pt, name_en, name_ja }`.
- `db-sync.mjs`: INSERT without brand; strip stale `brand` keys from `data/seed/whiskies.json`.
- `types.ts`: remove `Whisky.brand`, add `DistilleryRef`, `Whisky.distillery: DistilleryRef | null`.
- Display (identical rendering): ProductCard, ProductRow, ProductCompact, whisky detail page, SearchBar haystack + subtitle — via `l10n(distillery, 'name')`.
- `schema.ts` JSON-LD keeps `'@type': 'Brand'` but sourced from distillery name.
- Admin: Brand input + table column removed from `/admin/products`; filter searches distillery; `admin.ts` ProductInput/PRODUCT_COLUMNS/INSERT/UPDATE cleaned; `parseProduct` drops brand.
- Tests updated (`schema.test.ts`, `admin.test.ts`).

## Acceptance criteria

- No `.brand` references outside generated data/paraglide.
- Exported whiskies.json has `distillery` objects, no `brand`.
- Visitor rendering unchanged (all 159 products have linked distilleries).
- `npm run check` / `test` / `build` pass.

## Progress

- 2026-08-20 (ox-alpha): Starting. Plan approved by user with constraint: visitor POV must stay identical.
- 2026-08-20 (ox-alpha): DONE. Migration `0018_products_drop_brand.sql` applied to Turso (products intact, 160 rows) + tracked in schema_migrations. Export emits slim `distillery` object (id + localized names), no `brand` key; db-sync INSERT updated; seed stripped (159 entries). Types: `DistilleryRef`, `Whisky.distillery`. Display switched to `l10n(distillery,'name')` in ProductCard/ProductRow/ProductCompact/detail/SearchBar; JSON-LD brand sourced from distillery. Admin form input + table column removed, filter searches distillery_name, admin.ts/parseProduct cleaned. Verified: grep sweep clean, export has distillery on all 160 whiskies, check = 2 pre-existing baseline errors only, test = same single pre-existing stats failure, build exit 0. Visitor rendering unchanged (all products have linked distilleries).
