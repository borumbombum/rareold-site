Status: [TODO]

# Catalog detail pagination — homepage/all-origin paging off slim index

## Context

Task 056 introduces the slim origin-sharded catalog index. The homepage currently renders all
products of the active view at once (instant at current scale, ~330 B/card). As a single origin
shard grows (e.g. Scotland toward 10k+), one all-at-once render becomes heavy — this task adds
paging. Do NOT paginate until measured growth demands it (see Acceptance criteria).

Frontend stays JSON-only; all paging happens over the slim index (no DB round-trips).

## Requirements

1. Paginate the homepage / all-origin view of the slim catalog index (infinite scroll or "Load more").
2. Page size configurable (e.g. 48–96); append pages client-side; keep URL/scroll state sensible.
3. Preserve ranking/sort over the slim cards (see task 059 for moving ranking into snapshot metadata).
4. Only introduce when the active shard exceeds the measured threshold below.

## Acceptance criteria

- [ ] Homepage renders page 1 instantly, appends subsequent pages on scroll / "Load more".
- [ ] No new DB round-trips (paging is over the local slim index).
- [ ] Documented threshold that triggers this: active origin shard > ~2,000 products or > ~700 KB raw.

## Progress

- (none yet — task created)
