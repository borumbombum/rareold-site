Status: TODO

# Change main language to English, move Spanish to /es

## Context

Currently Spanish (es-UY) is the default/base locale with no URL prefix. English is at `/en`, Portuguese at `/br`, Japanese at `/jp`. The user wants English as the default language (no prefix) and Spanish moved to `/es`. This is a foundational change that affects routing, locale config, and all localized content fallbacks.

## Requirements

1. Update `src/lib/utils/locales.ts` `LOCALE_CONFIG`: swap `es` (path: `''`) and `en` (path: `/en`), so `en` becomes the base locale and `es` gets path `/es`
2. Update `project.inlang/settings.json`: set `baseLocale` to `en`
3. Update `src/routes/hooks.server.ts`: adjust locale detection to treat `/` as English and `/es` as Spanish
4. Update `vite.config.ts`: adjust paraglide URL patterns — English gets `:protocol://:domain(.*)::port?/:path(.*)?`, Spanish gets `:protocol://:domain(.*)::port?/es/:path(.*)?`
5. Update sitemap generators (`src/routes/sitemap.xml/`, `src/routes/sitemap-[lang].xml/`) for the new URL structure
6. Update all internal links that assume Spanish is root (e.g. `localizeHref('/')` behavior)
7. Ensure the DB base locale concept aligns — `name` column in products table is Spanish; this doesn't change structurally, but fallback logic in `l10n()` should still work
8. Seed data remains unchanged (it's just the export pipeline)

## Acceptance criteria

- `/` loads English homepage by default
- `/es/` loads Spanish homepage
- All existing locale routes (`/br`, `/jp`, `/en`) still work (except `/en` which becomes root `/`)
- `npm run build` succeeds
- No broken links in navigation, language switcher, or footer

## Progress
