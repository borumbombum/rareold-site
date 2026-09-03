Status: [DONE]

> **Superseded by 067** — replaced by migrating the catalog to a local SQLite-backed search index (self-hosted, not sharded build-time JSON).

# Scalable snapshot loader — split JSON export for 30k catalog

## Context

The frontend is 100% build-time JSON snapshot (no DB round-trips on home/detail/search);
admin is the ONLY Turso reader and regenerates the JSON. This is the core invariant.

Today `src/lib/data/whiskies.json` is one monolith: 220 products × 5-language descriptions ≈ 1.17 MB,
imported statically into the homepage client and SSR. At the target 30,000 whiskies this grows to
~117 MB (full record ~4 KB/product) — instant load dies.

Measured sizes: full record ~4095 B/product (~117 MB @ 30k); slim card
(`slug,name,distillery,origin,region,age,abv,image,featured`) ~332 B/product (~9 MB @ 30k).

Fix is pure data-shape + lazy-load restructuring of what `scripts/db-export.mjs` emits and how
components load it. NO new DB reads on frontend path. Origin sharding now; homepage stays all-at-once
(instant); finer sharding + pagination deferred to tasks 057–059.

## Requirements

1. **Split the export** in `scripts/db-export.mjs` — alongside the existing monolith, also emit:
   - `catalog.index.json` — slim card entries (`slug,name,distillery,origin,region,age,abv,image,featured`).
   - `index/<origin>.json` — per-origin shards of the slim index.
   - `catalog.counts.json` — origin totals (so client never counts over the full array).
   - `whiskies/<slug>.json` — per-product full record (5-language descriptions, cask, volume, resellers).
2. **Data layer** — new `src/lib/data/catalog.ts`:
   - `getCatalogIndex(origin?)` lazy dynamic-imports the right shard.
   - `CATALOG_COUNTS` from `catalog.counts.json`.
   - Rework `getProductBySlug` / `getDistilleryBySlug` to lazy-load the per-`<slug>.json` split (still JSON, instant).
3. **Migrate client consumers** off static `import { WHISKIES }`:
   - `SearchBar`, `Drawer`, `HeroHome`, homepage `+page.svelte` + `+page.server.ts` → shard loader + `CATALOG_COUNTS`.
   - No descriptions may enter the homepage critical JS.
4. **Migrate detail loaders** to the per-product split:
   - `whisky/[slug]`, `[slug]`, `destileria/[slug]`, `origen/[slug]` → JSON-local, lazy.
5. **Keep monolith server-only** for `/download` (paywall SQLite export) + sitemap — never imported by a client component.
6. **Cleanup + verify**: remove stale static `WHISKIES`/`DISTILLERIES` imports from client components; `npm run check` + `npm run build`; confirm search/drawer/home/detail still work.

## Acceptance criteria

- [ ] Export emits slim origin-sharded index + per-product split + counts, alongside the monolith.
- [ ] No client `.svelte` component statically imports `WHISKIES`/`DISTILLERIES` from the monolith.
- [ ] Homepage/search/drawer read only slim index (no descriptions in critical JS).
- [ ] Detail pages lazy-load their own small per-product file (still a local JSON fetch).
- [ ] `npm run check` (0 errors) and `npm run build` pass; search/drawer/home/detail verified working.
- [ ] /download + sitemap still use the full monolith server-side.

## Progress

- (none yet — task created)
