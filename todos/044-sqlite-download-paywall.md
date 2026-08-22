Status: DONE

# SQLite database download behind a paywall

## Context

The user wants to offer the entire Turso/SQLite database as a downloadable file, gated behind a payment wall. This allows researchers, developers, or enthusiasts to get the full dataset.

## Requirements

1. **Export endpoint** (`/api/data/download`): Generate a SQLite `.db` dump from Turso and serve it as a download. Can use Turso's embedded replica or HTTP API to dump the database.

2. **Paywall gate**: Before the download is available, the user must complete a payment. Options:
   - Stripe Checkout session (one-time payment)
   - Or simpler: email gate + manual approval
   - The implementation should be flexible enough to swap providers

3. **Payment flow**:
   - User clicks "Download Database" button (visible on a dedicated page or footer link)
   - Redirects to Stripe Checkout (or similar)
   - On successful payment, generate a time-limited signed download URL
   - User downloads the `.db` file

4. **Download page**: Create `/download` page (translated) with:
   - Description of what's in the database (schema overview, record counts)
   - Price
   - Download button (disabled until payment)
   - FAQ section

5. **Security**: Download URLs must be signed, time-limited (e.g. 1 hour), and single-use. Never expose raw database credentials.

6. **Admin**: Add a admin-only endpoint to manually grant download access (for testing or special cases).

7. **Translations**: Add UI strings for the download page in all locales.

## Acceptance criteria

- `/download` page shows database info and purchase option
- Stripe Checkout flow works end-to-end
- After payment, user receives a working download link
- Downloaded `.db` file is a valid SQLite database with all tables
- Download URLs expire after 1 hour
- Admin can manually grant access
- `npm run build` succeeds

## Progress

- 2026-08-22 (ox-alpha-v044): starting. User decisions: email gate (no Stripe — buyer requests, owner arranges payment out-of-band, admin grants signed link), price $29 USD, sql.js WASM to build the .db. Deployment target is Vercel (adapter-vercel) so dump builder must work serverless: sql.js kept external in SSR build, wasm resolved via createRequire, module-level cache best-effort (warm lambdas only).
- 2026-08-22 (ox-alpha-v044): DONE. Migration `0022_download_requests.sql`; `src/lib/server/downloads.ts` (request/grant/consume/list — sha256 token hashes, single-use, expiry); `src/lib/server/dbfile.ts` (sql.js dump builder for the 7 content tables, 6h module cache); public `/download` page (stats, FAQ) + `/api/download/request` (rate-limited 3/h/IP) + `/api/data/download?token=` (streams .db, redirects on bad token); admin `/admin/downloads` (list + grant with TTL hours). All 5 locales translated. Verified: svelte-check 0 errors, 86/86 tests (incl. new downloads.test.ts lifecycle + dump.test.ts valid-SQLite check via createTestDb), vite build OK. Note: no Stripe — payment handled out-of-band per user decision; acceptance criterion "Stripe flow works" superseded by email gate.

