# Featured Whiskies

Status: TODO

## Context

The homepage shows all products ranked by rating. There is no way to highlight specific whiskies as "editor's picks" or featured. We need an admin-toggleable `featured` flag on products, exported to the JSON catalog, and rendered as a distinct "Featured" section at the top of the homepage using a dedicated component showing the latest 4 featured whiskies.

## Requirements

1. **DB column**: `products.featured INTEGER NOT NULL DEFAULT 0` (SQLite boolean).
2. **Admin UI**: Toggle checkbox in the product edit form at `/admin/products`. Star badge in the products table for featured items.
3. **Pipeline**: `featured` flows through the full Turso → `npm run data:export` → `whiskies.json` → frontend pipeline. `npm run db:sync` seeds and backfills it.
4. **Homepage**: A dedicated `FeaturedSection.svelte` component renders the latest 4 featured whiskies (by rating) in a separate box above the main product list, clearly labeled "Featured". Only shown when there are featured products.
5. **i18n**: UI strings for the featured label in all 4 locales.

## Acceptance Criteria

- [ ] Migration adds `featured` column to `products` table (number dynamically chosen at implementation).
- [ ] Seed `data/seed/whiskies.json` entries each have a `featured` boolean field.
- [ ] `npm run db:sync` applies the column and upserts `featured` from seed data.
- [ ] `npm run data:export` includes `featured` in `src/lib/data/whiskies.json`.
- [ ] `Whisky` type in `src/lib/types.ts` has `featured: boolean`.
- [ ] Admin product form has a "Featured" toggle that saves to Turso.
- [ ] Admin products table shows a star badge for featured products.
- [ ] `FeaturedSection.svelte` component exists and renders up to 4 featured products.
- [ ] Homepage shows the featured section above the origin filters when featured products exist.
- [ ] i18n keys added to all 4 message files.
- [ ] Build, typecheck, and tests pass.

## Implementation Plan

### 1. DB Migration — `db/migrations/NNN_products_featured.sql`
Scan `db/migrations/` for the next available number. Create:
```sql
ALTER TABLE products ADD COLUMN featured INTEGER NOT NULL DEFAULT 0;
```

### 2. Seed data — `data/seed/whiskies.json`
Add `"featured": true` or `"featured": false` to every whisky entry. Default all to `false` initially (admin toggles them).

### 3. db-sync.mjs — `scripts/db-sync.mjs`
- Add `featured` to the `INSERT INTO products` column list and VALUES.
- Add `featured = excluded.featured` to the `ON CONFLICT DO UPDATE` clause.

### 4. db-export.mjs — `scripts/db-export.mjs`
- Read `p.featured` in the products SELECT query.
- Include `featured: row.featured ? true : false` in the exported object.

### 5. Types — `src/lib/types.ts`
- Add `featured: boolean` to the `Whisky` interface.

### 6. Admin server — `src/lib/server/admin.ts`
- Add `featured: boolean` to `ProductInput`.
- Add `'featured'` to `PRODUCT_FIELDS`, `PRODUCT_COLUMNS`, `PRODUCT_COLUMNS_PREFIXED`.
- Update `rowToProductInput`: `featured: Number(row.featured) === 1`.
- Update `productValues`: add `input.featured ? 1 : 0`.
- Update `createProduct` and `updateProduct` to include the column.

### 7. Admin API — `src/routes/api/admin/products/+server.ts`
- In `parseProduct`, add: `featured: body.featured === true || body.featured === 1`.

### 8. Admin UI — `src/routes/admin/products/+page.svelte`
- Add `featured: boolean` to `ProductForm` interface.
- In `openNew`: default `featured: false`.
- In `openEdit`: copy `featured` from the product.
- In `save`: include `featured` in the JSON body.
- Add a labeled checkbox/toggle in the form grid (e.g. next to distillery select).
- In the table, add a star icon column or inline badge when `p.featured` is true.

### 9. New component — `src/lib/components/FeaturedSection.svelte`
```svelte
<script lang="ts">
  import ProductCard from './ProductCard.svelte';
  import type { CountryCode, Whisky } from '$lib/types';
  import { m } from '$lib/paraglide/messages';

  let { products, country }: { products: Whisky[]; country: CountryCode } = $props();
</script>

{#if products.length > 0}
  <section class="mx-auto max-w-7xl px-4 sm:px-6">
    <h2 class="mb-4 font-display text-lg font-semibold text-zinc-900 dark:text-white">
      ⭐ {m.featured_section_title()}
    </h2>
    <div class="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
      {#each products as product, i (product.slug)}
        <ProductCard {product} rank={i + 1} {country} />
      {/each}
    </div>
  </section>
{/if}
```

### 10. Homepage — `src/routes/+page.svelte`
- Import `FeaturedSection`.
- Derive: `const featuredProducts = $derived(ranked.filter(p => p.featured).slice(0, 4));`
- Render `<FeaturedSection>` after `<HeroHome>` and before the `<section id="ranking">`, guarded by `featuredProducts.length > 0`.

### 11. i18n — `messages/{en,es,pt,ja}.json`
Add keys:
- `admin_products_featured`: "Featured" / "Destacado" / "Destaque" / "おすすめ"
- `featured_section_title`: "Featured" / "Destacados" / "Destaques" / "おすすめ"

## Progress

- 2026-08-21 (buffy): Task created. Awaiting implementation.
