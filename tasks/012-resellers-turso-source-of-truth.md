Status: [DONE]

# Resellers in Turso (source of truth) + derived frontend JSON

## Context

Resellers are the last hardcoded data left in the frontend. `src/lib/data/resellers.ts` holds a hardcoded `RESELLERS[country]` map (3 stores per country: Alambique, Malthaus, Mercado Libre Uruguay / Amazon, Mercado Livre, Imexco) with fake deterministic prices computed by `priceFor()`/`hash01()`. Every product's `resellers_uy/br/usa` in the seed JSON is empty (156/156), and `resellersFor()` (resellers.ts) falls back to the country list. Only consumer: `src/routes/whisky/[slug]/+page.svelte`.

The rest of the catalog already uses Turso as the source of truth: `data/seed/*.json` → `scripts/db-sync.mjs` (additive, idempotent upserts) → Turso → `scripts/db-export.mjs` → `src/lib/data/*.json` → SvelteKit build. `db-export.mjs` currently *carries resellers over from the previously committed JSON* (lines 23–36, comment: "not stored in Turso yet") — that is the gap this task closes.

Auth/admin: users live in Turso `users` with a `role` column, Google login only; the admin section is task `004` (TODO).

User decisions:
- **Scope: data pipeline only.** Admin editing UI stays in task `004`.
- **No prices shown for now.** Seed `price` as NULL and hide prices (the UI already guards on `price != null`). A future price bot will fill real prices, per-product deep links, and affiliate URLs.
- **Priority:** new task `012` (next free number; no existing task covers resellers).

## Requirements

1. Migration `db/migrations/0007_resellers.sql`:

   ```sql
   CREATE TABLE IF NOT EXISTS resellers (
     id TEXT PRIMARY KEY,
     name TEXT NOT NULL,
     url TEXT NOT NULL,
     country TEXT NOT NULL CHECK (country IN ('UY','BR','US')),
     price REAL,
     sort_order INTEGER NOT NULL DEFAULT 0,
     product_id TEXT REFERENCES products(id) ON DELETE CASCADE
   );
   CREATE INDEX IF NOT EXISTS idx_resellers_country ON resellers(country);
   ```

   `product_id NULL` = country-wide store (today's behavior). Non-NULL = per-product listing (deep link + price, future bot/admin). `US` in the CHECK is forward-compatible with task 010.

2. Seed `data/seed/resellers.json`: the 6 stores as country defaults, `price: null`, same store URLs as today.

3. `scripts/db-sync.mjs`: read the new seed file and additive-upsert resellers (same idempotent pattern as origins/products; never deletes rows, so admin/bot rows survive).

4. `scripts/db-export.mjs`: drop the carry-over hack; query `resellers` from Turso; per product, resolve `resellers_uy/br/usa`: product-specific rows (by `product_id`, ordered by `sort_order`, then name) else country defaults; write the resolved lists into each product in `whiskies.json`.

5. Frontend: delete `src/lib/data/resellers.ts`; `whisky/[slug]/+page.svelte` picks the country list inline (`country === 'UY' ? product.resellers_uy : country === 'BR' ? product.resellers_br : product.resellers_usa`). Types unchanged (`Reseller.price` already `number | null`). No prices render (all NULL).

6. README: resellers bullet (line 41) + pipeline section describe Turso-backed resellers with NULL prices and future bot rows.

## Acceptance criteria

- Resellers come from Turso; `src/lib/data/whiskies.json` (derived export) carries per-product resolved lists.
- No hardcoded reseller map or fake-price math remains in `src/`.
- `db:sync` is additive: admin/bot-added reseller rows survive a rebuild.
- `db:export` resolves per-product overrides before country defaults.
- Product page shows the country's 3 stores with no prices.
- `npm run check` passes; `npm test` passes; `npm run build` works.

## Future work (needed for resellers to work fully — separate tasks)

- **Price bot (future task):** scans each configured store per product and writes/updates `resellers` rows with `product_id` set, a real `price`, and a deep-link `url` carrying affiliate params. Resolution already prefers per-product rows over country defaults, so the frontend starts showing real listings once rows exist. Will need scheduling, rate-limit/error handling, and a `reseller_price_history` table for price tracking.
- **Affiliate deep links:** per-product store URLs must point at the actual product with the store's affiliate params embedded in `url` (no schema change — `url` holds it).
- **Admin editing → task 004:** reseller management in the admin section: list by country, add/edit/delete country-default stores, later per-product price/link edits, via role-gated `/api/admin/resellers` endpoints (server-verified JWT + `role = 'admin'`). Add this to 004's requirements.
- **US site → task 010:** seed/configure `US` resellers when the US site ships (CHECK already allows `US`).
- **Store deactivation:** db:sync never deletes; if a store needs disabling instead of deleting, add an `active` column later (not now — keep minimal).

## Progress

- 2026-08-15 (opencode): Started. Creating migration, seed file, db-sync/db-export changes, frontend cleanup, README, verification. Next: write migration + seed.
- 2026-08-15 (opencode): Implemented. Migration `0007_resellers.sql` (resellers table + country index; `product_id NULL` = country default, set = per-product listing). Seed `data/seed/resellers.json` (6 country-default stores, `price: null`). `db-sync.mjs` reads the seed and additive-upserts resellers (never deletes). `db-export.mjs` now queries resellers from Turso and resolves each product's `resellers_uy/br/usa` (per-product rows first by sort_order, else country defaults); removed the old carry-over-from-JSON hack and the now-unused `readFile` import. Frontend: deleted `src/lib/data/resellers.ts` (hardcoded list + fake price math); added `src/lib/utils/resellers.ts` with the country-pick helper used by `ProductCard`, `ProductRow`, and the detail page; fixed the `Reseller` type comment. README: Data/pipeline section + detail-page bullet now describe Turso-backed resellers with NULL prices. Next: verify.
- 2026-08-15 (opencode): Verified. `db:sync` applied `0007_resellers.sql` and seeded 6 resellers (origins 8, regions 20, products 156). `data:export` wrote per-product resolved lists: sample product → UY 3 stores, BR 3 stores, US [] (prices null). `npm run check` 0 errors (9 pre-existing Svelte 5 rune warnings, unrelated), `npm test` 43/43, `npm run build` OK. Dev smoke: detail page SSR renders the UY store list (Alambique/Malthaus/Mercado Libre Uruguay), home 200, no prices shown. No `data/resellers` references left in `src/`. Done.
