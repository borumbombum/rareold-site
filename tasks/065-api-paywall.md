Status: [TODO]

# API Paywall + Consumer Credentials

## Context

Task 064 builds an open, read-only JSON API. This task adds the paywall: API access requires a per-consumer Basic Auth credential that the admin creates and enables. The consumer pays a one-time fee to access the API; the admin flips the consumer to `active` once paid and can `disabled` them to block access. Consumers generate/use a simple `user:password` token for Basic Auth.

This builds directly on the endpoints and rate limiter from 064.

## Requirements

1. **DB migration** `db/migrations/0027_api_consumers.sql`:
   ```
   api_consumers(
     id              TEXT PRIMARY KEY,
     username        TEXT NOT NULL UNIQUE,
     password_hash   TEXT NOT NULL,
     status          TEXT NOT NULL DEFAULT 'pending',  -- pending | active | disabled
     created_at      TEXT NOT NULL DEFAULT (datetime('now')),
     last_used_at    TEXT,
     updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
   )
   ```
2. **Backend auth** `src/lib/server/api-keys.ts`:
   - Parse `Authorization: Basic base64(user:pass)` from `getClientAddress`/request headers
   - Look up consumer by username, hash password (sha256, reuse `downloads.ts` `createHash` pattern) and compare
   - Grant access only when `status === 'active'`
   - Track `last_used_at` on successful auth
   - Rate limiter keyed by username (in addition to IP from 064)
3. **Gate the 064 endpoints**: a guard applied to all `/api/v1/*` handlers. Without valid active Basic Auth credentials → `401` (with `WWW-Authenticate: Basic`). Rate-limit exceeded → `429`.
4. **Admin UI + API**:
   - `src/routes/api/admin/consumers/+server.ts` — `GET` list, `POST` create (auto-generate a strong `username` and `password`), `PUT` update (toggle `status` active/disabled)
   - `/admin` page section listing consumers, creating new ones, and toggling active/disabled
5. **Payment model**: one-time fee. Admin marks a consumer `active` when payment is received and `disabled` to revoke. No recurring/expiry tracking needed yet.
6. **Docs**: update `docs/api.md` with auth (Basic Auth), `WWW-Authenticate` behaviour, the payment/enable flow for admins, and how a consumer uses their credential.

## Files to add/modify

- `db/migrations/0027_api_consumers.sql`
- `src/lib/server/api-keys.ts` (new)
- `src/lib/server/admin.ts` or a new consumers module — CRUD for `api_consumers`
- `src/routes/api/admin/consumers/+server.ts` (new)
- `src/routes/api/v1/*` handlers — add the auth+paywall guard (from 064)
- `/admin` page — consumers management section
- `docs/api.md` — auth + payment flow

## Acceptance criteria

- [ ] Migration creates `api_consumers`; DB sync applies it
- [ ] Admin can create a consumer and sees the generated `username`/`password` once
- [ ] Admin can toggle a consumer between `active` and `disabled`
- [ ] `/api/v1/*` returns `401` + `WWW-Authenticate` without valid active Basic Auth
- [ ] Valid `active` consumer gets data; `disabled`/`pending`/wrong-password gets `401`
- [ ] Rate limiter keys by username
- [ ] `last_used_at` updates on successful calls
- [ ] `docs/api.md` documents auth and the admin enable-on-payment flow
