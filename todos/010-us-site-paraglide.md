Status: DONE

# US site — Paraglide locale `us` (/us)

## Context

The site is path-prefixed per country on one domain: `/` = `es` (UY), `/br` = `pt` (BR). Adding the US site means a new `us` locale at `/us` (US, USD, en-US). Everything that enumerates locales/sites must be extended, plus a DB migration and full English catalog content.

## Requirements

1. **Paraglide config**
   - `project.inlang/settings.json`: add `us` to `locales` and `{ "locale": "us", "path": "/us" }` to `urlPatterns` (es base stays unprefixed).
   - `vite.config.ts`: add `['us', ':protocol://:domain(.*)::port?/us/:path(.*)?']` urlPattern before `es`.
   - `messages/us.json`: full English translation of all keys (base is `es`).
   - `src/hooks.server.ts`: `HTML_LANG` add `us: 'en-US'`.

2. **Database**
   - New migration `db/migrations/0007_localized_us.sql`: `ALTER TABLE products ADD COLUMN name_us TEXT;` and `ADD COLUMN description_us TEXT;` (pattern of 0005).
   - `data/seed/whiskies.json`: `description_us` for all 156 products (translated from the Spanish base); `name_us` where the English name differs.
   - `scripts/db-sync.mjs`: add `name_us`/`description_us` to the product upsert (like `name_pt`).
   - `scripts/db-export.mjs`: select + emit `name_us`/`description_us` into `src/lib/data/whiskies.json`.
   - Origins need no override (canonical English `origins.name` already falls back for `us`); same for regions.

3. **Types & site context**
   - `src/lib/types.ts`: `Locale = 'es' | 'pt' | 'us'`, `CountryCode = 'BR' | 'UY' | 'US'`, `Whisky` gains `name_us`/`description_us`.
   - `src/lib/server/env.ts`: add `sites.US` (`locale:'us'`, `currency:'USD'`, symbol `$`, `timezone:'America/New_York'`); fix `siteForLocale` to resolve `us` → `sites.US` (replace the `pt ? BR : UY` ternary).
   - `src/routes/+page.server.ts`: widen locale cast to include `us`.

4. **Per-country fixes surfaced by US**
   - `src/routes/whisky/[slug]/+page.svelte` (~line 56): `resellerCurrency` → USD for US.
   - `src/lib/utils/format.ts`: map Paraglide locale to Intl locale (`us` → `en-US`) in `formatPrice`/`formatNumber`/`formatDate` (`Intl.NumberFormat('us')` throws).
   - `src/lib/data/resellers.ts`: add `US` to `RESELLERS` fallback — ReserveBar, Caskers, Drizly (all have affiliate programs; deterministic mock prices like UY/BR). `resellersFor` already branches to `resellers_usa`.
   - `src/lib/utils/affiliates.ts`: `AFFILIATE_SITES` is `Record<CountryCode, …>` — add US entry.

5. **Docs**
   - `README.md`: document `/us` (site list + i18n note).

## Acceptance criteria

- `/us` serves the full site in English (en-US), `/` Spanish, `/br` Portuguese.
- All 156 products have `description_us` in `data/seed/whiskies.json` and `src/lib/data/whiskies.json` after `npm run db:sync && npm run data:export`.
- US site shows USD prices and US partners; product pages with `resellers_usa` use them, otherwise the fallback list.
- `npm run check` passes; `npm run build` works.

## Progress
