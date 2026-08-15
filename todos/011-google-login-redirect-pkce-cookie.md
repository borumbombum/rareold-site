Status: DONE

# Google login with redirect (PKCE) and httpOnly cookie session

## Context

Login currently uses Google One-Tap / GSI popup: the GSI script (`src/lib/utils/google.ts`) prompts in-page, returns an ID token to the page, the page POSTs it to `/api/auth/google`, and the resulting JWT is stored in **localStorage** (`rareold.session`) and sent as `Authorization: Bearer` by `VoteButton`/`ReviewSection`.

The user wants the standard **redirect flow** instead (no in-page popup): click login → leave the app to Google → back with an authorization code → exchange server-side → session restored → back to the page you were on. Decisions confirmed with the user:

- **httpOnly cookie session** (token never exposed to JS) — move away from localStorage.
- **PKCE** (S256) for the code exchange — no `GOOGLE_CLIENT_SECRET` needed; reuses the existing public Client ID.
- Google Console still requires adding `{PUBLIC_BASE_URL}/api/auth/callback` to the OAuth client's **Authorized redirect URIs** (the Client ID alone is not enough). Documented in README.

## Requirements

- `GET /api/auth/login?next=<path>` — validate `next` (internal path only), generate random `state` + PKCE `code_verifier`/`code_challenge`, store `{state, next, verifier}` in a short-lived httpOnly `rareold.auth_state` cookie, `302` redirect to `https://accounts.google.com/o/oauth2/v2/auth` (scope `openid email profile`, `prompt=select_account`).
- `GET /api/auth/callback?code&state` — clear state cookie on `error=access_denied` (redirect back to `next`); reject state mismatch (400); exchange `code`+`code_verifier` for tokens via `https://oauth2.googleapis.com/token` (PKCE, form-encoded, no secret); verify the returned `id_token` with the existing `verifyGoogleToken()` (aud/iss/exp/email_verified); upsert the Turso user; issue our HS256 JWT into the httpOnly `rareold.session` cookie (30d); redirect to `next`.
- `GET /api/auth/me` — `{user}` (or `{user: null}`, 200) from the session cookie.
- `POST /api/auth/logout` — clear the session cookie.
- `POST /api/auth/mock` — demo login now sets the session cookie server-side, returns `{ok, user}` (token only in cookie).
- Session store (`session.svelte.ts`) — holds `user` only; `hydrate()` from SSR layout data; `clear()` calls `/api/auth/logout`; no localStorage, no client-side token.
- `src/routes/+layout.server.ts` — `load()` returns `{user}` from `getSessionUser(cookies)`; layout hydrates the store.
- `VoteButton`/`ReviewSection` — drop `Authorization: Bearer` headers (cookie auto-sent); keep `session.isAuthed` gating.
- `AuthButton.svelte` — Google button navigates to `/api/auth/login?next=<current path>`; demo button POSTs mock then `session.setUser`.
- Delete `src/routes/api/auth/google/+server.ts` and `src/lib/utils/google.ts` (GSI gone).
- Tests: PKCE math, `isSafeNext` open-redirect rejection, auth-URL params, `exchangeCode` (stubbed fetch), full `handleGoogleCallback` flow (test JWKS + `file::memory:` DB), session cookie helpers (`getSessionUser` valid/invalid/absent).

## Acceptance criteria

- Login is a full-page redirect to Google; no GSI script / popup / in-page prompt anywhere.
- Code exchange is PKCE-only; no client secret anywhere in env/README/README table.
- Session lives in an httpOnly cookie; JS never holds the token; vote/review endpoints authenticate from the cookie.
- `next` honored after login/logout-relevant flows; open redirects rejected.
- Zero references to GSI (`promptGoogleLogin`, `loadGoogleScript`, `/api/auth/google` POST) in src.
- `npm run check`, `npm test`, `npm run build` pass.

## Progress

- 2026-08-15 (opencode): Started. Building PKCE redirect flow + httpOnly cookie session per user's choices. Next: oauth.ts/session.ts, routes, client store/layout, README, tests, verify.
- 2026-08-15 (opencode): Implemented. `oauth.ts` (generatePkce S256, generateState, isSafeNext, buildAuthUrl, exchangeCode form-encoded PKCE with injectable fetch, handleGoogleCallback reusing loginWithGoogle); `session.ts` (SESSION_COOKIE/AUTH_STATE_COOKIE helpers, httpOnly Lax, Secure when baseUrl https, getSessionUser with injectable db). Routes: `/api/auth/login` (validates next, sets auth_state cookie, 302 to Google), `/api/auth/callback` (error=access_denied → back to next; state mismatch/missing code → 400; exchange → verify id_token → upsert → set session cookie → redirect next), `/api/auth/me`, `/api/auth/logout`; `/api/auth/mock` now sets the cookie. Deleted `/api/auth/google/+server.ts` + `src/lib/utils/google.ts` (GSI). Client: `session.svelte.ts` rewritten (user-only, hydrate/setUser, clear→POST /api/auth/logout, no localStorage); `+layout.server.ts` SSR-hydrates `{user}`; `+layout.svelte` hydrates store via $effect; `AuthButton` Google button → `location.assign('/api/auth/login?next=…')`, demo → mock+setUser; `/api/vote` + `/api/reviews` POST authenticate via `getSessionUser(cookies)` (Bearer gone). README + `.env.example` document the flow, PKCE (no secret), and the required Google Console Authorized redirect URI. Tests: `oauth.test.ts` (PKCE math, isSafeNext, buildAuthUrl, exchangeCode stub, handleGoogleCallback with test JWKS + in-memory DB, forged-token rejection) + `session.test.ts` (cookie opts, getSessionUser valid/invalid/absent, auth-state roundtrip). Next: verify.
- 2026-08-15 (opencode): Verified. `npm run check` clean, `npm test` 43/43 green, `npm run build` OK. Dev smoke: `/api/auth/login` → 302 to accounts.google.com with client_id/redirect_uri/state/code_challenge(S256)/prompt and httpOnly `rareold.auth_state` cookie carrying `next`; callback wrong-state → 400; `error=access_denied` → 302 back to `/whisky/macallan-18`; demo login sets session cookie, `/api/auth/me` returns the user, vote works with cookie only (no Bearer), no-cookie vote → 401, logout clears cookie, `/api/auth/me` → `{user:null}`; SSR page serializes the hydrated user (no login button). Zero GSI references left. Smoke rows cleaned from Turso. Done.
