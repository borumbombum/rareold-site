Status: [TODO]

# Public Read-only JSON API with Rate Limiting

## Context

We want our product data to be consumable by AI agents and other API consumers. The site's authoritative data lives in Turso and is exported to runtime build-time JSON (`src/lib/data/*.json`) via `npm run data:export`. This task builds an open, read-only HTTP API that serves that JSON — no auth, no payment — with a normal rate limit. A follow-up task (065) adds the paywall + per-consumer credentials.

Note: the `[slug]` endpoint name conflicts with the existing catch-all `src/routes/[slug]` — the task must confirm routing precedence (static `api/v1` prefix segments disambiguate, but verify) before finalizing paths.

## Requirements

1. Stand up a versioned read-only API namespace, e.g. `src/routes/api/v1/*`.
2. Endpoints serve from the runtime build-time JSON (`src/lib/data/*.json`), **never querying Turso**:
   - `GET /api/v1/whiskies` — full list. Supports:
     - `?country=` — filter by origin country (resolve against the product's origin, and/or distillery country)
     - `?distillery=` — filter by distillery (id or slug)
     - `?q=` — search by name/description
     - `?lang=` — resolve localized fields (default `en`), using existing l10n/originLabel helpers
   - `GET /api/v1/whiskies/[slug]` — single product, full localized fields **including influencer videos**
   - `GET /api/v1/origins` — origins list (localized)
   - `GET /api/v1/distilleries` — distilleries list (localized)
3. Responses are JSON, with a small envelope (e.g. `{ data: [...] }`) and consistent error shape (`{ error: string }`).
4. Shared in-memory sliding-window rate limiter keyed by client IP (normal limit, e.g. 60 req/min) applied to all `/api/v1/*` routes. Reuse the pattern from `src/routes/api/download/request/+server.ts` but centralised in one helper.
5. No auth/paywall in this task — open to anyone within the rate limit.

## Files to add/modify

- `src/lib/server/api-ratelimit.ts` — centralised in-memory sliding-window rate limiter + a guard helper returning 429
- `src/routes/api/v1/whiskies/+server.ts` (list), `src/routes/api/v1/whiskies/[slug]/+server.ts` (single), `src/routes/api/v1/origins/+server.ts`, `src/routes/api/v1/distilleries/+server.ts`
- `docs/api.md` — new: endpoints, query params, language handling, rate limits

## Acceptance criteria

- [ ] Four endpoints respond with JSON from the runtime data files (no Turso query)
- [ ] `?country=`, `?distillery=`, `?q=`, `?lang=` filters work on the whiskies list
- [ ] Single-product endpoint includes full localized fields and influencer videos
- [ ] Origins and distilleries lists are localized
- [ ] Requests over the rate limit return `429` with the standard error shape
- [ ] `docs/api.md` documents all endpoints, filters, language handling, and rate limits
- [ ] Routes don't conflict with the existing `[slug]` catch-all (verified at build)
