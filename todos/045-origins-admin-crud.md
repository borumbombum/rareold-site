Status: DONE

# Origins: administrable via admin panel with DB as source of truth

## Context

Origins (countries) are currently hardcoded in `ORIGIN_META` in `db-sync.mjs` and seeded into Turso via `npm run db:sync` with `ON CONFLICT DO NOTHING`. There is no admin UI to manage them — adding or editing an origin requires direct SQL. The user wants full CRUD for origins in the admin panel, following the same pattern as products (DB as source of truth → JSON export → frontend consumption). Everything should keep working exactly as before.

## Current state

- `ORIGIN_META` in `scripts/db-sync.mjs` — hardcoded 8 origins with localized names and flags
- `origins` table in Turso — seeded by db-sync, `ON CONFLICT DO NOTHING` (safe for admin edits)
- `src/lib/data/origins.json` — build-time export consumed by `origins.ts`, `OriginFilters.svelte`, admin product form, drawer
- Admin product form reads origins from `origins.json` for the origin dropdown
- No admin CRUD for origins themselves

## Requirements

### 1. Admin page (`/admin/origins`)

- List all origins in a table: flag, id, name (English), localized names, sort order, product count
- Product count derived from joining with products table
- Sortable by name, sort_order, product count
- Actions: Edit, Delete (with confirmation)
- "Add Origin" button → opens create form

### 2. Origin form

- **id** (slug): text input, required, unique (e.g. "scotland", "taiwan")
- **name** (English canonical): text input, required
- **Localized names**: `name_es`, `name_pt`, `name_en`, `name_ja`, `name_fr` — text inputs (empty = fallback to `name`)
- **flag**: text input for emoji (e.g. "🏴󠁧󠁢󠁳󠁣󠁴󠁿"), with preview
- **sort_order**: number input (determines display order in filters/drawer)
- Validation: id must be unique, name required

### 3. API endpoints (`/api/admin/origins`)

- `GET ?productId=xx` — list all origins (optionally with product count)
- `GET ?id=xx` — get single origin
- `PUT` body: `{ id, name, name_es, name_pt, name_en, name_ja, name_fr, flag, sort_order }` — create or update (upsert)
- `DELETE` body: `{ id }` — delete origin (only if no products reference it; show error if products exist)

### 4. Server code (`src/lib/server/`)

- Add `origins.ts` server module:
  - `listOrigins()` — all origins sorted by sort_order, with product count
  - `getOriginById(id)` — single origin
  - `upsertOrigin(input)` — insert/update
  - `deleteOrigin(id)` — delete (check for product references first)
- Update existing code that reads origins from static JSON to use the server module where appropriate (admin pages)
- Frontend continues reading from `origins.json` export (no change to consumer pattern)

### 5. Navigation

- Add "Origins" link to admin navigation bar (between Products and Reviews, or after Products)
- Icon: `Globe` from lucide

### 6. Export pipeline

- `scripts/db-export.mjs` already exports origins from Turso → no changes needed
- Admin edits flow: admin UI → Turso → `npm run data:export` → `origins.json` → frontend

### 7. Seed behavior (no change)

- `ORIGIN_META` in `db-sync.mjs` stays as-is for first-time bootstrap
- `ON CONFLICT DO NOTHING` ensures admin edits are never overwritten by db-sync
- No changes to `db-sync.mjs` required

## Acceptance criteria

- `/admin/origins` page lists all origins with flag, name, product count
- Can create a new origin via admin form
- Can edit existing origin (name, localized names, flag, sort order)
- Can delete origin (only when no products reference it)
- Admin nav includes Origins link
- Existing origins work exactly as before (filters, drawer, origin pages, product form dropdown)
- `npm run db:sync && npm run data:export && npm run build` succeeds
- No regressions in any locale

## Progress

- 2026-08-22 (ox-alpha-v045): starting. Plan: follow the 043 pages-admin pattern (server module + /api/admin/origins GET/PUT/DELETE + /admin/origins table+form in house style); frontend keeps consuming origins.json export; db-sync bootstrap untouched.
- 2026-08-22 (ox-alpha-v045): DONE. Migration `0023_origins_name_en.sql` (applied to Turso + registered in schema_migrations — manual applications MUST be registered there or db:sync fails with duplicate column); `src/lib/server/origins.ts` (listOrigins w/ product_count LEFT JOIN, getOriginById, upsertOrigin, deleteOrigin guarded against products/distilleries(country)/regions refs); `/api/admin/origins` GET/PUT/DELETE; `/admin/origins` table (sortable name/order/count, translation badges, flag preview form, id immutable after create) + nav link after Products; db-export.mjs now exports name_en; all 5 locales translated. **Security fix:** found that `await getAdmin(cookies)` as a bare statement was a no-op guard (getAdmin returns null, never throws) — /api/admin/pages (043) and /api/admin/downloads (044) were publicly readable/writable; fixed both to the `if (!(await getAdmin(cookies))) return json({ error: 'forbidden' }, { status: 403 })` pattern used by products/distilleries/users; verified 403 via preview smoke test. Verified: check 0 errors, 89/89 tests (new origins.test.ts), db:sync+data:export+build pass.
