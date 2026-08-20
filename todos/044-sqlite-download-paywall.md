Status: TODO

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
