Status: [DONE]

> **Superseded by 067** — replaced by migrating the catalog to a local SQLite-backed search index (self-hosted, not sharded build-time JSON).

# Catalog counts & ranking orders as snapshot metadata

## Context

Task 056 moved origin totals into `catalog.counts.json`. Today the client derives per-origin/per-region
counts and ranking (sort by votes/rating/name) by iterating the loaded full array client-side. At 30k
that client-side aggregation is wasteful. This task moves aggregates + default ranking into the
snapshot metadata so the client never sorts/counts over large arrays.

Frontend stays JSON-only; the metadata is generated at export time alongside the data.

## Requirements

1. Extend `catalog.counts.json` (or a metadata file) to include:
   - per-origin and per-region product counts;
   - default ranking order per shard (by votes, rating, name) precomputed at export.
2. `getCatalogIndex()` / sort pipeline consume precomputed order instead of re-sorting full arrays.
3. Keep client-side sort/filter override working for the already-loaded set (small enough to reorder).
4. Generate updates to counts/ranking whenever db-sync/export runs (turso → snapshot keeps it fresh).

## Acceptance criteria

- [ ] Client derives counts and default ranking from snapshot metadata, not full-array iteration.
- [ ] Per-origin/per-region counts accurate and fresh after each export.
- [ ] `npm run check` + `npm run build` pass; counts + ranking verified on homepage/origin views.

## Progress

- (none yet — task created)
