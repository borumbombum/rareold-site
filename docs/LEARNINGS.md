# Learnings

## 2026-08-22 — Origin hero images (Scotland/Ireland fix)

- Origin page heroes are a hardcoded `ORIGIN_HERO_IMAGES` map in `src/routes/origen/[slug]/+page.svelte`; there are no per-origin images on the homepage (tiles use flag emojis). Fallback everywhere is `/images/whisky.webp` via `onerror` in `Hero.svelte`/`HeroHome.svelte` — so a dead remote URL fails *silently*.
- Two of the twelve hotlinked Unsplash URLs had rotted to 404 (scotland, ireland) without anyone noticing. Lesson: self-host hero imagery under `static/images/origins/*.webp` instead of hotlinking; check remote URLs periodically (`curl -o /dev/null -w "%{http_code}" -L <url>` loop works well).
- Unsplash download endpoint `https://unsplash.com/photos/<slug>/download?force=true&w=2000` reliably returns the full-res JPEG for any free (non Unsplash+) photo; verify each slug resolves before committing to it.
- sharp WebP tuning: `effort: 6` (max is 6, default 4) shrinks detailed photos ~10-15% over plain quality setting. Detailed landscape shots compress far worse than product-on-plain-background: Glenfinnan viaduct @2000w q80 ≈ 500KB vs whisky.webp 107KB. Don't assume one quality number gives similar sizes across image types.
- Inlang localization gotcha when smoke-testing: base locale (en) has NO path prefix — English pages live at `/origen/scotland`, not `/en/origen/scotland`. Check `project.inlang/settings.json` urlPatterns before curling localized routes.
- This repo's `ps`, `pkill`, `file` binaries may be missing in the container; use `/proc/<pid>/cmdline` iteration or `kill $(...)` and `head -c N | od -c` for file type checks.

## 2026-08-22 — Adding a single influencer video safely

- `npm run db:sync` upserts ALL products with `ON CONFLICT DO UPDATE` on every `*_pt/_en/_ja/_fr` column (db-sync.mjs:206) — running it re-applies stale seed translations over any admin-edited Turso content. When the DB may hold newer data, do NOT full-sync.
- Safe pattern for one row: edit seed for reproducibility + targeted `INSERT OR IGNORE` into Turso via `@libsql/client` (mirror youtube-videos.mjs:204), then `npm run data:export` (Turso → local JSON, keeps everything else as-is).
- Always verify text edits at the JSON level (`JSON.stringify(a[f]) !== JSON.stringify(b[f])` per field) — git line diffs hide subtle word corruption inside long strings (caught myself typing Portuguese "baunilha" into a French description).
- Video order = `created_at ASC` from the export query; a product's only video is trivially "first". YouTube oembed endpoint gives video title/author without an API key.

## 2026-08-22 — Translating CMS pages (about)

- `pages` table: Spanish IS the base (`title`/`body`), no `_es` columns. Rendering = `/[slug]` + `l10n()` fallback per locale, so stale locale columns silently serve old content after a base edit.
- `db-sync` pages upsert backfills ONLY locale columns (`title_pt..body_fr`, never base title/body) — so the seed must carry current canonical translations; regenerate it FROM Turso (`SELECT` → JSON.stringify) instead of hand-editing to guarantee byte-parity with the DB.
- Same safe-write pattern as videos: targeted `UPDATE ... WHERE id=...` touching only the 8 locale columns + updated_at; never full sync when DB may hold newer admin edits.
- Localized page slugs don't translate (fr uses `/fr/about`, not `/fr/a-propos`) — only the prefix localizes.

## 2026-08-22 — Backfilling distillery map coordinates

- The map (`/map` + `DistilleryMap.svelte`) silently filters out rows with null lat/lng — missing coordinates make a distillery invisible with no error anywhere. Audit = `SELECT slug FROM distilleries WHERE latitude IS NULL OR longitude IS NULL`.
- Root cause was the add-product skill allowing "null coords OK" for blends/NDUs. Fixed the skill itself (coordinates now REQUIRED, blend anchoring rules) — patching data without patching the process just re-creates the gap.
- Blend/brand anchoring research shortcuts that worked: WhiskyNet owner pages list ALL brands per company in one hit (found Catto's + Hankey Bannister + MacArthur's are all Inver House → one Airdrie anchor for three); scotchwhisky.com Whiskypedia "produces X, Y and Z blends" confirms; retailer copy ("bottled at Buffalo Trace") gives brand-home anchors for sourced products.
- Seed drift happens in both directions: export can contain distilleries absent from seed (LDC added via admin). Mirror with a script that SELECTs the row from Turso and appends — never transcribe long HTML by hand.
- Shell gotchas: `node -e "<script>"` mangles quotes around object keys containing dashes (use a temp .mjs file); temp scripts must live inside /workspace to resolve node_modules (ERR_MODULE_NOT_FOUND from /tmp).

## 2026-08-22 — Pages admin: Tiptap + CRUD hardening

- Vitest only includes `tests/**/*.test.ts` — a spec anywhere else exits with "No test files found" and no hint. Follow the folder convention.
- Never verify CRUD against prod Turso: `tests/helpers/db.ts` `createTestDb()` spins an in-memory libsql DB with all migrations applied; every server function takes an optional `db` param for exactly this.
- `pages.slug` is UNIQUE in SQL, but relying on that surfaces raw 500s to the admin UI — pre-check `getPageBySlug()` in the API and return a clean 409.
- After an admin save, use `await invalidateAll()`, not `goto(same-url)` — the latter doesn't reliably re-run load, so list metadata (dates, counts) goes stale.
- Rewriting the pages admin dropped svelte-check warnings 33 → 25: old file carried warnings of its own; warnings aren't always pre-existing/global.
