Status: [TODO]

> **LAST TASK — DO NOT AUTO-PICK.** This migration runs ONLY when the project is considered
> otherwise finished (all other work done). It is the final task, deferred by owner instruction.
> Supersedes tasks 056–059.

# Local SQLite Migration — detach from Turso/Vercel, self-host with Docker + Cloudflare Tunnel

## Context

This is the **final task of the project**, deferred by the owner until all other work is finished.

The site's live data (auth, votes, reviews, favorites, users, downloads, origins, pages) is in
remote Turso, read at runtime over HTTP via `src/lib/server/turso.ts` (`@libsql/client`,
`createClient({ url, authToken })`). The catalog (whiskies, distilleries) is exported to build-time
JSON (`data:export` → `src/lib/data/*.json`) and statically imported client-side. The app deploys to
Vercel serverless (`adapter-vercel` in `vite.config.ts`).

067 migrates everything to a single self-hosted local SQLite database served from a long-lived Node
container, replacing both the remote Turso dependency and the Vercel deployment. The catalog moves
off the raw JSON monolith onto an efficient SQLite-backed search index. SQLite lives **outside** the
container on a bind-mounted volume so data persists across rebuilds/restarts.

This supersedes tasks 056–059 (sharding/splitting the build-time JSON); the catalog search/scaling
rationale is now served by a SQLite search index instead.

## Requirements

1. **Download Turso DB** (manual): export the remote Turso database to a local SQLite file. Restore
   schema (`db/migrations/*.sql`) and all row data into that file.
2. **sqlite3 driver**: connect the app to the local SQLite file. `@libsql/client` already supports
   `url: 'file:...'` (used in tests as `file::memory:`), so the least-invasive swap is pointing
   `TURSO_URL` at a local path and dropping `TURSO_AUTH_TOKEN`; alternatively adopt a native sqlite3
   driver (e.g. `node:sqlite` / `better-sqlite3`) if WAL/perf/pragmas demand it. All `Client`-typed
   server modules (auth, votes, reviews, favorites, users, downloads, origins, pages, admin) must
   keep working against the local file.
3. **Efficient catalog search index**: replace the raw client-side JSON catalog scan with an
   SQLite-backed search index (FTS5 on whisky/distillery/origin names + localized descriptions) so
   search/drawer/homepage scale beyond the current in-memory monolith. The catalog is served from
   the same persisted SQLite file.
4. **Adapter Node**: switch `adapter-vercel` → `adapter-node` so the app runs as a persistent Node
   process (a serverless function cannot hold an open, writable SQLite file safely).
5. **Docker Compose + Cloudflare Tunnel** (homelab / local server):
   - `Dockerfile` (multi-stage build → run).
   - `docker-compose.yml`: app service + a `cloudflared` service, or host-level tunnel, mapping the
     domain to the app port.
   - **Persistent volume**: the SQLite file (and file uploads/downloads dir if any) bind-mounted at
     a host path outside the container (`./data:/app/data`), e.g. for votes, auth sessions, reviews.
6. **Env/secrets**: move Vercel/Turso env (`.env`) to the compose env; keep Google OAuth + AUTH_SECRET.
7. **Docs**: update README/deploy docs. This is the final migration task — run only when the project
   is otherwise considered finished.

## Acceptance criteria

- [ ] Local SQLite file has the full Turso schema + data; app runs against it with no Turso/network call
- [ ] Live data (votes, favorites, reviews, auth, downloads) reads/writes the persistent volume correctly
- [ ] Search/drawer/homepage use the SQLite-backed search index, not the raw JSON monolith
- [ ] Runs under `adapter-node` in Docker; `docker compose up` serves the site through the tunnel
- [ ] SQLite file survives a container rebuild/restart (bind-mounted)
- [ ] All tests pass; `npm run check` + `npm run build` succeed

## Progress

- 2026-09-03 (big-pickle): Task created. **Deferred to project completion — do not auto-pick.** Supersedes
  056–059 (JSON sharding/split) — those marked DONE/superseded. Full spec to be finalized when started.
