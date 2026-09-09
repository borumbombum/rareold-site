Status: [IN_PROGRESS] HIGH PRIORITY

# Stores system: admin management + IP-based dynamic fetching

## Context

The current resellers system is hardcoded to 3 countries (UY/BR/US), embedded in `whiskies.json`, has no admin UI, and is resolved from the site's URL locale on the server. This task completely replaces it with a self-contained **store system** whose only purpose is to populate the `StoreList.svelte` component with valid affiliate-link data.

**This system is completely independent from origins.** Origins (where the whisky is produced: Scotland, Ireland, Japan...) keep working exactly as they are — untouched. This new system is about countries where the visitor is from / where retail stores operate, and has no shared tables or logic with the origin system.

The new flow:
- **Countries as first-class admin entities** (`store_countries`) — where stores operate
- **Stores managed per-country** via admin CRUD
- **Per-product deep affiliate links** as optional overrides (product + store → custom URL + price)
- **Client-side dynamic fetching** from Turso via an internal API, with skeleton loader
- **IP-based country resolution** with fallback to EN

## New DB Schema

Tables are prefixed `store_`/`product_` to make clear they belong to the store system and are unrelated to product origins.

**`store_countries`** — which country a visitor is from and where stores operate:

| Column | Type | Notes |
|--------|------|-------|
| `code` | TEXT PK | ISO 2-letter (UY, BR, US, PT, JP, ...) |
| `name` | TEXT | Display name ("Brazil", "Portugal") |
| `currency` | TEXT | ISO 4217 (BRL, EUR, USD, JPY, UYU) |
| `sort_order` | INTEGER | Display ordering |
| `active` | BOOLEAN | Enable/disable without deleting |

**`stores`** — retail stores per country:

| Column | Type | Notes |
|--------|------|-------|
| `id` | TEXT PK | Slug |
| `store_country_code` | TEXT FK → `store_countries(code)` | Which country this store operates in |
| `name` | TEXT | Store name ("Amazon Brasil") |
| `url` | TEXT | Default link |
| `logo_url` | TEXT | Nullable store logo URL |
| `sort_order` | INTEGER | Display ordering |

**`product_stores`** — optional per-product deep affiliate links:

| Column | Type | Notes |
|--------|------|-------|
| `product_id` | TEXT FK → `products(id)` | |
| `store_id` | TEXT FK → `stores(id)` | |
| `url` | TEXT | Product-specific deep link (overrides store default `url`) |
| `price` | REAL | Nullable product-specific price |

PRIMARY KEY on `(product_id, store_id)`.

## Prerequisites (must be present before execution)

Current resellers system (task 012 ecosystem) present and working: `StoreList.svelte`, `resellersFor()` in `src/lib/utils/resellers.ts`, `detectUserCountry()` in `src/lib/utils/geo-client.ts`, `resellers_uy/br/usa` on the `Whisky` type. Verify before writing any code.

## Requirements

### API endpoint

**`GET /api/stores?product=<slug>&country=<code>`** — public, no auth.

1. Resolve country code → query `stores` JOIN `store_countries` (active only).
2. Left-join `product_stores` for product-specific overrides (URL + price).
3. Return `{ stores: [...], currency: string }` — each store: `{ name, url, price, logo_url }`.
4. If the country has no stores configured → fall back to `EN` stores.
5. `Cache-Control: private, max-age=300` (IP-specific data, so private).

### Client-side: `StoreList.svelte` rewrite

- Props: `productSlug` only (no more pre-filtered reseller arrays).
- Calls `detectUserCountry()` → fetches `/api/stores?product=<slug>&country=<code>`.
- Shows a skeleton loader while fetching.
- Renders stores on success (name, logo, link, price if present).
- Country flag shown based on the resolved country.

### Product page changes (`whisky/[slug]`)

- Remove `resellersFor()`, the `resellers`/`resellerCurrency` derived values.
- Remove `resellers_uy/br/usa` from the product data (no longer exported).
- Render `<StoreList productSlug={product.slug} />` — just the slug.

### Admin section

**Countries** (`/admin/store-countries`):
- List: code, name, currency, sort order, active, store count.
- Inline create/edit form (origins admin pattern).
- Toggle active/inactive.

**Stores** (`/admin/stores`):
- Filter by country dropdown.
- List: name, URL, logo preview, sort order.
- Inline create/edit form with `logo_url` field.

**Product admin** — "Store Links" section:
- When editing a product, add a section after Videos.
- Per active country: country flag + store dropdown + deep link URL + price.
- Optional — only filled for products with specific affiliate links.

**Admin nav** — add "Store Countries" + "Stores" links to `admin/+layout.svelte`, with Paraglide messages.

### Migration & cleanup

1. New migration: `store_countries`, `stores`, `product_stores` tables.
2. Seed: insert UY, BR, US + their existing stores from the old `resellers` table.
3. `db-export.mjs`: remove `resellers_uy/br/usa` from product JSON export.
4. Delete `src/lib/utils/resellers.ts`.
5. Remove `resellers_uy`, `resellers_br`, `resellers_usa` from the `Whisky` type.
6. Drop the old `resellers` table (after data migrated).
7. Update `db-sync.mjs` to remove resellers sync.
8. Remove old `data/seed/resellers.json`.

## Acceptance criteria

- [ ] Prerequisite confirmed: current resellers/StoreList system present and working before any code.
- [ ] New store system is fully independent from origins; origins untouched and working.
- [ ] `store_countries`/`stores`/`product_stores` tables created and seeded (UY/BR/US + their stores).
- [ ] `GET /api/stores` returns per-country stores with product overrides, falls back to EN, correct currency.
- [ ] `StoreList.svelte` fetches client-side with skeleton loader, no longer receives pre-filtered arrays.
- [ ] Admin CRUD for store countries and stores works (create/edit/delete, active toggle, logo_url).
- [ ] Product admin has a "Store Links" section for optional per-product deep links.
- [ ] Paraglide messages + Tailwind classes only; toasts via `ui.showToast`.
- [ ] Old `resellers` system removed cleanly (resellers.ts, type fields, JSON export, old table), no dead references.
- [ ] `npm run check` → 0 errors; build passes; store endpoint + component verified.

## Progress

- (none yet — task created)
