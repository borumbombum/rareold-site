Status: [DONE]

# Sitemaps organized by language

## Context

The site is path-prefixed per country on one domain: `/` = es (UY), `/br` = pt (BR), and `/us` will
arrive in task 010. All 156 products exist in every locale; a product page is `{prefix}/whisky/<slug>`
where the prefix is `` for es, `/br` for pt, `/us` for us. No sitemap or robots.txt exists today.

For multi-language SEO, each language gets its own sitemap (Google's recommended pattern), listed in a
sitemap index, with `hreflang` alternates so crawlers map each URL to its locale twins. Origin is
auto-detected per request (`event.url.origin`, per task 013 — no env var).

## Requirements

1. **Shared builder** `src/lib/server/sitemap.ts`:
   - `LOCALE_PREFIX: Record<string, string> = { es: '', pt: '/br' }` — single source driving both the
     index and the locale sitemaps (extend with `us: '/us'` when task 010 lands; mirrors the
     `HTML_LANG` map in `src/hooks.server.ts`).
   - `buildSitemapIndex(origin)` → index XML listing `/sitemap-<lang>.xml` for each locale.
   - `buildLocaleSitemap(origin, locale)` → `<url>` for the locale homepage and every product
     (`WHISKIES` from `$lib/data/whiskies`), each with `<xhtml:link rel="alternate" hreflang="…"`
     pointing to the other locales' versions of the same page (self included).

2. **Routes** (SvelteKit can't do embedded params like `sitemap-[lang].xml`, so explicit files):
   - `src/routes/sitemap.xml/+server.ts` → sitemap index.
   - `src/routes/sitemap-es.xml/+server.ts` and `src/routes/sitemap-pt.xml/+server.ts` → per-language
     sitemaps (a `sitemap-us.xml` file is added in task 010).
   - Unknown lang → 404. Responses: `Content-Type: application/xml` + runtime cache
     `public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400` (AGENTS.md: cache at the
     SvelteKit runtime level).

3. **`src/routes/robots.txt/+server.ts`** → `Allow: /`, `Disallow: /admin`, and
   `Sitemap: <origin>/sitemap.xml` (so crawlers discover the index).

4. **Task 010 note**: when `/us` lands, add `us: '/us'` to `LOCALE_PREFIX`, the `sitemap-us.xml` route,
   and the `us` hreflang is then included automatically.

## Acceptance criteria

- `GET /sitemap.xml` → XML sitemap index referencing `sitemap-es.xml` and `sitemap-pt.xml`.
- `GET /sitemap-es.xml` → 157 `<url>` entries (homepage + 156 products) using unprefixed paths, each
  with `hreflang` alternates for es/pt.
- `GET /sitemap-pt.xml` → same with `/br` prefixes.
- `GET /robots.txt` → points to `<origin>/sitemap.xml`, disallows `/admin`.
- `npm run check`, `npm test`, `npm run build` pass.

## Progress

- 2026-08-27 (tasks-skill migration): Replaced by `023-rss-robots-sitemap-link-verification.md`, which shipped the combined RSS + robots + sitemap work. Kept as `Status: [DONE]` per the `tasks` skill (no dedicated superseded marker).
