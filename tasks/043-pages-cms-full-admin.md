Status: [DONE]

# Pages CMS: full admin management with rich text editor

## Context

The pages CMS (`/admin/pages`) currently uses plain textareas for the body field. The user wants full admin management including a rich text editor (matching the product description Tiptap editor) and ensuring all CRUD operations work properly.

## Requirements

1. **Rich text editor**: Replace the plain `<textarea>` for page body fields with `TiptapEditor` component (already used in product admin for descriptions). This gives bold, italic, links, headings, lists, etc.

2. **All locales**: Ensure the form has fields for all 5 locales (es, en, pt, ja, fr) with both title and body (rich text) for each.

3. **CRUD verification**: Ensure create, read, update, delete all work via `/api/admin/pages`. Test edge cases: duplicate slugs, empty fields, long content.

4. **Preview**: Add a "Preview" button that opens the page in a new tab at `/<slug>` to see how it looks.

5. **List view improvements**: Show last updated date, word count, and locale completion status in the pages list table.

6. **Seed the about page** with French translation (if not already done in 034).

## Acceptance criteria

- Admin pages form uses TiptapEditor for body fields
- All 5 locale title+body fields are present
- Create/edit/delete work without errors
- Preview button opens the page in a new tab
- Pages list shows useful metadata
- `npm run build` succeeds

## Progress

- 2026-08-22 (ox-alpha-v043): starting. Reading current `/admin/pages` implementation, `TiptapEditor`, and `/api/admin/pages` to map the work.
- 2026-08-22 (ox-alpha-v043): API hardened — slug format validation (400), duplicate-slug pre-check returning clean 409 (DB has UNIQUE(slug) but it surfaced as raw 500 before), base title+body required (400).
- 2026-08-22 (ox-alpha-v043): Admin page rewritten — TiptapEditor for all 5 locale bodies (per-locale card with title input + editor, mirroring distilleries admin pattern), Preview ↗ button on saved pages opening `localizeHref('/'+slug)` in new tab, list rows now show updated date + word count + per-locale completion chips; save uses `invalidateAll()` so list metadata refreshes.
- 2026-08-22 (ox-alpha-v043): About page French translation confirmed present (title_fr "À propos", body_fr 725 chars) — requirement 6 already satisfied by earlier work.
- 2026-08-22 (ox-alpha-v043): Verified: new `tests/pages.test.ts` CRUD roundtrip on in-memory DB passes; full suite 83/83; `npm run check` 0 errors; `vite build` ✓. DONE.
- 2026-08-22 (ox-alpha-v043): Follow-up (user feedback): restyled `/admin/pages` to match house admin style — removed stray `max-w-4xl` wrapper (now full-width like products/distilleries/reviews/users), header row with count + Plus button, rounded-2xl form panel with X close and grid inputs, table view with lucide icon actions. Added localized message keys (admin_pages_*, admin_table_updated/words) to all 5 locales — previously hardcoded English. check/build ✓ again.

