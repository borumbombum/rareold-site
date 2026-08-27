Status: [DONE]

# Remove PUBLIC_BASE_URL — auto-detect the origin instead

## Context

`PUBLIC_BASE_URL` is a build-time env var used only for OAuth: it builds the Google callback `redirect_uri` and decides the cookie `Secure` flag. That's overkill — every server route already knows its own request origin via `event.url.origin`, and on Vercel the `Host` header is validated, so the origin is trustworthy. Google's exact-match "Authorized redirect URIs" check is the real backstop.

The user hit `400 redirect_uri_mismatch` on local login; the cause was that the callback URL sent (`http://localhost:5173/api/auth/callback`) wasn't registered in the Google OAuth client's Authorized redirect URIs. Removing the env var makes the sent URL always match the request host; the user registers each environment's exact callback URL in the console.

## Requirements

1. `login/+server.ts`: `redirectUri = url.origin + '/api/auth/callback'`; pass `secure: url.protocol === 'https:'` to `setAuthStateCookie`.
2. `callback/+server.ts`: same derivation for the token exchange (Google bounces to exactly the URI sent, so origins match).
3. `mock/+server.ts`: pass `secure` to `setSessionCookie`.
4. `session.ts`: `setSessionCookie(cookies, token, secure)` / `setAuthStateCookie(cookies, value, secure)` take `secure: boolean`; remove the `env.baseUrl`-based `secure()` helper and the `env` import.
5. `env.ts`: remove `baseUrl` and the `PUBLIC_BASE_URL` import.
6. Delete `PUBLIC_BASE_URL` from `.env` and `.env.example` (fix the comment referencing `{PUBLIC_BASE_URL}`).
7. Tests: `tests/helpers/env-static-public.ts` drop the export; `tests/session.test.ts` pass `false` as `secure`.
8. README: Auth section + env table — callback is auto-detected as `https://<your-domain>/api/auth/callback`; remove the env row.

## Acceptance criteria

- No `PUBLIC_BASE_URL` / `env.baseUrl` references remain in the repo.
- `/api/auth/login` sends `redirect_uri` derived from the request origin (no env var needed).
- Cookie `Secure` flag follows the request protocol (true on https, false on http dev).
- `npm run check` passes; `npm test` passes; `npm run build` works.
- Dev smoke: login redirect URI is `http://localhost:5173/api/auth/callback` with no `PUBLIC_BASE_URL` in `.env`.

## Progress

- 2026-08-15 (opencode): Started. Next: route changes, session/env cleanup, tests, README, verify.
- 2026-08-15 (opencode): Implemented. `login/+server.ts`, `callback/+server.ts` derive the redirect_uri from `url.origin`; `mock/+server.ts` and `callback/+server.ts` pass `secure: url.protocol === 'https:'` to the cookie setters. `session.ts`: `setSessionCookie(cookies, token, secure)` / `setAuthStateCookie(cookies, value, secure)`; removed the `env.baseUrl`-based `secure()` helper and the `env` import. `env.ts`: dropped `baseUrl` + the `PUBLIC_BASE_URL` import. Removed `PUBLIC_BASE_URL` from `.env` and `.env.example`; removed its export from `tests/helpers/env-static-public.ts`; `tests/session.test.ts` passes `false`/`true` as `secure`. README Auth section + env table now say the callback is auto-detected (`https://<your-domain>/api/auth/callback`) and there is no `PUBLIC_BASE_URL`. Next: verify.
- 2026-08-15 (opencode): Verified. `npm run check` 0 errors (9 pre-existing warnings), `npm test` 43/43, `npm run build` OK. Dev smoke: `/api/auth/login` → 302 to Google with `redirect_uri=http://localhost:5173/api/auth/callback` auto-detected (no env var in `.env`); `/api/auth/mock` sets `rareold.session` httpOnly/SameSite=Lax/30d, no Secure on http. Grep confirms no `PUBLIC_BASE_URL`/`env.baseUrl` references remain in code. Note: multiple stale dev servers fight over `.svelte-kit` (caused a transient ENOENT on paraglide's generated `proxy+page.server.ts`); fixed by killing all and running `svelte-kit sync`. Done.
