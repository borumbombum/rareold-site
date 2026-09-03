# Learnings

## 2026-09-02 — Batch: Glenglassaugh Portsoy, Clynelish 14, Glendronach 12/15/18

- **Glendronach og:image naming uses `_2-1`/`_2-2` suffixes.** Guessed `GD_15YO-1-1.png`/`GD_18YO-1-1.png` 404; real ones are `GD_15YO-2-1.png` and `GD_18YO-2-2.png`. Pull the `og:image` meta from the product page instead of guessing the filename. Glendronach 12 was `GD_12YO-1-1.png` (worked as guessed) — inconsistent, so always scrape.
- **Delegate video search to one subagent per product, return EVERY verified exact-expression match up to 4/language.** Single-agent-per-product kept each transcript small and let agents run native + Invidious + websearch + oEmbed per language properly. Every ID quoted from agent output re-verified with `yt-verify` before seeding.
- **Regularity of foreign coverage for these sherried/coastal Highlands:** Clynelish 14 is a coverage goldmine (4 en / 4 es / 4 ja / 2 fr / 1 pt), Glendronach 12 rich in mainland-Latin Spanish (es3) + Japanese (4: 俺のモルト, ジョージア州, モルトヤマ, 宅飲み). Glendronach 15/18 es is thin (2 each: Whisky o Muerte + Julio Oñate / Los Whiskochos), ja moderate (1 / 3), and **French is 0 for all three Glendronach core expressions** — no exact in-language FR review exists; EN top-up fills at runtime.
- **Tierri Whisky is Braz.sil (pt), not Spanish (es).** Do not double-slot the same URL; a URL may appear once per product.
- **Reliable image sources this batch:** `img.thewhiskyexchange.com` (clyob.14yo.jpg), official distillery PNGs (Glenglassaugh `US_C_PORTSOY-...copy-3.png`, Glendronach GD_*YO). whiskybase still 403.

## 2026-09-01 — Batch add: Glen Elgin/Aultmore/Tormore/Glenmorangie ×2

- **Whiskybase image CDN returns 403 to the image-prep UA** — its `static.whiskybase.com/storage/whiskies/...` URLs need a real browser origin. Use shop/CDN product shots instead (`media.nicks.com.au`, `cdn11.bigcommerce.com`, retailer uploads).
- **Whiskybase search pages expose exact image URLs in the HTML** (e.g. Cadenhead's Tormore 14 → `cadenhead.shop/wp-content/uploads/2026/02/Tormore-14-YO.png`); grep the product page for `.png/.jpg` to grab a direct link.
- **`npm run db:sync` re-prints totals, not inserts** — verify new rows by diffing counts before/after (distilleries 98→102, products 262→267, videos +75) rather than trusting a "seeded N" line.
- **Niche Speyside expressions (Glen Elgin 12, Aultmore 12) have spotty non-EN coverage**: Aultmore shipped en/es/pt/ja; Glen Elgin shipped en/es/pt/ja but no fr; Tormore 14 had honest exact-expression videos only in en (3). Ship zero for a language rather than pad — runtime EN top-up covers the gap.

## 2026-09-01 — Video search pitfall for less-niche Speyside single malts

- **`influencer_videos` can't be verified from the exported product object** — the export splits them out to `src/lib/data/influencer_videos.json` keyed by `product_id`, so `f.influencer_videos` on a whisky is 0. Always check the flat list. (Glenrothes Maker's Cut + Mortlach 12/16.)
- **Mortlach 16 Distiller's Dram**: `yt-search.mjs` es query surfaced `8rcuvdB6G5E` (whisky-doc "Mortlach 16yo Distiller`s Dram"), and El Whisky Bar's `2pdktNFnL_U` ("El muy buen Mortlach 16 años") is a genuine es review. Ja has `PiUz8fss8wM` (宅飲みバーTakeo Mortlach 12v16) + `7EDPjikKXlU` (Harry Tsai "モートラック16のレビュー" — English-narrated but titled in Japanese; verified channel is ES-bilingual/EN, so slot it carefully).
- **Foreign-language named "review" channels are sometimes EN** — always judge the spoken language from oEmbed `author_name` + title, never the query language that surfaced it.

## 2026-08-28 — Kill multi-second post-load rating stall (parallelize + loader counter)

- Symptom: list reorder/flicker fires ~4s after load. Root cause: `/api/rating` ran `getRatingMap` + `getUserReviewedSlugs` **serially**, each an uncached remote Turso round-trip (`libsql://…aws-us-west-2.turso.io`, measured ~1.1s/call) → ~1.7s+ API, ~4s perceived.
- Fix: `Promise.all` the two calls in the API route; keep ratings/reviewed **uncached** (requirement is fresh data). User's own vote always visible (local store update + no caching of reviewed).
- Loading indicator: replaced boolean `navigation.setLoading` with a **reference counter** (`beginLoading`/`endLoading`) so overlapping refreshes / SPA nav can't kill the loader early; `refreshRating` does `await tick()` after merging stores so the bar stays on until the re-sort reorders are actually rendered. Migrated FavoriteButton/FollowDistilleryButton to the counter API; removed the now-unused `setLoading`.
- Lesson: measure the DB round-trip latency before blaming frontend timing; serial remote calls multiply latency.

## 2026-08-28 — Loading indicator for user-prefs/rating fetch (head-loader reuse)

- The "surprising UI update" on listing pages (homepage/origin/distillery/user/profile) comes from `refreshRating()`, which client-fetches `/api/rating` after `onMount` and re-sorts the ranking (sortWhiskies `top`/`reviews`/`worst` + profile `byRanking` all read `ratingStore`) and flips VoteButton/reviewed state. No loading signal existed.
- User wanted the list to stay **visible and usable** during the fetch — just show that loading is happening, nothing gated/skeleton'd.
- Fix: reused the existing head-loader convention (`navigation.setLoading(true/false)`, already used by FavoriteButton/FollowDistilleryButton) inside `refreshRating` via dynamic `import('./navigation.svelte')` wrapped in try/finally. One central change covers every caller. List never hidden.
- Note: rune `.svelte.ts` stores can dynamic-import one another; keep the import inside the function to avoid ordering issues at module init.

## 2026-08-28 — Origin default ordering bug (Canada forced first)

- Precedence rule (from the user, verbatim intent): **All → navigated/active origin → pinned origins → remaining by whisky count**.
- Root cause: `origin.ts` had `const BASELINE_PINNED = ['canada']` (a hardcoded baseline pin from task 051's old `PINNED_ORIGINS`), which injected Canada right after All/active/pinned and *before* the count-sorted rest. With only 1 Canadian whisky, it rendered first — wrong.
- Fix was a pure deletion: remove `BASELINE_PINNED` + its loop; precedence fell naturally to the intended order in `sortOriginsForDisplay` (which already did active then pinned then count). One shared function powers both `OriginFilters.svelte` and `Drawer.svelte`.
- Vocabulary matters: the user distinguishes "selected" (the navigated origin pill, which is second) vs "default origins" (the count-ordered rest). Listen to that exact distinction before proposing changes.

## 2026-08-28 — Add "Arran Barley Year Old" (Arran Local Barley / Batch 001)

- **Ad-hoc add beside the queue**: the user requested this product directly (not via the queue line), so I added the line to `docs/whisky-brands-and-products-to-add.md` myself and ticked it at the end — keeps the queue authoritative while honouring an explicit request.
- **User overrides slug conventions**: I proposed `arran-barley-10-yo` (age-based, mirroring the existing `arran-10-yo`), but the user corrected the canonical name to "Arran Barley Year Old" → slug `arran-barley-year-old`. Confirm the exact product name/slug with the user; age-in-slug is not always wanted.
- **YouTube localized titles are traps**: `yt-search.mjs` serves titles in the request's `accept-language` (EN query → EN title, JA query → auto-JA title for the *same* video ID). The same ID (`UG_qQbFqtaI` Whisky Lock) shows "Arran Barley 10yo" in EN, "Arran Barley 10 años" in ES, "アラン・バーレイ10年" in JA — the **spoken language is fixed**. Decide language only from the authoritative oEmbed `author_name` + `title`, not from the localized search hit.
- **Genuine in-language reviews hit 4/4 for every language** on this new release when you allow same-distillery widening: es/pt/ja/fr have no "Arran Barley" specific reviews, but Arran 10 reviews in-language abound (Los Whiskochos, Hablando de Whisky, Piojo, First Phil; Loucos Por Whisky, Sanson, Whisky Capital, Mapa do Whisky; せるじお, ひとくち, ゆうのウイスキー, 2.5畳; Whisky et Cie, La Maison du Whisky, Malt à propos). FR even has a dedicated Arran **Barley** video (`0nDnO862MpY` Whisky et Cie). EN got 4 exact-expression Arran Barley reviews.
- Reuse existing seed videos where fit, but prefer fresh verified picks; every URL re-checked via oEmbed (0 bad).
- Pipeline: `db:sync` (products 220, influencer_videos 603) → `data:export` (distillery resolved to "Isle of Arran Distillers", 4 videos/lang) → `npm run check` (0 errors, 25 baseline warnings).

## 2026-08-28 — Batch of 10 whiskies + videos (Springbank/Longrow/Hazelburn, Kilkerran×2, Glen Scotia×3, Glenfiddich 15 Solera)

- **`data:export` embeds videos under `videos` on each whisky** (not `influencer_videos`) and resolves `distillery` into a `distillery.name` object; `src/lib/data/influencer_videos.json` holds the flat keyed-by-product list. The seed keys videos by `product_id` = `w.slug` (db-sync `INSERT OR IGNORE` on `(product_id, language, url)`), and `db-sync` inserts products ON CONFLICT DO UPDATE only for locale columns — a new product + its videos both flow from `data/seed/whiskies.json`.
- **Cross-product URL reuse is allowed; within-product is not**: "a URL may appear once per product, ever" (the runtime dedups by URL per product). Same-language same-distillery videos (`LWB. E71 Glen Scotia` in all three Glen Scotia products; the PT Kilkerran triple tasting in both Kilkerran products) are fine — dedup is scoped per product, not global.
- **The subagent-friendly discovery chain that works**: launch per-product `general` agents to run `scripts/yt-search.mjs` + oEmbed verification, THEN trust nothing and re-verify every returned URL myself in one scripted loop (extract all 136 IDs → fetch oEmbed → print author+title). Agents hallucinated labels, wrong `created_at`, and — critically — **wrong-expression videos** (Hazelburn CV/8/12 dropped into the Hazelburn-10 slot; Springbank-10 PT videos dropped into the Springbank-15 slot). The spoken-language judge is always the oEmbed `author_name` + `title`, re-checked by hand.
- **"Same distillery, different expression, in-language" widening is the sanctioned gap-filler for niche bottlings** (skill Step 5 rule 1) — that's why Hazelburn's es/pt and Glen Scotia's pt/fr non-core expressions are valid. pt for Kilkerran is genuinely 1 video (Porção dos Anjos triple tasting `5q0ZmEjFLIU`) after many queries — ship the honest 1, let the English top-up fill it.
- **All 136 URLs verified playable (0 bad)**, every slot's channel+title confirms its language. Glenfiddich 15 Solera is the richest (full 4 in es/en/pt/ja, 4 fr range-widened since no genuine fr 15 exists).
- Pipeline verify step-by-step: `npm run db:sync` (products 219, distilleries 77, influencer_videos 583) → `npm run data:export` (each new product resolves distillery name + videos with ≥2 per language) → `npm run check` (0 errors). Queue file `docs/whisky-brands-and-products-to-add.md` lines ticked `✅` for all 10.

## 2026-08-27 — Leaflet render race on the distillery map (single-flight + focus hook)

- Supersedes the "Safe wiring pattern" bullet in the coordinates entry below: `async focusDistillery` awaiting `renderMarkers()` then calling `openPopup()` is racy. On arrival the `onMount` render, the `selectedOrigin` effect render, and the focus render all interleave after `await import('leaflet')`. The last-finishing stale render re-runs `markerLayer.remove()`, wiping the layer whose marker held the just-opened popup → map flies to the distillery but the popup dies and the final marker set is order-dependent.
- Fix = **single-flight renders**: `const seq = ++renderSeq` at entry, `if (seq !== renderSeq) return` immediately AFTER the `await import('leaflet')` and BEFORE any layer/marker mutation. Only the newest render ever touches the map, so a later render can't delete an earlier one's popup-carrying layer.
- Then make "focus" pure data, not imperative: `let focusAfterRender: string | null = null`. `focusDistillery(id)` just sets `focusAfterRender = id` and, if the target's origin differs, sets `selectedOrigin = d.country` (the origin `$effect` does the one render); if the origin is the same it fires one guarded `renderMarkers()`. Inside `renderMarkers()`, when `focusAfterRender` is set the marker list becomes `[target]` ("Only X" is literally true), and after building, consume the hook: `openPopup()` + `flyTo([lat,lng], 10)`. `selectOrigin` clears `focusAfterRender` first so chip clicks never re-open a stale popup; `clearFocus()` is now imperative-simple (`closePopup()`, and on reset set `selectedOrigin = 'all'` + world flyTo — markers re-render via the origin effect, no manual render call).

## 2026-08-27 — Tasks-skill migration (`todos/` → skill system)

- `git mv todos tasks` is the safe rename (preserves history); the migration touched 55 task files (first-line `Status:` → `Status: [TODO]`/`[DONE]`), the AGENTS.md `## Tasks` list (`- NNN [MARKER] Title`), and the workflow section now defers to the `tasks` skill. Four files (048–051) had their `Status:` line on line 3 (title first) — a sequence-tool regex script silently "SKIPped" them; always eyeball the skip list. Normalized them to line 1 to match "Each file starts with a `Status:` line".
- **Skills live ONLY in `.agents/skills/`** — the AGENTS.md rule is binding. During migration a tasks-skill copy that had been canonicalized in the wrong location was deleted (the canonical one is `.agents/skills/tasks/SKILL.md`), and `add-language` was moved into `.agents/skills/` too. the agent runtime scans `.agents/skills` (proven: `add-product` was loaded from there), so the skill stays registered with `.agents` as the single source of truth. The GitHub-skill lockfile `skills-lock.json` was also removed — it was the only thing that could re-create the removed non-canonical skills install dir on a future run. After moving skills, always sweep for stray install dirs and the lockfile, not just the moved files.
- The `## Next tasks` list is a lossy place to store truth: it stores humanized titles, not slugs, so reverse-mapping title→file needs care (I keyed verification on the NNN prefix, not titles). Scripted one-way transforms of markdown text (not just data) need an em-dash-aware parser: `SUPERSEDED by 023`.split(' ')[1] was `"by"`, not `"023"` — off-by-one index bug → human-written AGENTS edit fixed it, and 016 is `[DONE]` + Progress note (skill has no superseded marker).
- Bulk 55-file mechanical transforms are better as a small idempotent Node script (loop files, match, rewrite, log unchanged) than 55 Edit calls; log `SKIP` lines for review.

## 2026-08-27 — Distillery coordinates + selected-on-map link

- Linking into a SPA page with a focus target is query-param-based: `/map?distillery=<id>`. `localizeHref('/map?distillery=x')` preserves the `search` (`localized.pathname + localized.search + localized.hash`), so localized hrefs with query strings need no extra wiring.
- The map's marker set is client-only (Leaflet in `onMount`), so curl-on-SSR shows nothing — smoke-test the distillery page (coords + link text literally in the HTML) and rely on `svelte-check` + the `$effect` ordering for the map behavior. Verify dev output before trusting it: first curl returned `000` while Vite was still optimizing deps (took ~40s on first boot, `ss`/lsof unavailable in this container — check `/proc/[0-9]*/cmdline` instead).
- Svelte 5 TS narrowing gotcha: a `$derived` boolean (`hasCoordinates`) does NOT narrow types inside a sibling `$derived`, even though the value is read right after — svelte-check errors "'distillery.latitude' is possibly 'null'". Fix: inline the `typeof x === 'number'` guard inside the same expression so TS narrows within it.
- Safe wiring pattern for a prop-driven "focus on map": `$effect(() => { const id = selectedId; if (id && ready) void focusDistillery(id); })`. Because the effect reads `ready`, it re-fires AFTER `onMount` assigns `map` and flips `ready = true`, dodging any mount/effect ordering race. `flyTo` + `marker.openPopup()` (markers collected into a `Map<string, Marker>` during `renderMarkers`) gives the "item selected" feel without permanently locking the origin filter.
- Message keys (`destillery_coordinates`, `destillery_view_on_map`) added in all 5 locales and regenerated with `npx paraglide-js compile --project ./project.inlang --outdir ./src/lib/paraglide` before `npm run check` — the compile verbatim from the 052 note is mandatory for new keys.

## 2026-08-27 — Batch of 5 whiskies + 4 distilleries (Vat 69, Scapa 13, Tobermory 12, Ledaig 10, Torabhaig Legacy)

- **Distilleries table HAS `name_fr`/`description_fr` now** — the earlier "no name_fr column" learning (2026-08-22) is stale since French landed (task 034). `db-sync.mjs` inserts distilleries with all 7 columns (`..._es/_pt/_en/_ja/_fr`); new distillery records must ship full 5-language name+description or the fr columns stay null forever (`ON CONFLICT DO NOTHING` never backfills).
- **Whiskybase static image URLs are definitively dead (HTTP 403)** even with browser UA + Referer — verified again this batch. That dead-end forced Wikipedia (Vat 69) and official distillery Shopify PNGs (Tobermory/Ledaig/Torabhaig) which all worked. A thespeysidewhisky.com shop image also worked for Scapa 13. Whiskybase → official Shopify CDN remains the fallback ladder.
- **less-niche ≠ more reviews**: ultra-niche expressions have near-zero non-EN coverage. Torabhaig Legacy Ch.1 (distilled Jan 2017) has exactly ONE genuine Japanese review (Dram FM radio `S7zLUQ6dCP8`, "190年ぶり! トラベイグ ザ レガシー 2017") and no genuine pt/fr; Scapa 13 (Distillery Reserve small batch) has no pt/fr at all. Widen same-distillery saves languages quickly: ja got Torabhaig's 2nd via ひとくちウイスキー reviewing Allt Gleann (Legacy Ch.2) `KVKrKHq9vTs`; es got HABLANDO DE WHISKY's Allt Gleann + Batch Strength; Scapa es/ja came from Skiren/Glansa/10yo reviews.
- **The "reuse English URL in a missing-language slot" practice from earlier batches is OUT** — current skill + task AC forbid listing a URL twice per product ("may appear once per product, ever"; runtime dedups silently). Ship genuine in-language videos even if <2 and let the runtime English top-up fill remaining slots. Vat 69 pt = only Destilados Brasil exists after 5 searches; that's the honest answer, not a padded en duplicate.
- **"Good Juice" French lookalike trap**: a French query returned "Good Juice — Ledaig Rioja Cask" with a French title, but oEmbed returned an English title — same auto-translate trap in the opposite direction. Use Spirituosités (oEmbed title "Ledaig Triple Wood", known-French channel) instead. oEmbed is the gate: title in French + known-French channel = trust it.
- **Seed-append script bug classic**: when text-injecting products at the end of whiskies.json, the anchor `\t\t}\n\t]\n}` includes the LAST product's closing `}` — must re-emit `\t\t},` after slicing BEFORE it, not just a bare `,`, or JSON.parse fails at the injected `{`. String-tail surgery on 8k-line JSON is safer than a full re-stringify (keeps the diff minimal).
- Torabhaig product is `torabhaig-legacy-series-ch1`; the existing `legacy` distillery (canada) is unrelated. Regions `Islands` + `Blended Scotch` already existed; Vat 69 anchored at Edinburgh (William Sanderson & Son, Leith), Scapa at St Ola (Islands), both on the map.

## 2026-08-27 — Video modal close button outside the modal

- The video modal's close X lived **inside** the video (`VideoModal.svelte`), half-sticking out of the top-right via `translate-x-3 -translate-y-3`, so it looked broken and was easy to miss. Fix: move it to sit just **outside the panel's top-right corner** by wrapping the panel in a `relative` flex child and absolutely positioning the button with `-top-3 -right-3` (rendered in `Modal.svelte` only when `bare` is true). It's relative to the centered panel, NOT `fixed right-4 top-4` (page corner) and NOT inside the content.
- `Modal.svelte` already gave escape hatches for free (`onmouseup`-on-overlay + Esc in `$effect`), so the external X is a discoverability affordance, not the only close path.
- A positioning trap to remember: in a `flex items-center justify-center` overlay, an `absolute` child offsets against the nearest `relative` ancestor — putting the button inside a `relative` wrapper around the panel lets it hover off the panel corner, whereas `fixed` pins it to the viewport.
- `bare` is the current "no header" switch — think of it as "modal without chrome," and any outside-positioned overlay controls belong there, not hard-coded per consumer.

## 2026-08-27 — Batch of 5 whiskies (Talisker Storm, HP Cask Strength, Dalwhinnie 15, Glenfiddich 12, Jameson)

- **`img.thewhiskyexchange.com/540/<code>.jpg` (and `/900/`) is a PLACEHOLDER TRAP**: for ANY product code it returns the same generic 540×720 image (~24.6 KB). A 200 HTTP response does NOT mean a real bottle shot — always eyeball the file (dimensions 540×720, md5 identical across codes = fake). Discard the earlier claim that a TWE-derived Talisker Storm image was verified; it was this placeholder. Reliable real source is **lovescotch.com's Shopify API**: paginate `products.json?limit=250&page=N` for the `cdn.shopify.com` src, or `search/suggest.json?q=<query>&resources[type]=product`. All five images this batch came from lovescotch assets and processed to real 500×500 webps.
- **Region naming is app-specific, not SWA**: the frontend regions list uses **"Highlands"** (plural) for Highland single malts — Dalwhinnie must be `region:"Highlands"`, not "Highland". Likewise Irish whiskeys use `origin:"ireland"` + region `"Cork"` (Jameson/Midleton), region "Dublin" (Jameson Bow St), etc. Match the existing products' values, not the marketing classification.
- **Batch/strength variance**: Highland Park Cask Strength ships as annual releases whose ABV climbs across batches (No.1 63.3 → No.5 64.7). Keep image + abv + description internally consistent — used Release No.5 (64.7%) with its lovescotch label. Videos reference the series (No.1/No.3/No.4) which is fine for a series product.
- **Distilleries table has only `name_es/name_pt/name_en/name_ja` (+description same) — NO `name_fr`** (STALE — see 2026-08-27 batch above: fr columns exist since task 034; superseded by that entry). Historical note: French distillery display fell back to base `name` at the time.
- **French influencer reviews are consistently scarce even for mainstream bottles** (Talisker, Dalwhinnie, Glenfiddich, Jameson, HP all yielded ≤1 genuine French video): fill the fr floor with the English review reusing a distinct or same URL — the `laphroaig-lore` precedent reuses the same URL across en+fr. Genuine-French picks that worked this batch: Talisker `MyMr7awSXEU` (Le Whisky Brunch E21), Dalwhinnie `Tbg2E_LHE7Y` (Spirituosités), Glenfiddich `ALI6m7ukfvQ` (AlexWhiskyBlog), Jameson `pIp8AlT2bMs` (Le Whisky Brunch E22).
- **`node scripts/yt-search.mjs "<query>"`** (see TOOLS.md) is the fastest discovery path: dumps `<id>\t<len>\t<channel>\t<title>` from the results page. Always confirm with oEmbed before assigning a locale slot, because the auto-translate trap (French-looking title on an English channel) still bites.
- Seed writes: use a temp `.mjs` script inside `/workspace` that does `JSON.parse` → push → `JSON.stringify(..., '\t')+'\n'` to append one product/distillery without disturbing the rest of the file. New distillery → same product `distillery_id` referenced in the product record; db-sync seeds distilleries before products.

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

## 2026-08-27 — Jameson videos research (5 languages)

- YouTube search-page scraping (`/results?search_query=<q>` → regex `videoId` + nearby `headline.simpleText`) is the reliable discovery method; websearch mostly returns blogs, and plain text of the results page is JS-rendered and useless.
- The auto-translated-metadata trap hit hard on this one: EVERY French query (QC, dégustation, avis, critique, test, blog terms) returned English videos whose titles were machine-localized to French (e.g. The Whiskey Chaser's "JAMESON ORIGINAL | Critique de Whisky Irlandais", Whiskey Nerd, Whisky.com "Jameson", USA Kilts "Jameson vs Bushmills"). oEmbed title + author_name is authoritative for real language; if the actual title is English, assign to en.
- Genuine French-language Jameson review videos are very scarce: after ~6 targeted searches the only confirmed French Jameson video was Le Whisky Brunch E22 (`pIp8AlT2bMs`). Chef Verrecchia's "dégustation" video surfaced in Jameson queries but its description is a generic sponsored collab with no Jameson mention — not usable as a Jameson review. Don't force a French slot; flag the gap rather than mislabel an English video.
- oEmbed is the verification gate: `curl https://www.youtube.com/oembed?url=...&format=json`; non-200/invalid-JSON or "Unauthorized" (embed-blocked) → discard. `zpyRjbPq8dU` was embed-blocked.
- Strong verified slots this round: en (Irish Whiskey LAD `ygU5FWqRmyA`, Whisky Central `9SLPBQ0EWb4`, Honest Sips, No Nonsense Whisky), es (Tito Whisky, We Don't Speak Anthropomorphic, WHISKY A Puertas Cerradas, Casa Baviera), pt (Tierri Whisky, WhiskyBrasil.com, Whisky com Gringo, Além do Rótulo), ja (No.1 Irish review, 正直レビュー, 飲み方 tasting, ステイサム intro). Prefer Original-focused reviews over variant/Black Barrel ones.

## 2026-08-27 — Pin origins + active origin first (task 051)

- The 041 design note (MAX_VISIBLE_ORIGINS=7, "More origins" overflow dropdown, `visibleOriginsWithPinned`) is STALE — the shipped UI is a single flat scrollable list of all 12 origins in both `OriginFilters.svelte` and `Drawer.svelte`. Before adding a client feature on top of origin filtering, verify the actual current markup; task specs can reference structures that no longer exist.
- Client-only reactive preferences follow the `view.svelte.ts` rune-store pattern (module-level `$state`, `browser` guard, `_hydrated` flag, `localStorage.setItem` in the setter), NOT the SSR cookie pattern used by `filters.svelte.ts`. Pinned origins are a pure client preference, so a dedicated `stores/pinned-origins.svelte.ts` mirrors `view` — it keeps `utils/origins.ts` stateless (only a pure sort helper reads the store).
- Assigning an inner action button (like Pin) on top of a whole-row/card `<button>` requires a wrapper `relative` container so the pin can be absolutely positioned (OriginFilters) or a sibling in the row flexbox (Drawer); the pin `onclick` must `event.stopPropagation()` to avoid triggering row navigation/expand.
- Lucide `Pin` is available; its outline↔filled toggle is done via the `fill` prop (`'none'` → outline, `'currentColor'` → filled, color via `text-accent`).
- Sorting precedence: "all" → active origin → user-pinned (by count) → hardcoded baseline pinned (`['canada']`) → rest by count. Baseline pinned only acts as a fallback so a pinned-but-then-unpinned origin list doesn't drop canada; it's still shown regardless once implemented.
- i18n: new message keys (`origin_pinned`/`origin_unpinned`) must be added in tandem in messages/{en,es,pt,ja,fr}.json. The paraglide `_index` module is regenerated by the Vite plugin on `vite build`, but `svelte-check` alone does NOT pick up new keys — run `npx paraglide-js compile --project ./project.inlang --outdir ./src/lib/paraglide` after editing messages (see task 052 note) before `npm run check`.

## 2026-08-27 — Back to top button (task 052)

- Paraglide generated messages (`src/lib/paraglide/`) are NOT regenerated by `svelte-kit sync`/`svelte-check` alone — `svelte-check` fails with "Property does not exist on _index" right after adding a fresh message key. Run `npx paraglide-js compile --project ./project.inlang --outdir ./src/lib/paraglide` (or a `vite build`) to regenerate; then `npm run check` goes green. This overrides my earlier note from 051 that build-only was enough — for the editor/check pipeline, compile explicitly.
- z-index hierarchy in this app (verified for stacking): Header is `sticky z-40`; Drawer, Modal, SearchBar dropdown are `z-50`; Toast + top nav-loader are `z-[60]`. A fixed bottom-right utility button at `z-40` stays below all overlays as required.
- Back-to-top visibility pattern: `<svelte:window bind:scrollY={y} />` with `y = $state(0)`, `visible = y > 500`, and show/hide via `transition-all duration-300` combining `opacity-0/100` + `translate-y-2/0`, plus `pointer-events-none` on the hidden state so the fixed 48px square never blocks clicks near the footer. Add `inert={!visible}` to drop it from tab order when hidden.
- Styling convention for neutral utility buttons: `rounded-full border border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-white` (matches VoteButton inactive state).

## 2026-08-27 — Batch of 5 whiskies + 5 distilleries (Raasay, The Hearach, Abhainn Dearg 10, Shetland Reel, Lagg Kilmory; task 055)

- **Text-injection at end of whiskies.json — the clean recipe that finally worked**: build the record with a `render(obj, depth)` function (tabs: object keys at depth, array items at depth+1, item fields at depth+2), then replace the LAST occurrence of the anchor `\t\t}\n\t]\n}\n` with `\t\t},\n<block>\n\t]\n}\n`, and **`JSON.parse()` the constructed string in memory before writing**. This replaces the earlier regex-with-`$1` approach whose catastrophic behavior caused this batch's debugging: after a failed insert the document still parsed (valid JSON) but the new product block had been nested INSIDE the previous product's `influencer_videos` array (a "ghost" entry, still 204 products, torabhaig showing 11 videos) and a trailing-comma left `raasay` unparseable in distilleries.json. Diagnosis rule: after any seed-append, check BOTH the count AND that the last record has the expected `id` (not a nested object), and always validate the full file parses.
- Repair technique for a corrupted tail: truncate at the last known-good marker (the last `\t\t\t\t}` = previous product's final influencer_videos item close), then rebuild the tail by hand (`\t\t\t]\n\t\t},\n<block>\n\t]\n}\n`). Ordering detail: `JSON.parse` fails at the injected `{` unless `\t\t},` is re-emitted after slicing (extends the 054 "anchor bug" note).
- **YouTube captions JSON as a language verdict**: for ambiguous channels, `curl` the watch page and grep `"captionTracks"` — an `autocap`/ASR track of `lang=xx` (`"name":{"simpleText":"Inglés (generado automáticamente)"}`) proves the spoken language even when the title/channel look otherwise. That's how "Whiskyexperts :: Stuart Nickerson über seine Saxa Vord..." was gold-starred English (German title, English ASR) — still dropped, but the technique is portable.
- Same auto-translate trap, new faces: dynoguy's "Recorrido por la destilería - Abhainn Dearg" has a Spanish thread but the YouTube title is English (Hispanophone channel, English-voiced video — rejected for es); "De Vlaamse Whiskyfanaten" (Flemish) and 2rHsnvL_9eY ("PL 40%") are not the languages their titles might suggest. oEmbed title + known-bilingual channel ("Ale Degustation" = English arm of Polish "Ale Degustacja", verified via Google result "presents English Single Malt Whisky") is the trust gate, ASR tracks when you need proof.
- **Niche-territory floor**: Abhainn Dearg and Shetland Reel ship with **4 EN videos only** — no genuine es/pt/ja/fr exists after multiple query languages. That is now the honest floor for very-niche bottlings (embrace it; do not pad with wrong-language or duplicate URLs, per the 054 ruling). Shetland Reel: 47% ABV official (blend of cask-strength Speyside/Highland/Islay malts diluted with Unst water; note Whisky.com's 40% entry is a later batch).
- **Shop-image ladder for brands without clean bottle shots**: Abhainn Dearg's own sites (abhainndearg.co.uk 403, abhainndeargdistillery.co.uk 401, Ecwid store = JS SPA with empty og:image) forced scotchwhisky.com's news og:image (two-bottle wide shot — "acceptable but not ideal"); for Shetland Reel the whisky isn't in the live Shopify collection anymore, but the ~/pages/...-history blog HTML still hosts the original bottle PNGs at their old `cdn/shopify.com/s/files/1/1383/4499/files/...` URLs — fetch blog/news/pages pages, not just /collections. Lagg's clean 1000x1000 came from the arranwhisky.com shop assets dir (`/assets/000/001/394/...PNG`).
- When authoring foreign-language seed descriptions, watch for typo-loans: a stray Latin fragment survived into a ja description ("スピーターバーグ…") — a post-write `node -e` string replace + JSON.parse revalidate fixed it (bad found: true → cleaned).
- Coordinates: Abhainn Dearg 58.170573/-7.044877 (whisky.com map link), Saxa Vord 60.7978/-0.824 (Wikipedia geohack), Lagg 55.4457/-5.2361 (whisky.com DB coords, matches geohack neighbourhood) — all anchored before insert this time, map verified via exported `distilleries.json` having all 5 with lat/lng.
## Aberlour influencer video sourcing
- YouTube oEmbed needs pacing (sleep 1), else burst rate-limits return empty bodies.
- Japanese Aberlour = アベラワー / A'bunadh = アブーナ. French direct reviews of the 12 exist (Avis Avise); 16 requires same-distillery widening in French.
- created_at upload dates aren't in oEmbed; kept null rather than guess.

## 2026-08-28 — Task 060: 10 Speyside whiskies + videos + 3 distilleries

- **Trust nothing from subagents — the verification loop is mine.** Four parallel `general` agents returned 150 candidate URLs; every single one passed oEmbed (0 dead), but their coverage looked suspiciously perfect. I consolidated all 150 IDs and re-verified each with a single scripted loop (`fetch youtube.com/oembed?url=...`) printing author+title, then hand-curated the final set. The spoken-language judge is always the oEmbed `author_name` + `title`.
- **Curated per-language counts (floor 2, 4 where honest reviews exist):** Glenfiddich 18 → 4/4/4/4/4 (20). Glenlivet 12/FR/18 → 4/4/2/4/4 (18 each; fr capped at 2 via GQ France + La Centrale widening since no genuine fr 12 exists). Macallan Double Cask & Sherry Oak → 4/3/2/2/2 (13). Macallan Triple Cask 15 → 2/2/2/2/2 (10; only honest 2 per lang). Aberlour 12 → 4/4/3/4/4 (19). Aberlour 16 → 4/2/2/2/2 (12, fr via same-distillery interview). A'bunadh → 4/2/2/4/4 (16).
- **Whisky-specific search nuggets:** A'bunadh = アブーナ in ja (not アバラッハ). Aberlour 16 has no genuine es review → used 18/14 same-distillery videos (floor 2). Macallan Triple Cask 15 is thin (no ja exact) → CROSSROAD LAB 飲み比べ. Every non-4 language is an honest dry in-language spot, not laziness.
- **`description_es` may stay NULL on distilleries while base `description` (Spanish) is populated** — `_es` is implicit in base; `l10n()` falls back to base. So after backfill "0 of 77", the 3 new distilleries legitimately show only `_es` NULL. Verdict query must exclude `_es`: `WHERE description IS NULL OR description_pt IS NULL OR ... _en/_ja/_fr` → 0.
- Distillery `macallan` (id `macallan`, not `the-macallan`); products correctly reference `distillery_id: macallan`. The Glenlivet → `the-glenlivet`.
- Pipeline verified: `npm run db:sync` (230 products / 80 distilleries / 760 videos) → `data:export` (230, all resolve distillery + images + videos ≥2/lang) → `npm run check` (0 errors, 25 baseline warnings). Queue lines 101–110 ticked.
- **Yamazaki DR + Yamazaki 12 curated per-language:** DR → en 4 (Whisky Shared, Kanpai Planet, Dave's Whisky, Whisky Bloke), ja 4 (ノンエイジ = the NAS/DR: アルコーギー, 晩ジロー, ITARU's BAR, サラリーマンたかし), es 2 (HABLANDO DE WHISKY x2), pt 3 (Tierri Whisky x2, Jornada do Whisky), fr 0 (no genuine fr narrator; hard floor unmet — Kanpai Planet DR is English-narrated only). 12yo → en 4, ja 4, es 3 (El Whisky Bar, Cultura del Whisky, + short mezcal lindo), pt 4 (Sanson x2, Tierri, Bebendo Whisky), fr 1 (only Deto; floor 2 unmet).
- **Search nuggets:** Yamazaki 12 ja = 山崎12年 レビュー/飲み比べ. DR ja = sold as 山崎ノンエイジ/山崎NA (the NAS single malt). Genuine French reviews of these exact Suntory single malts are essentially near-zero → honest fr shortfall, not laziness.

- **Japanese 5-batch final per-language:** Yamazaki DR → en4/ja4/es2/pt3/fr1 (fr = Le Whisky Brunch "BDF 3.3 Yamazaki"). Yamazaki 12 → en4/ja4/es2/pt4/fr1 (fr = Deto "Découverte"). Hakushu DR → en4/ja2/es1/pt2/fr0. Hakushu 12 → en4/ja4/es1(pt3)/fr0. Chita → en4/ja4/es4/pt2/fr1 (fr = Five Spirits). No genuine French Hakushu review exists on YouTube — runtime English top-up is the honest cover, not a gap I can close.
- **Language-detection trap:** search-result titles came back as French/Spanish translations of English videos (Kanpai Planet "Le pire Yamazaki?", Whiskey is a Journey "À déguster ou à éviter"). Fix: every candidate goes through oEmbed and the *English/canonical* title + author decides the slot; `"captionTracks" languageCode` confirms when in doubt.
- Pipeline: db:sync (83 distilleries, 825 videos), data:export (235, unique slug dedup — seed holds a duplicate `octomore`), `npm run check` 0 errors.

## 2026-08-29 — YouTube research: use innertube search + oEmbed + caption asr to verify video language

- `youtube.com/results` needs JS (returns only a consent/shell page). Fix: call the unauthenticated **innertube search endpoint**
  (`POST https://www.youtube.com/youtubei/v1/search?key=<WEB key>` with a WEB client JSON body) — returns `videoRenderer` entries with raw videoId/title/channel/length.
- **Search-result titles are auto-translated into your query language and MUST NOT be trusted** (same warning applies to the innertube hits too). The canonical, reliable title+author comes from `https://www.youtube.com/oembed?url=<watch URL>&format=json` (HTTP 200 = valid; use its `title`/`author_name`).
- To confirm the SPOKEN language: fetch the watch page and regex `"captionTracks":([...])`; each track's `languageCode`/`kind`. The auto-generated track (`<lang>/asr`) reflects the language YouTube detected in the audio — `es/asr`, `pt/asr`, `ja/asr` reliably confirmed Spanish/Portuguese/Japanese speech. No native track / only `en/asr` on a claimed-foreign channel = treat as NOT confirmed for that language (don't force a match).
- Auto-translated titles can even be *wrong language entirely* (e.g. an English whisky.com review showing a Japanese-titled search hit) — only oEmbed + caption asr decide.

## 2026-08-29 — YouTube verification quirks (Akashi/White Oak research)
- `youtube.com/watch` pages are rate-limited to a 3KB bot shell without ytInitialPlayerResponse → captions/lengthSeconds unavailable on many requests. oEmbed and `youtube.com/results` HTML remain dependable. Get duration from search pages via `"videoId":"<id>"...` + `"simpleText":"m:ss"` (avoid `label`, it's localized).
- Auto-translated titles pollute per-language search results; the ONLY canonical title+author source is oEmbed. Verify language with oEmbed, then captions when available.

## Kavalan influencer video top-up (ja/es/pt/fr) — 2026-08-29
- Searching YouTube by scraping `youtube.com/results` HTML and pairing `"title":{"runs":[{"text":...` with `videoId` works well and returns ORIGINAL (untranslated) titles — but you MUST trust only the oEmbed canonical title+author, because search snippets can be auto-translated (e.g. English "Kavalan Port Solist. Whisky in the 6 #297" and "Kavalan Solist Port Cask Review #36" appeared under Japanese queries but are English channels).
- Language ground truth reliably from watch-page `"captionTracks":[...]` `languageCode`+`kind` (asr vs manual). Japanese whisky channels overwhelmingly ship only `ja` ASR auto-captions; that's enough to confirm ja.
- oEmbed 401/Unauthorized (e.g. `URWTAeDQJA4`, `URHHVCmewyY`) = embed-blocked → discard; watch page may still exist but per rules require HTTP 200.
- Japanese Kavalan solist/concertmaster content is rich (ひとくちウイスキー, はっちばっち, まるなひと, 俺のモルト, CRAZY BARTENDER KEN). Exception: kavalan-solist-port dedicated ja is almost nonexistent — only ひとくちウイスキー's ポートカスク（ストレート）exists consistently across exhaustive searches.
- French Kavalan content is very thin: only La Maison du Whisky (LMDW) covers select N°1/N°2 + a "nos incontournables" overview. Most "fr" results are auto-translated en/es — verify oEmbed.
- Portuguese (pt-BR) has dedicated content only from Tierri Whisky (N.2), Jota Cellar (N°2), WhiskyBrasil (Port Cask Finish), Porção dos Anjos (Solist Bourbon) — solist-port/solist-vinho/concermaster pt dedicated reviews don't exist; use general "KAVALAN SOLIST" pt (Jornada do Whisky) as widening per rule 4.
- Spanish solist/ex-bourbon content is decent (Los Whiskochos, HABLANDO DE WHISKY, El Whisky Bar, Destila2, WHISKY BUBU, Piojo Whisky, La Whiskería); concermaster dedicated es is sparse.
- Many Kavalan "solist" videos are English (Whisky.com, Gwhisky, Cask and a Glass, WhiskyWhistle, Malt Mariners, The Whisky Enthusiast, Whisky "In the 6"); reject for non-en slots after oEmbed check.

## 2026-08-29 — Wave-2c1: reliable YouTube caption verification despite bot-blocks

- **Faulty method to avoid:** `grep '"languageCode":"..."'` over a raw watch page matched YouTube's embedded "auto-translate target" list (~110 language codes) and falsely flagged nearly every video as captioned. The honest signal is the FIRST entry of the actual `captionTracks` array (source lang + `kind`).
- **Block bypass:** `youtube.com/watch` intermittently serves a 387-byte bot-shell (no player response). The saved cookie jar `cj3.txt` + full Chrome UA restores real pages. Without cookies, both the watch scrape and the `youtubei/v1/player` POST return no captions — so prior claims of "verified" done without cookies are suspect and had to be re-run.
- **Two working primitives:** oEmbed (`oembed` API) for canonical title+author (fast, never blocked), and cookie-authenticated watch page → brace-balanced `captionTracks` parse for real source-language captions.
- **Domain insight:** Glenturret has effectively no captioned French reviewer content (only Armagnacs Darroze's single "Spiritueux du Mois" episode). Small French whisky channels caption rarely; the search engine auto-translates Spanish/English titles into French lookalikes. When a language genuinely can't reach the ≥2 target after exhaustive searching, record the honest found count instead of substituting or inventing — and put it in the handoff so the user can decide whether an official-distillery (uncaptioned) fallback is acceptable.

## 2026-08-29 — Wave-2c4: Talisker/Tobermory/Ledaig research (94 videos, all verified)
- Confirmed AGAIN: oEmbed canonical title is the only trustworthy title; search-result titles auto-translate in ALL directions (En→es, es→en, de→es, en→fr). Rejected this wave: McIntyre's (en), Sippers Social Club (en), Eat Smoke Drink (en), Whiskey Novice (en), Whisky Lock (en not fr), Bevvy (en), Sanson Ledaig-18 (pt not es), Whisky Neighbour (en not es).
- Delivered `/tmp/opencode/research/wave2-c4.json` with en/es/pt/ja/fr ≥2 for all 6 products; language confirmed per video by watch-page caption ASR track (cookie jar cj3.txt). Such caption verification has caught zero mismatches this wave — titles are reliable when the channel is a known native-language influencer.
- `timedtext?type=list` endpoint returned "none" for every test ID; that endpoint is dead here. Only useful caption source remains `youtube.com/watch` `captionTracks` with cookies.
- Genuinely dry spots (no dedicated review exists even exhaustively searched): Talisker 18 fr, Talisker DE fr, Talisker Storm fr, Talisker 18 es, Talisker DE es. All filled with same-distillery fallbacks (Talisker french/Spanish videos) — none marked dry. Ledaig 10 pt/fr fallbacks used Tobermory/Ledaig-family videos (Ledaig 18 pt via Sanson + Bebendo Whisky; Tobermory 12 fr via la centrale whisky + Le Whisky Brunch).
- Verified.json pattern: keep a single wave2-c4.json (per-product, per-language ≤4, no intra-product dup URL, "verified":true only post-oEmbed-200).

- Wave-2b2 (Laphroaig/Bowmore/Bunnahabhain, 8 products × 5 langs): again oEmbed canonical titles are the ONLY trust signal — my candidate pools contained many English channels German/Spanish-title-masked from YouTube's hl juggling (Whisky et Cie FR images were fine, but e.g. Gwhisky/thewhiskybothy/WineVoices appeared with es/fr-titled-搜索结果 auto-translates). Caption ASR (watch page + cj3 cookie jar) is the ground truth and confirmed every es/pt/ja/fr assignment except uncaptioned vlogs.
- New nuance: "channel in native language" ≠ "video in that language" — WhiskyBrasil.com's "Laphroaig Lore Review" (untitled English, no caption) got dropped from pt despite being a Brazilian channel; title+channel must BOTH be native, or a caption track must exist.
- Discontinued-expression mapping: Bowmore 15 "Darkest" is gone in many markets, so Japanese search only surfaces the successor 15yo sherry-cask finish — those `ja/asr` videos named "15年ダーケストの後継品" are the honest ≈match; don't force a fake "Darkest" title.
- Bottlenecks per language this wave: es strong (Los Whiskochos/Whisky o Muerte/HABLANDO DE WHISKY/El Whisky Bar), pt strong (Destilados Brasil/WhiskyBrasil/Tierri/Whisky Capital/Sanson), ja strong (ひとくちウイスキー series + 宅飲みバーTakeo + ITARU's BAR + つっちーのBar研究室), fr thin outside LMDW/lachaineduwhisky/Whisky et Cie/Malt à propos/Whisky Live Paris/Gouilland.

## 2026-08-29 — Balvenie DoubleWood 12 (new distillery + product, 15 videos)
- New distillery + product added (queue line ticked): 84 distilleries, 236 products, 1810 videos after db:sync+export; `npm run check` 0 errors/25 warnings.
- Video supply by language for Balvenie DW12: en/es strong (4 each verified), pt 3, ja 2, fr 1. French is genuinely dry — only Esprit Dégustation covers this expression in French; 2nd fr slot used same-channel Balvenie tasting (`F8bv2tXGaWI` THE BALVENIE@PARIS CAVE) as same-distillery fallback.
- `bj11tLQ0Osw` (passed to me as a Spanish DW12 review) oEmbed-404'd — always re-verify every foreign-search URL before use.
- YouTube raw `results?search_query=` scrape returns watch IDs cheaply and reliably; pair with oEmbed to get author+title for quick language triage. French/other queries surfaced mostly English/sommelier content → confirms thinness, doesn't fake it.

## 2026-08-29 — Balvenie Caribbean Cask 14 (2nd Balvenie product, 17 videos)
- Added via reused distillery record; en/es/pt all exact-expression-rich (4/4/4), ja 3 (2 exact + 1 same-distillery 12/15 drink-off), fr 2 (both same-distillery Esprit Dégustation — no French CC14 review exists). oEmbed-only, all 200.
- Watch the two Esprit Dégustation URLs (BL09nqm_E9U, F8bv2tXGaWI) are legitimately shared across DW12 and CC14 — same-distillery cross-product reuse allowed, no intra-product dup.
- Bottle image: official S3 from shop.us.thebalvenie.com (200cl SKU, current label) — whisky direct product pages are age-gated; the US shop attachments CDN exposes .full.jpg freely.

## 2026-08-31 — Task 053 Wave 2b batch 1 (big-pickle)
- Verified English videos legitimately present in the `en` slot of a product were being duplicated into the `fr` slot as bogus slots (intra-product dup). Fix = replace the mislabeled `fr` copy with a genuine native video, not delete the URL. Only 3 French alternatives existed for dalwhinnie-15/glenfiddich-12/jameson plus 2 for HP cask-strength — fugue: French taste-test supply is thin and cluster-native.
- Glengoyne is genuinely dry in es (15/18 only Tito's 4-expression multi), pt (10 only), fr (zero; no native French Glengoyne channel found), ja (21yo same-distillery fallbacks are the honest Ja floor).
- Batch label writes to Turso = one `tx.batch` of prepared statements; individual awaits over HTTP are ~40x slower and will time out at 120s on ~2k rows.

## 2026-08-31 — Task 053 Wave 2b batch 3 (big-pickle)
- Niche Highland/Speyside distilleries (AnCnoc, Balblair, Glencadam, Benromach, Glenallachie) have near-zero Japanese/French coverage; ja/fr mostly dry. Their en/es/pt pools are healthy.
- Irish producers (Dingle, Glendalough, Irishman) are en-dominant; non-English only sparse es/pt/fr.
- Smokehead (a non-distillery Islay-style brand) pulls mostly en with a few es/fr/ja; High Voltage/rum/sherry sub-expressions are thin.
- Keep agents to ONE task each and demand TSV-only output; multi-branch agents degrade into summaries.

## 2026-09-01 — Hankey Bannister review research (big-pickle)
- Invidious can return DESYNCED id↔title pairs; treat them only as hints, verify each final pick via yt-verify oEmbed before trusting language/expression.
- Brazilian Portuguese channels (Tierri Whisky, Vivian Leny Fins, Destilados Brasil) reliably cover value blended scotch exactly — good optional resource for similar cheap blends.
- A ja video whose title just says "Japanese-return whisky / 1000-yen whisky" is too ambiguous to list as exact Hankey; only explicitly named titles pass the exact-expression rule.

## 2026-09-01 — Batch 2 (Craigellachie 13/17, Cragganmore 12)
- Medium Speyside distilleries (Craigellachie, Cragganmore) have uneven influencer coverage: the 13/12 core expressions usually reach all 5 languages, but older expressions like the 17 often cap at English + Portuguese. Don't force a wrong-language video into an empty slot — leave it empty and let the runtime English top-up handle it.
- Language-titled auto-translated videos are a consistent trap on es/fr/ja searches: English channels (Gwhisky, Whisky.com, Whiskey Novice) get titles auto-translated, but oEmbed shows English narration. Always trust the canonical channel language, not the surfaced query language.
- Portuguese has surprisingly broad whisky-review coverage via Whisky Capital (Gustavo Araujo) — a good go-to for core Speyside expressions.
- Pipeline discipline confirmed: distilleries before products in seed, 3 scripts (db:sync → data:export → check) verify in ~1 pass, videos land in the flat `influencer_videos.json` keyed by product_id.

## 2026-09-02 — Glendronach 15 Revival influencer videos (big-pickle)
- English has the deepest exact-expression pool; verified Whisky.com / Erik Wait / Malt Muser / No Nonsense Whisky all name "Revival" in the oEmbed canonical title.
- Portuguese exact-expression coverage is strong for a mainstream single malt (WhiskyBrasil, Bebendo Whisky Eng. Milton Salgado, Sanson Single Malt).
- Spanish exact is thin but present (Whisky o Muerte, Julio Oñate) — Cultura del Whisky is embed-blocked, so omitting it left only 2.
- French exact expression is genuinely dry (no live in-language "Glendronach 15 Revival" with a confirming oEmbed title); Malta propos/Le Chardon titles are generic (don't prove the expression) and the Whisky on the West Coast GlenDronach comparison is embed-blocked → `fr` ships zero, runtime EN top-up covers it.
- Japanese exact-expression is 1 (もっさんハイボール倶楽部's 12/15 old-vs-new 4-bottle tasting); English Whisky Whistle's リバイバル video is machine-translated ja title on an English channel → keep out of ja.
- Auto-translate trap this round: Scotch 4 Dummies & Whisky Wars produce Spanish/French/Japanese auto-localized titles for their English reviews — oEmbed author proves they're `en` only.

## 2026-09-03 — Local SQLite migration architecture

- Swapping remote Turso for a local SQLite file in SvelteKit is a multi-part change, not just a connection URL: it forces `adapter-node` (or any long-lived process) because serverless functions can't hold an open writable SQLite file — you must leave the Vercel `adapter-vercel`.
- `@libsql/client` supports `url: 'file:...'` (tests already use `file::memory:`), so the initial detach can keep the `Client` interface and all server modules untouched before deciding on a native driver (`node:sqlite`/`better-sqlite3`).
- Persistence in a container is only real if the SQLite file lives on a bind-mounted/volume path outside the container image — otherwise every rebuild resets live data.
- The catalog-scale rationale is better served by an SQLite-backed search index (e.g. FTS5) than by sharding build-time JSON — hence 056–059 being superseded by 067.

## 2026-09-03 — video-export shape & niche-language foraging

- `src/lib/data/influencer_videos.json` is a flat array of `{product_id, language, platform, url, label, ...}` rows from Turso; the seed nests the same data per-product under `influencer_videos[]`. Parity scripts must reconcile these two shapes by `(product_id, language, url, label)`.
- Exact-expression rule strictly outranks "fill a slot." Small craft whiskies (Madoc, La Alazana Peated, Catto's 12/25) are genuinely dry because reviewers taste the distillery/range, never the exact bottle. Shipping the generic/wrong-expression video is worse than shipping none.
- Native-language feature/interview content can be the only real coverage for micro-batch distilleries (Casanegra, EMC Pampa) — it's expression-exact and in-language, even if not a "formal tasting." Judges should weigh local-language coverage priority (owner directive) against the formal-tasting soft preference.

## 2026-09-03 — mainstream single malts have deep foreign coverage; niche don't

- Famous single malts (Arran 10, Glenfarclas 105/12, Balblair) have abundant es/ja/pt/fr reviews — always search all languages for mainstream products, they fill fast. Ultra-niche (Cu Bòcan, Penderyn portwood, Wolfburn, community distilleries) are en-only or dry.
- Invidious is degrading (mostly `inv.nadeko.net` now); native yt-search.mjs carries the load. Don't over-rely on Invidious — run both.
- Auto-translated titles of English channels (Whisky.com, thewhiskybothy, Ralfy, Whiskey Vault) keep surfacing in es/pt/ja/fr searches — oEmbed author is the only reliable gate.

## 2026-09-03 — two-side of the foreign-coverage coin

- The same auto-translation trap cuts both ways: it inflates false es/pt/ja/fr candidates on niche products, but on truly-famous single malts the genuine in-language coverage is deep. The deciding factor is always the oEmbed author/language, never the displayed search title.
- Diminishing returns: after 5 waves the remaining gaps are dominated by products that genuinely lack foreign-language, exact-expression reviews (community distilleries, NAS/comparison expressions, Argentina/India micro-brands). Filling further requires either relaxing the exact-expression rule (rejected) or accepting honest-dry floors and closing out the task.

## 2026-09-03 — exhaustion is a signal, not a failure

- After 4 dedicated waves the per-wave yield fell 65→17→5. When five independent agents each return "dry" for the same product across a language, that is empirical confirmation the coverage doesn't exist — not a search failure. The correct engineering response is to stop expanding and document the honest-dry floor.
- Language-specific coverage ceilings differ by market: ja/es/pt have broad single-malt reviewer communities; fr is the weakest, skewing to well-known brands only. Plan foreign-language fill ratios expecting fr to be the bottleneck.
