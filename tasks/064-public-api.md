Status: [DONE]

# Public read-only JSON API with rate limiting + admin usage control

## Context

We want our product data to be consumable by AI agents and other API consumers. The site's authoritative data lives in Turso and is exported to runtime build-time JSON (`src/lib/data/*.json`) via `npm run data:export`. This task builds an open, **free** read-only HTTP API that serves that JSON — no auth, no paywall — with a normal rate limit plus an admin usage-control surface (monitor traffic, block/unblock IPs, override per-IP limits).

> 2026-09-23 owner decision: **no API paywall** (tasks 065/066 cancelled — no consumer credentials, no plans page). The "control of usage" idea that previously sat under the paywall becomes admin IP/rate control here. The live SQLite download paywall (`/download`, task 044) is untouched.

Note: the `[slug]` endpoint name conflicts with the existing catch-all `src/routes/[slug]` — the task must confirm routing precedence (static `api/v1` prefix segments disambiguate, but verify) before finalizing paths.

## Requirements

1. Stand up a versioned read-only API namespace: `src/routes/api/v1/*`.
2. Endpoints serve from the runtime build-time JSON (`src/lib/data/*.json`), **never querying Turso**:
   - `GET /api/v1/whiskies` — full list. Supports:
     - `?country=` — filter by origin country (and/or distillery country)
     - `?distillery=` — filter by distillery (id or slug)
     - `?q=` — search by name/description
     - `?lang=` — resolve localized fields (default `en`), using existing l10n/originLabel helpers
   - `GET /api/v1/whiskies/[slug]` — single product, full localized fields **including influencer videos**
   - `GET /api/v1/origins` — origins list (localized)
   - `GET /api/v1/distilleries` — distilleries list (localized)
3. Responses are JSON, with a small envelope (e.g. `{ data: [...] }`) and consistent error shape (`{ error: string }`).
4. **Rate limiting + admin control**:
   - `src/lib/server/api-ratelimit.ts` — shared in-memory sliding-window rate limiter keyed by client IP (default 60 req/min) + a guard helper returning `429`.
   - Migration `db/migrations/0030_api_ip_controls.sql` — Turso table `api_ip_controls(ip, blocked, limit_per_min, reason, created_at)`. Blocked IP → `403`; `limit_per_min` overrides the default per-IP limit. Controls are cached for ~60s so normal traffic pays nothing but blocks survive serverless cold starts.
5. **Admin usage-control**: `/admin/api` page + `src/routes/api/admin/api-ip-controls/+server.ts` (mirror the `store-countries` CRUD pattern): live in-window stats (requests per endpoint, top IPs, 429 count), block/unblock IP, set per-IP limit override. Nav entry in `admin/+layout.svelte` (`admin_nav_api`). Open to anyone within the rate limit — no credentials.
6. `docs/api.md` — endpoints, query params, language handling, rate limits, admin controls; explicitly documents that the API is open & free (no paywall).

## Files to add/modify

- `db/migrations/0030_api_ip_controls.sql` (new)
- `src/lib/server/api-ratelimit.ts` (new)
- `src/lib/server/api-ip-controls.ts` (new — Turso CRUD for `api_ip_controls`, reuse `stores.ts` pattern)
- `src/routes/api/v1/whiskies/+server.ts` (list), `src/routes/api/v1/whiskies/[slug]/+server.ts` (single), `src/routes/api/v1/origins/+server.ts`, `src/routes/api/v1/distilleries/+server.ts` (new)
- `src/routes/api/admin/api-ip-controls/+server.ts` (new)
- `src/routes/admin/api/+page.svelte` + `+page.server.ts` (new)
- `src/routes/admin/+layout.svelte` — `admin_nav_api` nav entry
- `messages/{en,es,pt,fr,ja}.json` — `admin_nav_api` + `admin_api_*` / `api_*` strings
- `docs/api.md` — new: endpoints, filters, language handling, rate limits, admin controls
- `tests/api.test.ts` — endpoint smoke tests + 429 beyond limit

## Acceptance criteria

- [x] Four endpoints respond with JSON from the runtime data files (no Turso query)
- [x] `?country=`, `?distillery=`, `?q=`, `?lang=` filters work on the whiskies list
- [x] Single-product endpoint includes full localized fields and influencer videos
- [x] Origins and distilleries lists are localized
- [x] Requests over the rate limit return `429` with the standard error shape; blocked IPs return `403`
- [x] Admin can view live usage stats and block/unblock IPs + set per-IP limits; nav + messages present in all locales
- [x] `docs/api.md` documents all endpoints, filters, language handling, rate limits, and admin controls
- [x] Routes don't conflict with the existing `[slug]` catch-all (verified at build)
- [x] `npm run build`, `npm run check`, `npm run test` succeed

## Progress

- 2026-09-23 (big-pickle): Created. Open/free public API read from exported build-time JSON. Owner cancelled 065 (API paywall) + 066 (plans page) — no consumer credentials, no pricing. Admin usage control (monitor + IP block/limit overrides) replaces the cancelled paywall's credential management. Task work starts here.
- 2026-09-23 (big-pickle): FINAL. Shipped `0030_api_ip_controls.sql` (applied to Turso), `api-ratelimit.ts` (sliding window, default 60 req/min) + `api-ip-controls.ts` CRUD, four `/api/v1/*` handlers, `/api/admin/api-ip-controls` + `/admin/api` usage page with nav + messages in en/es/pt/fr/ja, `docs/api.md`, `tests/api.test.ts`. Removed the `utils/origins` import (would break node-env tests via a `.svelte` store) — inlined `originKeyOf()`. Verification: db:sync applied 0030, 102 tests pass, `npm run check` 0 errors / 29 pre-existing warnings, build OK (route precedence confirmed — static `api/v1` prefix wins over `[slug]`).
- 2026-09-23 (big-pickle): POST-DONE restructure: public routes moved `/api/v1/*` → `/api/v1/public/*` (external data never mixed with frontend `/api/*` or admin `/api/admin/*`); rate-limit labels/tests/docs updated. Added seeded public `api` docs page (localized, slug `api` served by the `[slug]` CMP) + footer link (`nav_api` message in all locales).
