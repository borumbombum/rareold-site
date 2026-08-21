Status: WORKING-AGENT-ox-alpha

# Add French (fr) as a full language with UI + product translations

## Context

Fifth locale following AGENTS.md §Localization and the add-language skill. Japanese (`ja`) is the
reference implementation. Extends the original scope: distilleries table also gets `_fr` columns
(task predates 039), and product descriptions are genuinely translated in batches (user decision:
Option A). Visitor impact is additive only.

## Phase 1 — Wiring

1. `src/lib/utils/locales.ts`: `fr: { flag: '🇫🇷', label: 'Français', bcp47: 'fr-FR', path: '/fr' }`
2. `project.inlang/settings.json`: `fr` in `locales` + `{ "locale": "fr", "path": "/fr" }` urlPattern
3. `vite.config.ts` both urlPatterns blocks:
   - block 1: `['fr', ':protocol://:domain(.*)::port?/fr/origine/:slug']`
   - block 2: `['fr', ':protocol://:domain(.*)::port?/fr/:path(.*)?']`
   - recompile paraglide afterwards
4. Migration `0019_french_content.sql` (next free number):
   - products: `name_fr`, `description_fr`
   - origins: `name_fr`
   - pages: `title_fr`, `body_fr`
   - distilleries: `name_fr`, `description_fr`
   Apply to Turso + insert tracking row (0017/0018 pattern).

## Phase 2 — Code

5. `messages/fr.json`: translate ALL 222 keys from en.json + new admin label keys
   (`admin_products_name_fr`, `admin_products_desc_fr`, pages/distilleries equivalents)
6. `scripts/db-sync.mjs`: ORIGIN_META `name_fr` per origin (Écosse, Irlande, États-Unis, Japon,
   Inde, Canada, Argentine, Autres); products INSERT + ON CONFLICT DO UPDATE; pages INSERT same
7. `scripts/db-export.mjs`: `_fr` columns in products / origins / pages / distilleries SELECTs +
   mappings, including the slim distillery ref embedded in each whisky
8. `types.ts`: `DistilleryRef.name_fr: string | null`
9. Admin forms: products (`name_fr` input + `description_fr` textarea via LOCALE_DESCRIPTIONS),
   pages (`title_fr`/`body_fr`), distilleries (`name_fr`/`description_fr`)
10. Server: `admin.ts` (ProductInput, DistilleryInput, PRODUCT_FIELDS, rowToProductInput,
    productValues, updateProduct), `pages.ts` (PageRow/PageInput/upsertPage), `parseProduct()`

## Phase 3 — Content

11. Seeds: `whiskies.json` `name_fr` = same string (brand names universal, matches en/ja);
    origins fr names; `pages.json` about page `title_fr`/`body_fr` translated properly
12. Product descriptions ×160 — genuine French translations, **8 batches of 20**:
    - read base HTML descriptions → write French preserving HTML tags into `/tmp/opencode/fr-batch-N.json`
    - apply to seed via small node script (no hand-editing the big JSON)
    - append progress entry after EVERY batch (handoff point: "batches 1–N done, resume at N+1")

## Phase 4 — Verify

13. `npm run db:sync && npm run data:export && npm run check && npm test && npm run build`
14. Runtime spot-checks: `/fr/` home, `/fr/whisky/<slug>`, `/fr/origine/<slug>`, language switcher
    shows 🇫🇷 Français, `sitemap-fr.xml`, hreflang alternates, admin `_fr` fields live

## Acceptance criteria

- `/fr/` loads the French version; switcher shows 🇫🇷 + Français
- All 160 products have non-null `name_fr` + genuine French `description_fr`
- Origins, about page, and distilleries have `_fr` columns wired end-to-end (DB → export → UI)
- Admin can edit every French field
- Build/check/test pass at pre-existing baseline; sitemap-fr generated

## Progress

- 2026-08-21 (ox-alpha): Task rewritten with phased plan approved by user (Option A: genuine FR
  description translations in 8 batches of 20). Starting Phase 1 next.
