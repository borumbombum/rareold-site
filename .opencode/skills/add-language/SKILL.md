---
name: add-language
description: Step-by-step guide for adding a new locale to the Old Rare whisky app. Covers config, messages, DB, seed data, admin forms, and build pipeline. Use whenever adding support for a new language.
---

# Adding a new language

Complete checklist. Each step lists the exact file and what to add. The existing Japanese (`ja`) locale is the reference implementation — grep for `ja` patterns to see examples.

## Quick overview

1. `src/lib/utils/locales.ts` — one entry in `LOCALE_CONFIG`
2. `messages/<locale>.json` — UI strings
3. `project.inlang/settings.json` — register locale + urlPatterns
4. `vite.config.ts` — paraglide plugin urlPatterns (both blocks)
5. DB migration — `_locale` columns on products, origins, pages
6. `scripts/db-sync.mjs` — ORIGIN_META + INSERT SQL
7. `scripts/db-export.mjs` — SELECT + mapping
8. Seed data — `data/seed/whiskies.json`, `data/seed/pages.json`
9. Admin forms — products + pages
10. Server types — `admin.ts`, `pages.ts`
11. Finalize — `npm run db:sync && npm run data:export`

---

## Step 1: Locale config (single source of truth)

**File:** `src/lib/utils/locales.ts`

Add one entry to `LOCALE_CONFIG`:

```ts
xx: { flag: '🏳️', label: 'Language', bcp47: 'xx-XX', path: '/xx' }
```

This auto-wires: `hooks.server.ts` (HTML lang), `LanguageModal`, `LanguageSwitcher`, `Header` (isHome), sitemaps, `origins.ts` (LOCALE_FIELD), route loaders, `types.ts` (Locale type).

## Step 2: Paraglide messages

**File:** `messages/<locale>.json`

Copy `messages/en.json` as a template. Translate all values. Use **snake_case** keys only.

**File:** `project.inlang/settings.json`

Add locale to `locales` array and to `urlPatterns.localized`:

```json
{ "locale": "xx", "path": "/xx" }
```

## Step 3: Vite plugin URL patterns

**File:** `vite.config.ts`

Add to **both** `urlPatterns` blocks in `paraglideVitePlugin`:

Block 1 (origin slug pattern):
```ts
['xx', ':protocol://:domain(.*)::port?/xx/origen/:slug']
```

Block 2 (generic catch-all):
```ts
['xx', ':protocol://:domain(.*)::port?/xx/:path(.*)?']
```

If there are route-specific patterns (e.g. `/origen/` → `/xx/translated-path/`), add a dedicated pattern block for them too.

## Step 4: DB migration

**File:** `db/migrations/NNN_<locale>.sql`

```sql
ALTER TABLE products ADD COLUMN name_<locale> TEXT;
ALTER TABLE products ADD COLUMN description_<locale> TEXT;

ALTER TABLE origins ADD COLUMN name_<locale> TEXT;

ALTER TABLE pages ADD COLUMN title_<locale> TEXT;
ALTER TABLE pages ADD COLUMN body_<locale> TEXT;
```

Follow the naming pattern of existing migrations (e.g. `0015_products_japanese.sql`, `0016_pages_japanese.sql`).

## Step 5: Seed data + db-sync script

### 5a. `scripts/db-sync.mjs`

**ORIGIN_META** (line ~10): Add `name_xx` to each origin entry:
```js
scotland: { name: 'Scotland', name_es: 'Escocia', ..., name_xx: 'Scotland' }
```

**Product INSERT** (line ~150): Add `name_xx`, `description_xx` to the column list and VALUES. The `ON CONFLICT` clause already backfills all locale columns — verify the new columns are included:
```sql
ON CONFLICT(id) DO UPDATE SET
  name_pt = excluded.name_pt, description_pt = excluded.description_pt,
  name_en = excluded.name_en, description_en = excluded.description_en,
  name_ja = excluded.name_ja, description_ja = excluded.description_ja,
  name_xx = excluded.name_xx, description_xx = excluded.description_xx
```

**Pages INSERT** (line ~190): Same pattern — add `title_xx`, `body_xx` to columns, VALUES, and `ON CONFLICT DO UPDATE SET`.

### 5b. Seed files

**`data/seed/whiskies.json`**: Add `name_xx` and `description_xx` to every product. `name_xx` can be the same as `name` (brand names are universal) or transliterated. `description_xx` must be translated.

**`data/seed/pages.json`**: Add `title_xx` and `body_xx` to every page (currently only the about page).

## Step 6: Export script

**File:** `scripts/db-export.mjs`

**Products SELECT** (line ~50): Add `p.name_xx, p.description_xx` to the SELECT and the mapping object.

**Origins SELECT** (line ~85): Add `name_xx` to the SELECT and mapping.

**Pages SELECT** (line ~120): Add `title_xx`, `body_xx` to the SELECT and mapping.

## Step 7: Admin forms

**File:** `src/routes/admin/products/+page.svelte`

Add input field for `name_xx` (follow the pattern of `name_en`).

In the `LOCALE_DESCRIPTIONS` loop (or equivalent), add the new locale so the textarea for `description_xx` renders.

**File:** `src/routes/admin/pages/+page.svelte`

Add `title_xx` input and `body_xx` textarea to the form. Update `newPage()` to include the new fields.

## Step 8: Server types

**File:** `src/lib/server/admin.ts`

Add `name_xx` and `description_xx` to the `ProductInput` interface.

**File:** `src/lib/server/pages.ts`

Add `title_xx` / `body_xx` to `PageRow`, `PageInput`, and the `upsertPage` SQL (both INSERT and ON CONFLICT).

**File:** `src/routes/api/admin/products/+server.ts`

Add `name_xx` / `description_xx` to `parseProduct()`.

## Step 9: Finalize

```sh
npm run db:sync        # applies migration + backfills locale columns from seed
npm run data:export    # regenerates whiskies.json, origins.json, pages.json
npm run check          # typecheck — should have 0 new errors
```

Verify:
- `/<path>` shows base locale content
- `/xx/<path>` shows translated content
- Language switcher shows the new locale with correct flag/name
- Sitemap includes the new locale (`/sitemap-xx.xml`)
- Admin products form has the new locale fields
- Admin pages form has the new locale fields

## Common pitfalls

- **Forgetting `vite.config.ts`**: The paraglide plugin needs urlPatterns separately from `project.inlang/settings.json`. Without it, `setLocale()` redirects to the same page instead of the localized URL.
- **`ON CONFLICT DO NOTHING`**: If db-sync uses `DO NOTHING` for new locale columns, existing products won't get the translations. Always use `ON CONFLICT DO UPDATE SET` for locale columns.
- **Missing admin form fields**: If the admin form doesn't have inputs for the new locale, translations can only be added via direct SQL.
- **Forgetting `db-export.mjs`**: The export script must SELECT and map the new columns, otherwise `whiskies.json` will have `null` for the new locale.
