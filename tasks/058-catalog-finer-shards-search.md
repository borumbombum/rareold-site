Status: [DONE]

> **Superseded by 067** — replaced by migrating the catalog to a local SQLite-backed search index (self-hosted, not sharded build-time JSON).

# Catalog finer shards + cross-shard client search

## Context

Task 056 shards the slim index by origin. With 220 products search is instant over loaded shards.
As the catalog grows past ~2k, two problems emerge: (a) a single origin shard (e.g. Scotland) gets
large, and (b) client search only covers shards already loaded, not the full 30k catalog.
This task refines sharding and (optionally) full-catalog search — still JSON-only on the frontend.

## Requirements

1. **Finer sharding**: sub-shard large origins (e.g. by initial letter and/or page offset) so any
   single fetch stays small (~≤ a few hundred KB). Extend `catalog.index.json`/`index/<origin>.json`
   layout + `getCatalogIndex()` to resolve sub-shards.
2. **Cross-shard search (only if full-catalog client search is wanted)**: load sub-shards on demand
   as the user types/scrolls, or generate a compact search-only index (slug + name per locale) that
   is smaller than full cards. Keep it instant; IF full-catalog search cannot stay instant purely
   client-side, flag and propose a server search index as a documented exception to the JSON-only rule.
3. Keep search of the already-loaded set instant (no debounce regressions).

## Acceptance criteria

- [ ] No single index fetch exceeds the size threshold (~a few hundred KB raw) at target catalog size.
- [ ] Search over loaded shards stays instant; full-catalog search (if built) documented with size trade-offs.
- [ ] `npm run check` + `npm run build` pass; search + origin views verified.

## Progress

- (none yet — task created)
