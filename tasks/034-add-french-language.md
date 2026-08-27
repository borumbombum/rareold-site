Status: [DONE]

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
- 2026-08-21 (ox-alpha): Phase 1 DONE — locales.ts fr entry, settings.json locales+urlPattern,
  vite.config.ts both blocks (/fr/origine/:slug + /fr/:path), migration 0019_french_content.sql
  written (products/origins/pages/distilleries _fr columns). Phase 2 DONE — messages/fr.json
  (227 keys = 222 en + lang_fr + 4 admin _fr labels), paraglide recompiled OK, db-sync.mjs
  (ORIGIN_META name_fr, origins/distilleries/products/pages INSERTs incl. ON CONFLICT backfill),
  db-export.mjs (all SELECTs+mappings incl. slim distillery ref), types.ts (Whisky/DistilleryRef/
  Distillery), origins.ts OriginRow, admin.ts (ProductInput/PRODUCT_FIELDS/rowToProductInput/
  productValues/updateProduct/DistilleryInput/DISTILLERY_FIELDS/rowToDistilleryInput/
  distilleryValues/create+updateDistillery), pages.ts (PageRow/PageInput/upsertPage),
  parseProduct()+parseDistillery(), admin forms products/distilleries/pages, env.ts
  LOCALE_TO_COUNTRY fr→US (no FR country site; affects only new /fr visitors). Starting Phase 3:
  seeds + description batches.
- 2026-08-21 (ox-alpha): Phase 3 partial — seeds done: whiskies.json name_fr added to all 159
  products, pages.json about page title_fr/body_fr translated. Description batch 1/8 applied
  (20/159). Resume at batch 2. Pipeline: source dumps at /tmp/opencode/fr-src-N.json → write
  /tmp/opencode/fr-batch-N.json → `node /tmp/opencode/apply-fr-batch.mjs N`.
- 2026-08-21 (ox-alpha): Batches 1–8 done — all 159 products have description_fr. Seeds complete. Next: Phase 4 (db:sync → data:export → check → test → build + spot checks), then DONE.
- 2026-08-21 (ox-alpha): Phase 4 DONE — task complete.
  - db:sync applied migration 0019; found origins rows didn't get name_fr (their INSERT was
    ON CONFLICT DO NOTHING, same reason name_ja is null there). Fixed db-sync.mjs origins upsert to
    `DO UPDATE SET name_fr = excluded.name_fr` (backfills only fr; es/pt/ja untouched). Re-synced:
    8/8 origins now export French labels (Écosse, Irlande, États-Unis, Japon, Inde, Canada,
    Argentine, Autres).
  - data:export: 160 whiskies — 159 with name_fr + description_fr (the 1 without is a DB-only
    product not in the seed; falls back to base), about page title_fr/body_fr ✓.
  - Test fixtures updated to include _fr fields (tests/admin.test.ts baseProduct,
    tests/schema.test.ts product + distillery ref) matching existing _ja pattern.
  - check: 2 errors / 28 warnings = pre-existing baseline. test: 66 passed, 1 failed = the known
    pre-existing stats failure. build: exit 0.
  - Runtime spot checks (vite preview): /fr/ 200 lang="fr-FR", switcher shows Français, origin
    labels in French on home; /fr/whisky/smokehead-high-voltage renders FR description;
    /fr/origine/scotland title "Écosse — Rare Old" + hreflang fr present; sitemap-fr.xml 200 with
  320 fr/whisky URLs; /fr/about shows "À propos"; base and /en product pages unchanged (no
  regression). No commits/pushes made.
- 2026-08-21 (ox-alpha): Correction — coverage was 159/160, not 160/160. `whisky-new-forms-ex-bourbon`
  (New Forms: Ex-Bourbon, London Distillery Co.) was added to Turso via admin after the seed was
  built, so it never went through the batch pipeline. Fixed: added the full row (mirrored from
  Turso export) + genuine FR translation (name_fr = brand name; description_fr mirrors the en HTML
  structure: spec line, intro ×2, tasting list Nez/Bouche/Finale) to data/seed/whiskies.json.
  db:sync backfilled only locale columns (products DO UPDATE touches _pt/_en/_ja/_fr exclusively),
  data:export now reports 160/160 with name_fr + description_fr. check/test/build at baseline
  (2 errors / 1 known failure / exit 0); /fr/whisky/whisky-new-forms-ex-bourbon renders the FR
  description. Seed and DB are back in parity at 160 products.