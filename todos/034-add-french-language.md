Status: TODO

# Add French (fr) as a full language with UI + product translations

## Context

Following the existing localization pattern (AGENTS.md §Localization), add French as a 5th locale. This requires UI strings, DB columns, seed data translations, admin form fields, paraglide config, and vite URL patterns.

## Requirements

1. **`src/lib/utils/locales.ts`**: Add `fr: { flag: '🇫🇷', label: 'Français', bcp47: 'fr-FR', path: '/fr' }` to `LOCALE_CONFIG`
2. **UI strings**: Create `messages/fr.json` translating all keys from `messages/en.json`
3. **`project.inlang/settings.json`**: Add `fr` to `locales` array and add French URL patterns
4. **`vite.config.ts`**: Add `['fr', ':protocol://:domain(.*)::port?/fr/:path(.*)?']` to both `urlPatterns` blocks
5. **DB migration**: Create `db/migrations/0017_products_french.sql` adding `name_fr`, `description_fr` to `products` table and `name_fr` to `origins` table
6. **Seed data**: Add `name_fr` and `description_fr` to all 159+ products in `data/seed/whiskies.json`. Start with English translations as base, then refine. At minimum, product names (brand names are often the same) and descriptions need to be present
7. **`scripts/db-sync.mjs`**: Add `name_fr` to `ORIGIN_META` for all origins
8. **Admin forms**: Add French fields to `/admin/products` edit form (name_fr, description_fr textarea/Tiptap)
9. **Pages CMS**: Add `title_fr`, `body_fr` columns to `pages` table (migration) and admin form
10. **Verify `l10n()` and `originLabel()`** automatically pick up the new locale (they derive from `LOCALE_CONFIG`)

## Acceptance criteria

- `/fr/` loads the French version of the site
- Language switcher shows French flag + "Français"
- All 159 products have non-null `name_fr` and `description_fr`
- Admin can edit French product fields
- `npm run db:sync && npm run data:export && npm run build` succeeds

## Progress
