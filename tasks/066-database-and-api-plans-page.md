Status: [TODO]

# Database & API Plans Page

## Context

The site sells two data products. Task 044 shipped the SQLite download flow on `/download` ($29 one-time, email-gate → admin-granted signed link). Task 065 adds a paywalled read-only JSON API with two tiers ($19/year yearly-billed vs $99 lifetime). This task creates a single `/database` landing page (available in all languages) that presents both products: a **one-time SQLite download** and a **"consume the API" section** explaining the yearly/lifetime tiers.

The `/database` page is the single home for both products. The one-time SQLite purchase flow (currently on `/download`) is reimplemented here; `/download` itself is not part of this work and can be ignored/removed later.

## Requirements

1. **Route**: `src/routes/database/+page.svelte` + `+page.server.ts`. The paraglide catch-all URL pattern (`:path(.*)?`) already localizes it (`/br/database`, `/fr/database`, `/ja/database`, ...) — no `vite.config.ts` change needed. Same SEO/canonical/hreflang handling as `/download` (uses `<SEO>` with `canonicalPath="/database"`).

2. **SQLite download section (top, one-time $29)**:
   - Implements the SQLite purchase flow: stats ("What's inside" counts), price, email form → `POST /api/download/request` → admin grants signed single-use link via existing `/admin/downloads`.
   - Reuse `downloads.ts` / `dbfile.ts` / the `/api/download/*` endpoints unchanged. No changes to or redirects from `/download`.

3. **API section (below)** — "Consume the API":
   - Explanatory copy: what the API exposes (whiskies, distilleries, origins, localized, influencer videos — from `/api/v1/*`, task 064), how credentials work (Basic Auth `user:password`, enabled by admin once payment received).
   - **Two pricing tiers** (configurable references, not hardcoded across the app):
     - **$19/year** — yearly-billed, standard request limit
     - **$99 lifetime** — one-time, higher request limit
   - Sign-up CTA that requests access for the chosen tier; on submission it feeds task 065's admin consumer creation (creates a `pending` consumer the admin activates once paid). Until 065 lands, the CTA can note "coming soon" but should still be wired/behind a toggle.
   - Mention that links/credentials are delivered by email after payment confirmation (out-of-band; payment method TBD by owner, possibly Bitcoin/Stripe later).

4. **Localization**: add all new UI strings (`database_*`, `api_*`) to `messages/en.json`, `es.json`, `pt.json`, `fr.json`, `ja.json`. No data-only keys.

5. **Navigation + sitemaps**: add `/database` link to Header/Drawer/footer. Note: `/download` is not currently linked in nav and is not in `src/lib/server/sitemap.ts` (only homepage/whiskies/origins/distilleries are). Add `/database` as a new static localized page in `buildLocaleSitemap()` (`makeUrl(`${origin}${prefix}/database`, ...)`).

## Files to add/modify

- `src/routes/database/+page.svelte` (new)
- `src/routes/database/+page.server.ts` (new, computes counts)
- `messages/{en,es,pt,fr,ja}.json` — new strings
- `src/lib/components/Header.svelte` / `Drawer.svelte` (or footer) — nav entry
- `src/lib/server/sitemap.ts` — add `/{locale}/database` static page
- `docs/api.md` — point to `/database` as the sign-up landing if applicable

## Acceptance criteria

- [ ] `/database` renders in all 5 locales with translated content
- [ ] SQLite download flow (email form → request → admin grant → signed link) works from `/database`
- [ ] API section shows the two tiers ($19/year, $99 lifetime) with explaining copy and a working sign-up CTA (creates a `pending` consumer behind task 065)
- [ ] `/database` appears in nav and sitemaps (localized)
- [ ] `npm run build` / `svelte-check` succeed

## Progress

- 2026-09-01: Created. Single `/database` landing for both products: SQLite one-time purchase ($29) + API plans ($19/yr vs $99 lifetime, task 065) with sign-up request. Payment method still TBD (owner may accept Bitcoin). No `/download` changes or redirects.