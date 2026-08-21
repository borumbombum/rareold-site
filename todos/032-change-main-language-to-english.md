Status: DONE

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

- 2026-08-21 (ox-alpha): Starting implementation. Plan approved by user: config swap (locales.ts,
  settings.json, vite.config.ts both blocks — unprefixed locale goes last), recompile paraglide,
  legacy `/en/*` → stripped-path 301 redirect handle in hooks.server.ts, feed.xml language/description
  to English, AGENTS.md + README doc touch-ups. Sitemaps/hreflang/html-lang derive from
  LOCALE_CONFIG (verify only). DB base columns stay Spanish.
- 2026-08-21 (ox-alpha): DONE. Changes: locales.ts (en path '', es path '/es'), settings.json
  (baseLocale en + urlPatterns en→'/', es→'/es', unprefixed last), vite.config.ts both blocks
  (en unprefixed `/origin/:slug` + `/:path`, es `/es/origen/:slug` + `/es/:path`), paraglide
  recompiled, hooks.server.ts legacy redirect (`/en` and `/en/*` → 301 to stripped path, via
  sequence() before paraglide), feed.xml language→en + English channel description, AGENTS.md +
  README urlPatterns doc lines updated. Verified: check 2 errors / test 66+1 known / build exit 0
  (all baseline). Preview smoke: `/` English lang="en-US", `/es/` Spanish lang="es-UY", `/br`
  `/jp` `/fr` 200, `/en/whisky/<slug>` → 301 → `/whisky/<slug>`, `/en` → 301 → `/`,
  sitemap-en.xml unprefixed with correct hreflang alternates, sitemap-es.xml `/es/...`,
  feed `<language>en</language>`. No commits/pushes.
- 2026-08-21 (ox-alpha): Follow-up — language modal listed Español first (list order derives from
  LOCALE_CONFIG key order). Reordered keys to en, es, pt, ja, fr so English (base) is first in the
  modal, sitemap index, and hreflang alternates. No code assumes LOCALES[0] === es (verified).
  check/test/build at baseline; sitemap index order confirmed en-first via preview.
