# Learnings

## 2026-08-22 — Adding 5 whiskies + new distillery (Bowmore 18, Bruichladdich ×4)

- **Official Shopify stores expose product JSON without an API key**: `https://<store>/products/<handle>.json` and `.../collections/<c>/products.json?limit=50` return title, body_html (spec source of truth) and CDN image URLs. Bruichladdich's US store (`us.bruichladdich.com`) covers all their brands — use the collection listing first to discover current handles (e.g. Octomore's current core is 16.1, old editions 404).
- **whiskybase static image URLs are dead** (403) for these bottles; official Shopify CDN `cdn.shopify.com` PNGs → `prepare-image.mjs` gave 500×500 webps at 10–26 KB.
- **YouTube search scraping works well for non-EN videos**: fetch `youtube.com/results?search_query=...&hl=<lang>&gl=<CC>`, regex `"videoRenderer":{"videoId":"..."..."text":"..."`. Trap: YouTube *auto-translates* titles by `hl=` param, so a "Spanish" title may belong to an English channel — always verify language via oEmbed author_name/title before adding.
- New-release expressions have few native-language reviews yet (Octomore 16.1): en×3 easy, other languages only cover older editions of the same line — acceptable under the same-distillery different-expression widening rule.
- `npm run db:sync` reported `products: 189, distilleries: 59, influencer_videos: 195` seeded cleanly; export puts videos in a separate `src/lib/data/influencer_videos.json` joined by product id at runtime — whiskies.json having no embedded `videos` field is expected, check the videos file instead.

## 2026-08-22 — Origins admin CRUD + admin API auth fix

- **`getAdmin(cookies)` returns null, never throws.** `await getAdmin(cookies);` as a bare statement compiles and does NOTHING — it silently left `/api/admin/pages` (043) and `/api/admin/downloads` (044) publicly readable/writable. Always use the guard pattern: `if (!(await getAdmin(cookies))) return json({ error: 'forbidden' }, { status: 403 });`. Smoke-test every new admin endpoint with an unauthenticated curl expecting 403 before calling it done.
- Manual migrations applied to prod Turso must ALSO be registered in `schema_migrations` (`INSERT INTO schema_migrations (filename) VALUES ('0022_....sql')`) — db-sync tracks by filename and re-running an unregistered migration fails with "duplicate column name". Apply + register in the same step.
- Distilleries link to origins by free-text `country` column holding origin ids (no FK), products by `origin_id` FK. Any origin-deletion guard must check both plus regions.
- Vitest/rolldown native binding can vanish for the running platform (only `binding-darwin-arm64` present on linux-arm64 here). Fix without touching lockfile: `npm i -D @rolldown/binding-linux-arm64-gnu@<rolldown-version> --no-save`.
- Preview-server smoke tests: kill stale listeners first — a second `vite preview --port N` fails to bind silently and you end up testing the old build.

## 2026-08-22 — SQLite download paywall (sql.js serverless dumps)

- Node 20 has no `node:sqlite` and no `sqlite3` CLI in this container — sql.js (WASM) is the way to build/inspect `.db` files in-process. It works fine on Vercel's Node runtime if you add `ssr.external: ['sql.js']` to vite.config.ts (otherwise the SSR bundle chokes on the wasm loader) and resolve the `.wasm` via `createRequire(import.meta.url).resolve('sql.js/dist/sql-wasm.wasm')`.
- sql.js ships NO type declarations — write a small ambient `declare module 'sql.js'` d.ts; only the pieces you use are needed.
- libsql gotcha: `ResultSet.rows` is typed `Row[]`, not `Record<string, unknown>[]`; passing `res.rows` to a helper expecting plain objects fails typecheck even though it looks compatible. Type the helper against `ResultSet` from `@libsql/client`.
- Single-use download links: store only sha256(token) hashes in DB, return the raw token once at grant time, compare hashes on consume with an atomic `UPDATE ... SET used_at WHERE token_hash = ? AND status = 'granted' AND expires_at > now AND used_at IS NULL` — race-free single-use without transactions.
- Vitest can run TS that imports sql.js directly (no bundler gymnastics); verify dump validity by checking the 16-byte magic header `SQLite format 3\x00` then re-opening the exported bytes with a fresh sql.js Database.
- Paraglide: `localizeHref(path)` without `{ locale }` falls back to cookie/header detection — don't do `locals.locale ?? 'en'` (locals.locale is typed as the locale union, so the fallback widens the type and breaks it).

## 2026-08-22 — Origin hero images (Scotland/Ireland fix)

- Origin page heroes are a hardcoded `ORIGIN_HERO_IMAGES` map in `src/routes/origen/[slug]/+page.svelte`; there are no per-origin images on the homepage (tiles use flag emojis). Fallback everywhere is `/images/whisky.webp` via `onerror` in `Hero.svelte`/`HeroHome.svelte` — so a dead remote URL fails *silently*.
- Two of the twelve hotlinked Unsplash URLs had rotted to 404 (scotland, ireland) without anyone noticing. Lesson: self-host hero imagery under `static/images/origins/*.webp` instead of hotlinking; check remote URLs periodically (`curl -o /dev/null -w "%{http_code}" -L <url>` loop works well).
- Unsplash download endpoint `https://unsplash.com/photos/<slug>/download?force=true&w=2000` reliably returns the full-res JPEG for any free (non Unsplash+) photo; verify each slug resolves before committing to it.
- sharp WebP tuning: `effort: 6` (max is 6, default 4) shrinks detailed photos ~10-15% over plain quality setting. Detailed landscape shots compress far worse than product-on-plain-background: Glenfinnan viaduct @2000w q80 ≈ 500KB vs whisky.webp 107KB. Don't assume one quality number gives similar sizes across image types.
- Inlang localization gotcha when smoke-testing: base locale (en) has NO path prefix — English pages live at `/origen/scotland`, not `/en/origen/scotland`. Check `project.inlang/settings.json` urlPatterns before curling localized routes.
- This repo's `ps`, `pkill`, `file` binaries may be missing in the container; use `/proc/<pid>/cmdline` iteration or `kill $(...)` and `head -c N | od -c` for file type checks.

## 2026-08-22 — Adding a single influencer video safely

- `npm run db:sync` upserts ALL products with `ON CONFLICT DO UPDATE` on every `*_pt/_en/_ja/_fr` column (db-sync.mjs:206) — running it re-applies stale seed translations over any admin-edited Turso content. When the DB may hold newer data, do NOT full-sync.
- Safe pattern for one row: edit seed for reproducibility + targeted `INSERT OR IGNORE` into Turso via `@libsql/client`, then `npm run data:export` (Turso → local JSON, keeps everything else as-is).
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

## 2026-08-22 — Completing influencer videos (Ardbeg 10 / Uigeadail / WhistlePig 10)

- oEmbed bulk verification loop works great: `for id in ...; curl youtube.com/oembed?url=watch?v=$id&format=json` returns title+author with zero API quota; re-run right before writing labels so labels match live titles.
- WhistlePig has ZERO Portuguese-language YouTube reviews (6 targeted searches; barely distributed in Brazil). User policy decision: reuse the en video in the pt slot rather than leaving it empty.
- Comparison videos are acceptable sources: fr Uigeadail = Uigeadail-vs-Corryvreckan tasting, ja = same pairing — both clearly feature the target bottle in title.
- `influencer_videos` sync path uses `INSERT OR IGNORE` (unlike products' full upsert), so seeding videos never duplicates or clobbers existing rows.
- Seed-file safety check before scripted edits: `json.dumps(json.loads(orig), indent='\t', ensure_ascii=False)+'\n' == orig` proves a load→dump rewrite is byte-identical for untouched entries — then hand-editing via script is diff-safe.
- Ran full `db:sync` anyway: safe here only because seed `generatedAt` was exported from Turso the same day (translations in parity); if admin edits landed after the export, prefer targeted inserts per the earlier learning above.

## 2026-08-22 — Adding Ardbeg Corryvreckan

- `data/seed/whiskies.json` is `{source, generatedAt, whiskies}` (dict, not flat list) and entries are in insertion order, NOT slug-sorted — don't assert sorting before scripted edits, just preserve order.
- pt video searches: generic "ardbeg corryvreckan youtube" queries missed Brazilian reviews; the winning query included Portuguese words + site hints: `youtube.com watch <product> "análise" OR "review em português" OR "prova"`. Two verified candidates existed (Whisky Capital PT-BR review, WhiskyBrasil.com 4K); picked the one with explicit "(Português PT - BR)" in title.
- ja pick favored channel consistency: 宅飲みバーTakeo already provided the Uigeadail ja video; reusing the channel keeps curator quality coherent.

## 2026-08-22 — Batch of 4 (Wee Beastie, Laphroaig 10/QC/Lore)

- `data/seed/whiskies.json`'s `whiskies` key is a **list of objects** (not slug-keyed dict) — look entries up by iterating + matching `slug`. The Corryvreckan note above said "dict" for the top-level shape; the collection itself is an array.
- YouTube search-page scraping beats websearch for video discovery: fetch `youtube.com/results?search_query=<q>` with a UA header, regex out `ytInitialData`, walk the JSON collecting `videoRenderer` nodes (id | channel | title). One script handles all languages; set `Accept-Language` per query.
- Image-source dead ends this batch: TWE CDN (`img.thewhiskyexchange.com/900/<code>.jpg`) returns identical 7.4KB placeholders for ANY code; masterofmalt.com 429s bots; whiskybase.com 403s but `shop.whiskybase.com` og:image works via webshopapp CDN; `lovescotch.com/products.json?limit=250&page=N` Shopify API is a reliable product-image source.
- Auto-translated metadata trap: a YouTube result titled in French ("...contre...") can be an English video whose metadata got machine-translated. Confirm language via oEmbed title/author before assigning to a locale slot; if no genuine video exists, fall back to en per policy.
- Channel consistency picks: Whisky Capital (pt), HABLANDO DE WHISKY / Los Whiskochos (es), lachaineduwhisky (fr), ひとくちウイスキー (ja) all had multiple Laphroaig videos — prefer them across products in the same distillery.

## 2026-08-22 — Dedup lesson

- Product de-dup must search by **distillery + partial name tokens**, never the exact full name: a legacy stub named "Arran Barrel" (added ~v0.2.2 with just one ES video) survived a check for "Arran Barrel Reserve" and produced a duplicate product page. Before inserting, grep seed + exports for every word of the product name and for the distillery id.
- Merged duplicate cleanup is cheap when the old row has no user data — check `votes` (column is `entity_id`, not `product_id`), `karma`, `favorites`, `reviews` for BOTH ids before deciding which slug survives. `influencer_videos.product_id` is `ON DELETE CASCADE`, so deleting the product removes its videos.
- db-sync is INSERT-only (`ON CONFLICT DO NOTHING`); removing an entry from the seed does NOT delete it from Turso — run a one-off `DELETE FROM influencer_videos ...; DELETE FROM products ...;` against the DB, then re-export.
- Scope discipline: a data-level merge (delete duplicate row, keep the complete one) is the whole job — no extra machinery (redirects etc.) unless explicitly requested. Old slugs simply 404 like any unknown product.
