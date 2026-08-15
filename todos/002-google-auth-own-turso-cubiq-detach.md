Status: DONE

# Own Google auth in Turso and full Cubiq detach

## Context

Google login currently goes through the Cubiq API: `POST /api/auth/google` forwards the Google ID token to `cubiq.googleLogin` (`src/lib/server/cubiq.ts:80`), which returns a Cubiq `access_token` + user. `POST /api/vote` and `POST /api/reviews` pass that token back to Cubiq, which verifies it server-side (`api/vote/+server.ts:30`, `api/reviews/+server.ts:43`).

We want auth fully ours: verify the Google ID token locally, store users in Turso (new migration), issue our own signed JWT, and implement it in our own `+server.ts`. Once auth is ours, detach everything Cubiq.

This task supersedes the old `002-live-voting-scores-after-page-load` todo: karma/votes/reviews move from the in-memory mock (`src/lib/server/mock-data.ts`) to Turso as part of the detach, and scores are fetched live after page load with rankings updating immediately on vote/comment.

## Requirements

### Own Google auth

- New migration (next number, `0006_users.sql`): `users` table — `id` (Google sub), `email`, `name`, `avatar`, `role`, `login_type`, `created_at`, `updated_at`. Idempotent/additive per `db-sync` conventions.
- Verify the Google ID token locally with `jose` (`jwtVerify` against Google JWKS from `https://www.googleapis.com/oauth2/v3/certs`): check `aud` === `PUBLIC_GOOGLE_CLIENT_ID`, `iss`, `exp`.
- Upsert the user into Turso from the verified claims (no duplicates).
- Issue our own JWT access token signed with a new `AUTH_SECRET` env var (add to `.env.example`, README env table, Vercel). Claims: `sub` = user id, `iat`, `exp` (~30d).
- `POST /api/auth/google` returns the same `{ access_token, user }` shape so `AuthButton.svelte` keeps working unchanged. Google One-Tap client (`src/lib/utils/google.ts`) stays as is.

### Votes / reviews / karma in Turso (old task 002)

- `POST /api/vote`: verify our JWT, extract `user_id`, upsert into Turso `votes`, recompute/update the `karma` row.
- `GET/POST /api/reviews`: read/write Turso `reviews`.
- Karma map served from Turso instead of `mockKarmaMap` (`src/lib/server/data.ts` -> `getKarmaMap`); client fetches live scores after page load and rankings update immediately when a logged-in user comments and votes.
- Demo login keeps working but writes to Turso (demo user id); remove `mock-data.ts` and the `mock.` token branch. Turso runtime access is limited to live data only — catalog stays build-time JSON.

### Remove Cubiq entirely

- Delete `src/lib/server/cubiq.ts`.
- Drop `CUBIQ_APP_ID`, `CUBIQ_ACCESS_TOKEN`, `CUBIQ_SITE_ID_UY`, `CUBIQ_SITE_ID_BR` from `.env`, `.env.example`, and `src/lib/server/env.ts` (remove `siteId` from the `sites` config too).
- Update `README.md`: runtime Turso usage, `AUTH_SECRET`, no Cubiq.

## Acceptance criteria

- Google One-Tap login verifies the ID token locally (jose) and returns our own JWT + Turso-persisted user.
- Votes/reviews/karma read/write Turso; voting/commenting updates rankings immediately; scores fetched live after page load.
- Forged/garbage tokens rejected with 401; valid our-JWT yields the `user_id`.
- Zero `cubiq` references in source (src, env, README, .env.example, package scripts).
- `npm run check` passes; `npm run build` works.

## Progress

- 2026-08-14 (opencode): Started. Plan approved: own Google auth (jose + users table in Turso, own JWT via AUTH_SECRET), votes/reviews/karma to Turso, new /api/karma for client after-load refresh, full Cubiq removal, Vitest tests. Next: install deps (jose, vitest), write migration 0006_users.sql, rework env/turso/auth/data/routes, then verify (db:sync, data:export, check, build, tests).
- 2026-08-14 (opencode): Implemented. jose + vitest installed; `0006_users.sql` migration (users table, applied to Turso). New server layer: `turso.ts` (runtime client), `users.ts`, `votes.ts` (applyVote upsert + karma recompute, getKarmaMap ranked), `reviews.ts` (Turso reads/writes, user-name join), `auth.ts` rewritten (jose local JWKS verification of Google ID token with aud/iss/exp/email_verified checks; own HS256 JWT via AUTH_SECRET, 30d; getAuthedUser/loginWithGoogle/loginWithDemo). Routes: `/api/auth/google` + `/api/auth/mock` (own auth, same `{access_token, user}` shape), `/api/vote` (401 on AuthError, karma!==0 validation), `/api/reviews` GET/POST, new `/api/karma?slugs=` (no-store). `data.ts` reworked: `getKarmaMap(slugs)` cached 60s, `getReviews(productId, country)` cached 300s, invalidateKarma/invalidateReviews. Page loads + onMount fetch wired for live karma; `karma.svelte.ts` gained `refresh`. Deleted `cubiq.ts` + `mock-data.ts`; CUBIQ_* and siteId removed from env/`.env`/`.env.example`; types slimmed. README updated (runtime Turso only for live data, own auth, AUTH_SECRET, no Cubiq). Tests added (`vitest.config.ts` with $env mocks + file::memory: test DB, 26 tests across auth/users/votes/reviews). db-last optional `db: Client` param convention adopted for injectability. Next: verify.
- 2026-08-14 (opencode): Verified. `npm run check` clean (0 errors), `npm test` 26/26 green, `npm run build` OK, `npm run db:sync` applied 0006 (users table live, columns confirmed), `npm run data:export` re-exported, `npm run dev` smoke test passed: mock login → JWT, vote + reviews + karma all read/write Turso, forged/missing tokens → 401, SSR renders karma. Zero cubiq references in src. Smoke-test rows cleaned from Turso. Done.

