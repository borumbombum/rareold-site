Status: TODO

# Add IP-based language detector that suggests localized URL

## Context

After 032 makes English the default (`/` = en), detect the visitor's country from their IP and
redirect first-time visitors from `/` to their closest locale (`/es`, `/br`, `/jp`, `/fr`).
Must be **platform-agnostic**: the app can be deployed to Vercel or any other host, so we do NOT
rely on platform headers like `x-vercel-ip-country` — detection uses a free external IP
geolocation API called server-side. Depends on 032 (English as base) being done first.

## Requirements

1. **IP geolocation**: call a free HTTPS IP-geolocation API server-side to resolve visitor IP →
   country code. Proposed provider: **ipwho.is** (HTTPS, no API key — note ip-api.com free tier is
   HTTP-only). Isolate the provider behind a single function so it can be swapped; optional env
   override for provider/endpoint.
2. **Language-proximity fallback** (not just exact countries): map country → primary language →
   closest available locale:
   - pt: PT (Portugal → serve `/br`), BR, AO, MZ
   - es: UY + Hispanic America (AR, MX, CL, CO, PE, EC, VE, BO, PY, GT, HN, SV, NI, CR, PA, DO, CU)
   - fr: FR, BE, CH, LU, MC
   - ja: JP
   - en: US, GB, IE, AU, NZ, CA
   - **Worst case: English** (any unmapped country) — after 032 that is `/` itself, so no redirect
3. In `src/hooks.server.ts`, on first visit only (no locale cookie), resolve IP → locale and if it
   differs from the current root locale, **302-redirect** (never 301) from exact `/` to the
   localized root. Never redirect deep links/product pages.
4. Skip bot/crawler user-agents entirely (SEO safety).
5. Cache IP→locale in-memory (short TTL ~24h, size-capped Map) and dedupe concurrent lookups for
   the same IP (shared in-flight promise).
6. Set a cookie (`rareold.detected_lang`) after detection so we don't re-detect subsequent visits;
   also set it when a visitor lands on any prefixed locale path so manual choice always wins.
7. Graceful fallback: API down, rate-limited, timeout (~1s) or unknown country → silently stay on
   English `/`. Max 1 detection per IP per session.
8. Dev/testing override: `?lang=xx` query param forces detection without relying on real geolocation.

## Acceptance criteria

- Visiting `/` from a Brazilian IP redirects to `/br`; from a Portuguese IP also lands on `/br`
  (proximity fallback); from a Japanese IP → `/jp`; from a French IP → `/fr`
- Visiting `/` from a US/UK/unknown IP stays at `/` (English, no redirect)
- Deep links (e.g. `/whisky/<slug>`) are never redirected
- Second visit (cookie present) does not hit the geolocation API again
- No performance degradation beyond a one-time ≤1s lookup on an uncached first visit; cached IPs
  and cookie-holding visitors add zero latency
- Works in development via `?lang=` override
- Unit tests cover the country→locale map and resolver logic (API mocked)

## Progress

- 2026-08-21 (ox-alpha): Spec rewritten per user direction — dropped Vercel-header approach
  (must stay platform-agnostic), added language-proximity fallback (e.g. Portugal → `/br`),
  worst-case English, and dependency on 032 being implemented first.
