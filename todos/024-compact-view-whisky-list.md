Status: DONE

# Compact view for whisky list

## Context

The site has two view modes: **grid** (image cards via `ProductCard.svelte`) and **list** (image + text rows via `ProductRow.svelte`). Both are toggled via `ViewToggle.svelte` and stored in `src/lib/stores/view.svelte.ts` as `ProductView = 'grid' | 'list'`. The view preference persists in localStorage + a cookie for SSR consistency (task 018's pattern: pre-paint inline script in `app.html` sets `data-view`, cookie syncs with SSR, `+layout.server.ts` reads cookie).

A **compact** view is a third option: no images, no play buttons, no favorite hearts — just a dense data table optimized for scanning many whiskies at a glance. Think spreadsheet-like rows.

## Requirements

### 1. Type + store

`src/lib/stores/view.svelte.ts`:
- Add `'compact'` to `ProductView` type: `'grid' | 'list' | 'compact'`
- Update `readStored()` to accept `'compact'` in the allowlist

### 2. Toggle button

`src/lib/components/ViewToggle.svelte`:
- Add a third toggle button for compact view
- Use a lucide icon (`AlignJustify` or `Table` from `@lucide/svelte`)
- Same styling pattern as the existing grid/list buttons (rounded-full, active state highlighting)

### 3. Compact row component

`src/lib/components/ProductCompact.svelte` (new file):
- Props: `product: Whisky`, `rank: number`, `country: CountryCode` (same as `ProductRow`)
- **No image**, no `PlayButton`, no `FavoriteButton`
- Layout per row:
  - Rank number (narrow column)
  - Origin flag
  - Product name (linked to detail page)
  - Brand
  - Region
  - ABV
  - Age
  - `VoteButton` (compact, no label — icon only)
  - Stores count
  - Detail arrow (linked)
- Tailwind: `text-xs`, tight vertical padding (`py-1.5` or `py-2`), `border-b border-zinc-100 dark:border-zinc-800` separation instead of card-style borders
- Mobile: hide less important columns (region, ABV, age) via `hidden sm:table-cell` or flex responsive classes — show rank + flag + name + vote + arrow on small screens

### 4. Page integration

Add `{:else if mode === 'compact'}` branch in three pages:
- `src/routes/+page.svelte` — after the existing `{:else}` (list) block, or restructure as `{:if mode === 'grid'} ... {:else if mode === 'list'} ... {:else} ...`
- `src/routes/origen/[slug]/+page.svelte` — same pattern
- `src/routes/user/[userId]/favorites/+page.svelte` — same pattern

Each renders `ProductCompact` rows in a container with `divide-y` for visual separation.

### 5. SSR cookie

`src/routes/+layout.server.ts`:
- Update cookie reading to also accept `'compact'`: `const v = cookies.get('rareold.view'); const view: ProductView = (v === 'list' || v === 'compact') ? v : 'grid';`

### 6. Pre-paint script

`src/app.html`:
- The existing inline head script that reads `rareold.view` and sets `data-view` already works for any value — just make sure `'compact'` is in the allowlist if there's an explicit check (currently it just passes the raw value through, so this may already work).

### 7. Messages

Add `view_compact` key in:
- `messages/es.json`: `"view_compact": "Compacto"`
- `messages/pt.json`: `"view_compact": "Compacto"`

## Acceptance criteria

- Three toggle buttons visible in `ViewToggle`: grid, list, compact
- Compact view renders a dense table per row: rank, flag, name (linked), brand, region, ABV, age, vote (icon), stores, arrow — **no images**
- Compact preference persists across page loads (localStorage + cookie + SSR, same as grid/list)
- Compact view works on home page, origin page, and favorites page
- Mobile: compact rows hide region/ABV/age columns gracefully, showing essential info only
- `npm run check`, `npm test`, and `npm run build` pass

## Progress


- 2026-08-21 (ox-alpha): Marked DONE during housekeeping — ProductCompact.svelte exists and is wired into home, origen and favorites pages; ViewToggle has the third toggle.
