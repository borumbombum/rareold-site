Status: DONE

# All data in json files + interrelated Turso database (migration, build-time only)

## Context

All product/origin/category data had to live in json files with an interrelated Turso database. The database is only connected at build time to create the data that lives in the json (products, origins, sub-regions, etc.). The front-end reads fast committed JSON, never the database at runtime.

## Requirements

- Migration to create the interrelated tables in Turso.
- Connect to Turso only on build (`db:sync` + `data:export` before `vite build`).
- Derive origins/regions from `data/seed/whiskies.json` and upsert additively (never delete rows).
- Regenerate `src/lib/data/*.json` from Turso at build time.

## Acceptance criteria

- `scripts/db-sync.mjs` (`npm run db:sync`) applies `db/migrations/*.sql` and upserts seed data into Turso.
- `scripts/db-export.mjs` (`npm run data:export`) rewrites `whiskies.json`, `origins.json`, `regions.json` from Turso.
- Committed JSON is always a faithful export of the database.
- No live Turso connection at runtime.
