Status: [DONE]

# Admin-managed pages (CMS) with an About us page

## Context

The site needs administrable content pages: created/edited by admin users in the `/admin` section,
rendered publicly. The first page is an **"About us"** page, localized for all current locales (es =
`baseLocale`, pt; `us` arrives in task 010). It is linked from the **desktop header to the right of
the search bar**, and the desktop search bar should also expand (become wider). Mobile: desktop header
only — no drawer entry.

Per owner decisions:
- Content pipeline: **build-time JSON export** (same as products: Turso → `npm run data:export` →
  `src/lib/data/pages.json` → build). Admin edits require re-export + redeploy before appearing live.
- URL: **shared slug `about`** across locales, localized via the existing Paraglide route-translation
  pattern (`/about` for es, `/br/about` for pt) — no per-locale slug columns.
- Body format: rich HTML authored with the existing Tiptap editor (matches product descriptions).

## Requirements

1. **Migration** `db/migrations/0010_pages.sql`:
   - `pages` table: `id TEXT PRIMARY KEY`, `slug TEXT NOT NULL UNIQUE`, `title TEXT NOT NULL DEFAULT ''`
     (base = es), `body TEXT NOT NULL DEFAULT ''` (Tiptap HTML, base = es), `title_pt TEXT`,
     `body_pt TEXT`, `created_at` and `updated_at` (ISO strings).
   - Future locales add `<field>_us` columns via a later migration (task 010), following the
     `0005_localized_content.sql` pattern.

2. **Bootstrap seed** `data/seed/pages.json`:
   - Contains the initial `about` page with localized `title`/`body` for es and pt.
   - Wired into `scripts/db-sync.mjs` with `ON CONFLICT DO NOTHING` (bootstrap-only; Turso is the
     source of truth, later edits happen via `/admin`).
   - Every seeded page must include `body_pt` (localized-content pass, like products' `description_pt`).

3. **Export** `scripts/db-export.mjs`:
   - Export `pages` → `src/lib/data/pages.json`. Missing/empty `body_pt` for a page fails the export
     (mirror the products check for `description_pt`).

4. **Content resolution**: `src/lib/utils/l10n.ts` `l10n(item, field)` already resolves
   `<field>_<locale>` with base fallback — reuse for title/body (no new localization code).

5. **Public routing** — Paraglide route translation:
   - `src/routes/[slug]/+page.server.ts`: loads the page by slug from `$lib/data/pages`, returns 404
     if missing. Existing static routes take precedence, and the existing `reroute` hook de-localizes
     locale prefixes, so `/about` (es) and `/br/about` (pt) both resolve to slug `about` — the
     standard Paraglide Vite route-translation pattern, no extra config.
   - Render: `<svelte:head>` with the localized `title`; `{@html body}` using the same child-styling
     utility classes as the whisky detail page (`[&_p]:…` etc.).

6. **Admin section**:
   - `src/routes/admin/pages/+page.svelte`: table of pages (slug, titles, updated_at) with
     new/edit/delete actions.
   - Edit form: slug input + stacked full-width fields per locale (title input + `TiptapEditor` for
     body), driven by a `LOCALE_FIELDS` list like the products form's `LOCALE_DESCRIPTIONS`.
   - `src/routes/api/admin/pages/+server.ts`: CRUD behind the existing `getAdmin` guard.
   - `src/lib/server/pages.ts`: `listPages` / `createPage` / `updatePage` / `deletePage` against Turso,
     mirroring `src/lib/server/admin.ts`. No runtime cache needed (build-time content).

7. **Header (desktop only)** — `src/lib/components/Header.svelte`:
   - Widen the search bar wrapper (`sm:max-w-xl` → wider, e.g. `lg:max-w-2xl`).
   - Add an "About us" link to the right of the search bar, `hidden md:inline-flex`, linking with
     `localizeHref('/about', { locale: getLocale() })`.
   - New Paraglide message `nav_about` in `messages/es.json` and `messages/pt.json` (UI chrome only;
     page content itself comes from Turso).

8. **Tests + verify**: extend `tests/admin.test.ts` for the pages API (auth + CRUD). `npm run check`,
   `npm test`, `npm run build` must all pass.

## Acceptance criteria

- `/admin/pages` lets an admin create/edit/delete pages; saves persist to Turso.
- `npm run data:export` produces `src/lib/data/pages.json`; a build renders `/about` (es) and
  `/br/about` (pt) with localized title/body from the seeded content.
- Unknown slugs return 404; admin routes stay blocked for non-admins.
- Desktop header shows an "About us" link to the right of a wider search bar; the link is hidden on
  mobile.

## Progress
