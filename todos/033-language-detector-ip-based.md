Status: TODO

# Add IP-based language detector that suggests localized URL

## Context

After 032 makes English the default, we want a smart language detector that uses the visitor's IP to infer their country/language and either: (a) redirect to the matching localized URL, or (b) show a subtle suggestion banner if a localized version exists. If no matching locale exists, default to English silently.

## Requirements

1. In `src/routes/hooks.server.ts` (server hook), on first visit (no locale cookie), call a free IP geolocation API (e.g. `ip-api.com` or `ipinfo.io`) to get country code
2. Map country codes to available locales: UY→es, BR→pt, US/en-speaking→en, JP→ja, FR→fr (after 034)
3. If the detected locale differs from the current URL locale, either:
   - Auto-redirect to the localized URL (preferred for first visit), OR
   - Show a non-intrusive banner/toast suggesting the localized version
4. Cache the IP→locale mapping server-side (in-memory, short TTL) to avoid hammering the API
5. Set a cookie (`rareold.detected_lang`) so we don't re-detect on subsequent visits
6. Graceful fallback: if API is down or rate-limited, default to English silently
7. Rate limit: max 1 detection per IP per session

## Acceptance criteria

- Visiting `/` from a Brazilian IP redirects (or suggests) `/br`
- Visiting `/` from a Japanese IP redirects (or suggests) `/jp`
- Visiting `/` from a US IP stays at `/` (English)
- No performance degradation — detection must not block page render
- Works in development (can test with manual locale override)

## Progress
