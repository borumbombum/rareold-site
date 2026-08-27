Status: [DONE]

# RSS feed, robots.txt, sitemaps by language, and link verification

**Supersedes:** `016-sitemaps-by-language.md` (absorbs its requirements and adds RSS + link verification)

## Context

No sitemap, robots.txt, or RSS feed exists today. The site is path-prefixed per locale: `/` = es (UY), `/br` = pt (BR), and `/us` will arrive in task 010. All 156 products exist in every locale. A product page is `{prefix}/whisky/<slug>`. Origin pages exist at `{prefix}/origin/<slug>`. The homepage is `{prefix}/`.

For multi-language SEO, each language gets its own sitemap (Google's recommended pattern), listed in a sitemap index, with `hreflang` alternates. An RSS feed enables feed readers and podcast/whisky aggregators to follow new products. A link verifier ensures all URLs in sitemaps and feed actually resolve at build time.

## Requirements

### 1. Sitemaps (from 016)

**Shared builder** `src/lib/server/sitemap.ts`:
- `LOCALE_PREFIX: Record<string, string> = { es: '', pt: '/br' }` — single source driving both the index and locale sitemaps (extend with `us: '/us'` when task 010 lands).
- `buildSitemapIndex(origin)` → index XML listing `/sitemap-<lang>.xml` for each locale.
- `buildLocaleSitemap(origin, locale)` → `<url>` for the locale homepage, every product (`/whisky/<slug>`), and every origin page (`/origin/<slug>`), each with `<xhtml:link rel="alternate" hreflang="…"` pointing to the other locales' versions of the same page (self included).

**Routes:**
- `src/routes/sitemap.xml/+server.ts` → sitemap index.
- `src/routes/sitemap-es.xml/+server.ts` and `src/routes/sitemap-pt.xml/+server.ts` → per-language sitemaps. Unknown lang → 404.
- Responses: `Content-Type: application/xml` + runtime cache `public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400`.

### 2. Robots.txt

`src/routes/robots.txt/+server.ts`:
```
User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/
Disallow: /user/

Sitemap: {origin}/sitemap.xml
Sitemap: {origin}/feed.xml
```
- `Content-Type: text/plain`
- Runtime cached like sitemaps.

### 3. RSS feed

`src/routes/feed.xml/+server.ts`:
- RSS 2.0 with `<channel>`: title ("Old Rare"), link, description, language, lastBuildDate.
- `<item>` for each product: title (`{name} — Old Rare`), link (`{origin}/whisky/{slug}`), description (first ~300 chars of product description), pubDate (from `created_at` or build time), `<enclosure url="{origin}{image}" type="image/webp">` when image exists.
- `<atom:link rel="self" href="{origin}/feed.xml" type="application/rss+xml">`.
- `Content-Type: application/rss+xml`
- Runtime cached like sitemaps.
- `Cache-Control: public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400`.

### 4. Link verification script

`scripts/verify-links.mjs` (npm script `data:verify-links`):
- After build, starts the Vite preview server (`npm run preview`) or hits a provided `BASE_URL`.
- Fetches every `<loc>` URL from each sitemap XML + every `<link href>` from the RSS feed.
- Also verifies the `Sitemap:` directive in `robots.txt` resolves.
- Reports failures (non-200 status code).
- **Fails with exit code 1** if any link is broken (CI-friendly).
- Rate-limited parallel fetches (5 concurrent) to avoid hammering.
- Accepts optional `BASE_URL` env var (defaults to `http://localhost:4173`).

### 5. Task 010 note

When `/us` lands, add `us: '/us'` to `LOCALE_PREFIX`, create `sitemap-us.xml` route, and the `us` hreflang is included automatically.

## Acceptance criteria

- `GET /sitemap.xml` → valid XML sitemap index referencing `sitemap-es.xml` and `sitemap-pt.xml`.
- `GET /sitemap-es.xml` → `<url>` entries for homepage + all products + all origin pages, each with `hreflang` alternates for es/pt.
- `GET /sitemap-pt.xml` → same with `/br` prefixes.
- `GET /robots.txt` → points to `sitemap.xml` and `feed.xml`, disallows `/admin`, `/api/`, `/user/`.
- `GET /feed.xml` → valid RSS 2.0 with `<item>` for every product, self-referencing `<atom:link>`, enclosure for images.
- `npm run data:verify-links` → all URLs in sitemaps + feed return 200 (or script is skipped gracefully when preview server not running).
- `npm run check` and `npm run build` pass.
- Remove or mark `016-sitemaps-by-language.md` as DONE (this task supersedes it).

## Progress

