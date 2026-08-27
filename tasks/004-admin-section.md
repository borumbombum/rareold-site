Status: [DONE]

## Progress

- 2026-08-15 — Implemented: db-sync now insert-only (`ON CONFLICT DO NOTHING`, Turso = sole source of truth; AGENTS.md Localization section updated); `src/lib/server/admin.ts` (guard `getAdmin` + product CRUD + reviews + stats + users, db-last); `/api/admin/{products,reviews,stats,users}` endpoints all server-verified admin (403 for non-admins, self-demote blocked); `/admin` layout (server redirect guard) + dashboard/products/reviews/users pages (hardcoded English, plain admin UI per task allowance); `tests/admin.test.ts`. No session redesign needed — `rareold.session` is already an httpOnly cookie, so SSR pages read the user via `getSessionUser`.
- Verified: `npm run check` 0 errors (14 warnings, pre-existing pattern), `npm test` 51/51, `npm run build` OK (db:sync insert-only, data:export 156 whiskies).

# Admin section (role-gated, Google login only)

## Context

After task `002`, auth is fully ours: users live in Turso `users` with a `role` column (id = Google sub), we issue our own JWT signed with `AUTH_SECRET`, votes/reviews/karma are Turso-backed, and Google is the only login. `UserData.role` already exists (`src/lib/types.ts:207`).

Admins are designated directly in Turso — `UPDATE users SET role='admin' WHERE email=...`. There is no `ADMIN_EMAILS` env var; the first admin must be set manually in Turso, and subsequent admins via the admin user management UI.

No admin routes exist today; the route tree is `/`, `/whisky/[slug]`, `/api/*`, `/data/images/[file]`.

## Requirements

### Access control

- New `/admin` route with a protected layout.
- Server-side guard: verify our JWT and look up the user's `role` in Turso `users`; anonymous or non-admin → 403/redirect to home. Gate the client UI on the session user's role as well.
- Every admin data endpoint is a `+server.ts` API that verifies the JWT + `role = 'admin'` server-side and rejects forged/garbage tokens (401/403).
- Login remains Google-only (reuses the `002` flow).
- Decide how the token reaches SSR admin pages: the current session is a localStorage Bearer token. Either set an httpOnly cookie at login or keep admin pages client-gated with all data operations going through the server-verified admin APIs.

### Product management

- CRUD products against Turso `products` (plus origins/regions/categories when applicable).
- Admin edits must survive the next `db:sync`, which today upserts `data/seed/whiskies.json` over Turso rows. Reconcile so the seed does not clobber admin changes (e.g. seed becomes insert-only for products, or admin changes sync back into the seed).

### Review moderation

- List reviews from Turso `reviews` (filterable by product/country) and delete them.

### Rankings / stats

- View `karma` / `votes` aggregates, top products, and vote counts from Turso.

### User management

- List `users` and promote/demote `role` (`admin` / `user`). This is the mechanism for adding admins beyond the first manual Turso update.

### UI

- Tailwind classes only, reusing existing component/store conventions. Minimal and fast. Use Paraglide es/pt messages if cheap to wire; otherwise a plain admin UI is acceptable.

## Acceptance criteria

- Google-login admin reaches `/admin`; anonymous and non-admin users are blocked server-side.
- Every admin action is verified end-to-end; forged/garbage tokens rejected.
- Product edits persist in Turso and are not clobbered by the next `db:sync`.
- Reviews are deletable; rankings/stats are accurate; user roles are updatable.
- `npm run check` passes; `npm run build` works.

## Progress

