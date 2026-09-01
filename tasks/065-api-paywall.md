Status: [TODO]

# API Paywall + Consumer Credentials (2 yearly tiers)

## Context

Task 064 builds an open, read-only JSON API. This task adds the paywall: API access requires a per-consumer Basic Auth credential that the admin creates and enables. The API is sold in **2 tiers**: **$19/year** (yearly-billed, standard rate limit) and **$99 lifetime** (one-time, higher rate limit). The admin enables a consumer once payment is received (out-of-band — payment method still TBD, possibly Stripe/Bitcoin, so keep the swap-friendly pattern from 044) and can `disabled` them to block access. Consumers use a simple `user:password` token for Basic Auth.

This builds directly on the endpoints and rate limiter from 064. The pricing tiers are described on the `/database` page (task 066), which will expose the sign-up/request flow that feeds this admin consumer creation.

## Requirements

1. **DB migration** `db/migrations/0027_api_consumers.sql`:
   ```
   api_consumers(
     id              TEXT PRIMARY KEY,
     username        TEXT NOT NULL UNIQUE,
     password_hash   TEXT NOT NULL,
     plan            TEXT NOT NULL DEFAULT 'yearly',  -- yearly | lifetime
     expires_at      TEXT,                            -- null for lifetime, 1 year after enable for yearly
     status          TEXT NOT NULL DEFAULT 'pending',  -- pending | active | disabled
     created_at      TEXT NOT NULL DEFAULT (datetime('now')),
     last_used_at    TEXT,
     updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
   )
   ```
2. **Backend auth** `src/lib/server/api-keys.ts`:
   - Parse `Authorization: Basic base64(user:pass)` from `getClientAddress`/request headers
   - Look up consumer by username, hash password (sha256, reuse `downloads.ts` `createHash` pattern) and compare
   - Grant access only when `status === 'active'` **and** (`plan === 'lifetime'` or `expires_at > now`)
   - Track `last_used_at` on successful auth
   - Rate limiter keyed by username (in addition to IP from 064); limit per plan (standard for `yearly`, higher for `lifetime`)
3. **Gate the 064 endpoints**: a guard applied to all `/api/v1/*` handlers. Without valid active Basic Auth credentials → `401` (with `WWW-Authenticate: Basic`). Rate-limit exceeded → `429`.
4. **Admin UI + API**:
   - `src/routes/api/admin/consumers/+server.ts` — `GET` list, `POST` create (auto-generate a strong `username` and `password`), `PUT` update (toggle `status` active/disabled, set `plan`, extend `expires_at`)
   - `/admin` page section listing consumers, creating new ones, and toggling active/disabled + plan
5. **Payment model** (still TBD by owner — could be Stripe/Bitcoin later): out-of-band for now. Admin marks a consumer `active` when payment is received and `disabled` to revoke. For `yearly` plan, admin sets plan/expires_at; expiry auto-blocks access. Design the toggle so a real billing provider can be swapped in later.
6. **Docs**: update `docs/api.md` with auth (Basic Auth), `WWW-Authenticate` behaviour, the payment/enable flow for admins, and how a consumer uses their credential. Document the $19/year vs $99 lifetime tiers.

## Files to add/modify

- `db/migrations/0027_api_consumers.sql`
- `src/lib/server/api-keys.ts` (new)
- `src/lib/server/admin.ts` or a new consumers module — CRUD for `api_consumers`
- `src/routes/api/admin/consumers/+server.ts` (new)
- `src/routes/api/v1/*` handlers — add the auth+paywall guard (from 064)
- `/admin` page — consumers management section
- `docs/api.md` — auth + payment flow + tiers
- `src/routes/database/+page.svelte` (from 066) — tier info + sign-up request that creates a `pending` consumer

## Acceptance criteria

- [ ] Migration creates `api_consumers` with `plan` and `expires_at`; DB sync applies it
- [ ] Admin can create a consumer and sees the generated `username`/`password` once
- [ ] Admin can toggle a consumer between `active` and `disabled` and set `yearly`/`lifetime`
- [ ] `active` `lifetime` consumers always pass; `active` `yearly` consumers block once `expires_at` passes
- [ ] `/api/v1/*` returns `401` + `WWW-Authenticate` without valid active Basic Auth
- [ ] Valid `active` consumer gets data; `disabled`/`pending`/wrong-password/expired gets `401`
- [ ] Rate limiter keys by username with higher limit for `lifetime`
- [ ] `last_used_at` updates on successful calls
- [ ] `docs/api.md` documents auth, the admin enable-on-payment flow, and the two tiers

## Progress

- 2026-09-01: Updated payment model from one-time fee to 2 tiers ($19/year yearly-billed vs $99 lifetime). Added `plan` + `expires_at` columns, per-plan rate limits, and expiry auto-block. Payment method still TBD (owner may accept Bitcoin/Stripe later) — kept out-of-band admin-gated flow from 044. Supersedes the earlier one-time-fee model.
