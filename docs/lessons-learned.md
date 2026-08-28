# Lessons learned (errors and corrections)

## 2026-08-28 — Hotlinkable bottle image sourcing: whiskybase static CDN is IP-blocked here

- `https://static.whiskybase.com/storage/whiskies/<...>-big.jpg` returns **403 from this environment**
  (GET and HEAD, with or without UA/Referer; node fetch too). It's an IP/datacenter block, not a header
  issue — so per the "must validate with curl" rule, whiskybase static URLs canNOT be delivered as
  "validated" from here even though they hotlink fine from residential browsers.
- Working substitutes (validated HTTP 200 + image/*):
  - **HTFW product-image CDN**: `https://www.htfw.com/media/catalog/product/cache/<hash>/l/p/lp<NNNN>_<N>_<N>.jpg`
    (the `<hash>` prefix `801b826746c417a51e3d96b449906a0f` is the main product-shot cache; images are
    white-background bottle shots, 1600x900). Page HTML is 403 (bot-protected) but the media CDN is public.
  - **Whiskybase shop CDN** (webshopapp): `https://cdn.webshopapp.com/shops/242291/files/<fileid>/650x750x2/image.jpg`
    — page scrapeable, gives clean per-product image file IDs; serves jpeg or png.
- To find HTFW `lp` codes when the page is blocked: the code appears in search-result snippets / brand
  listing pages (og/catalog image URLs), e.g. Yamazaki DR=lp5484, Hakushu DR=lp5485, Hakushu 12=lp3577.
- To read image dimensions without python/imagemagick: node parses PNG IHDR (bytes 16-20) or walks the
  JPEG SOFn markers.

## 2026-08-28 — Frontend must stay on build-time JSON snapshot, not DB

- User made explicit: the build-time JSON snapshot is what the frontend should ALWAYS use; its whole
  point is fast product load. Admin is the ONLY thing reaching Turso directly (to later generate the JSON).
- This is the core architecture. Scaling plan must restructure the JSON snapshot (shape + lazy loading),
  never introduce DB round-trips on home/detail/search routes. Videos/reviews/ratings are dynamic
  user content and legitimately DB-backed — separate concern from the catalog snapshot.
- When planning a scaling task, first measure the data: full record ~4KB/product (~117MB @ 30k),
  slim card ~330B/product (~9MB @ 30k). That split (slim index vs. lazy per-product detail) is the key lever.

## 2026-08-28 — Batch of 10 whiskies (Campbeltown + Glenfiddich 15): write-before-validate seed corruption

- **Bug**: a Node script that edits `data/seed/whiskies.json` (removing `video: null` + injecting `influencer_videos`) called `writeFileSync(file, text)` **before** `JSON.parse(text)` validation. The injection regex produced invalid JSON, but the file was already written to disk by the time the parse threw — the `git checkout` from the ramp proved it had corrupted the working file.
- **Rule to internalize**: ANY script that rewrites a seed/JSON file must validate the constructed string (`JSON.parse`) BEFORE writing, and only write on success. Never write-then-validate.
- **Fix**: `git config --global --add safe.directory /workspace` (dubious-ownership guard), then `git checkout -- data/seed/whiskies.json` to restore. That reverted my 10 uncommitted products, so I re-ran the original `addproducts.mjs` (which survives in `/tmp/opencode/`) to re-append them, then applied videos via a JSON-object-based script (`JSON.parse` → set `influencer_videos`/`delete video` → `JSON.stringify(data, null, '\t')`).
- **Prefer JSON-object mutation over string/regex surgery** for multi-entry edits: regex-with-`$1` text injection is fragile (anchors, trailing commas, lookaheads bite), while load→mutate→stringify is deterministic and self-validating. Re-stringify is acceptable here because the add-products pipeline already rewrites the whole file with `JSON.stringify(..., '\t')`; the diff footprint is established, not novel.
- **Verify before writing**: after re-adding, checked product count (219), that all 10 slugs exist, `video` field removed, distillery_id/region/abv correct.

## YT video sourcing (task 060 Aberlour run)
- Batch oEmbed checks hit YouTube rate-limit (empty/429 responses). Throttle to ~1 req/s or all calls fail JSON parse.
- French-language Aberlour content is scarce: Avis Avise, Le Whisky Brunch, Whisky!Catacat, SO Whisky, La Vignery, Thierry Dailleux, Chassons TV are the fr sources; 16-ans has no direct fr review, so widen to same-distillery (fr brand videos).
- Spanish/Portuguese/Japanese cover well; "Drink And Discover" A'bunadh channel language unverifiable — dropped.

## 2026-08-28 — Task 060 completed: verification gotchas (video curation + distillery ids)

- **All returned candidate URLs were dead-checkable but not trustable.** 4 parallel agents returned 150 URLs, every one passed oEmbed — but I still re-ran the full verification loop myself and hand-curated the final set (capped 4/lang, floor 2, deduped per product). Never assume an agent's "verified" language claim; the oEmbed title + author is the gate.
- **Query the right distillery id.** A verification query using `the-macallan` returned `undefined` coords — the real id is `macallan`. Wrong id → false "missing" alarm. Always confirm distillery ids from the seed/export before querying.
- **`description_es` NULL is not a defect.** Spanish is the DB base (`description`), so `_es` stays null on the 3 new distilleries; `l10n()` falls back to base. The null-verdict must exclude `_es`, else it misreports complete rows as gaps.

## 2026-08-28 — Video modal sizing fix

- **Tailwind arbitrary classes passed as component prop values are fine.** `width="w-[90vw] lg:w-[80vw]"` in the markup attribute gets picked up statically; Tailwind v4 scans raw file text, not just the template. Verified generated CSS: `.w-[90vw]{width:90vw}`, `.lg:w-[80vw]{width:80vw}`, `.max-h-[calc(92dvh_-_3rem)]{max-height:calc(92dvh - 3rem)}`.
- **Don't size a modal by % of its own wrapper.** `w-full` inside the centered flex frame resolves circularly against the auto-sized flex item and can push the panel past the viewport (mobile overflow). Give the panel an explicit viewport-relative width instead, and add `max-w-full` on the frame wrapper as a universal guard.
- **Mobile video modal must not be flush to viewport.** `w-[calc(100vw_-_2rem)]` leaves zero visual margin and the bare modal's `-right-3` close button escapes the screen edge. `w-[90vw]` gives real margins and keeps the button inside.
- **Underscores in arbitrary values mean spaces**: `calc(92dvh_-_3rem)` → `calc(92dvh - 3rem)`.

- **YouTube search-result titles are localized and MISLEAD for language detection.** Searching with a specific locale (or the env default) returns *translated* titles, e.g. a genuinely English video (Kanpai Planet) shows "¿El peor Yamazaki?", "Le pire Yamazaki?" across languages; Good Juice/The Whisky Diary English video surfaces with French/Spanish titles. oEmbed returns the true title/author but not the spoken language. To confirm narration language, scrape the watch page and read `"captionTracks"` → `"languageCode"` (`en`/`es`/`ja`/`pt`/`fr`). Only count a video toward a language slot when its ASR caption language matches the slot; never trust the search-page title string.

## 2026-08-28 — Japanese batch (Yamazaki x2, Hakushu x2, Chita) videos

- **YouTube search-result titles are auto-localized; oEmbed titles are ground truth.** Querying `youtube.com/results` for "hakushu ... avis", "en español" etc. returned French/Spanish *translated* titles for genuinely English videos (Kanpai Planet showed "Le pire Yamazaki?", "Critique de Hakushu", etc.). Search-page titles are auto-translated per region and mislead language detection. Always re-check each candidate via `oembed?format=json` and judge language from the returned title/author. Net effect: fr is genuinely near-empty for these Suntory SKUs — not laziness.
- **final full-verified counts:** DR → en 4, ja 4 (山崎ノンエイジ), es 2 (HABLANDO x2), pt 3, fr 1 (Le Whisky Brunch). 12 → en 4, ja 4 (山崎12年), es 2, pt 4, fr 1 (Deto). Hakushu DR → en 4, ja 2, es 1, pt 2, fr 0. Hakushu 12 → en 4, ja 4, es 1, pt 3, fr 0. Chita → en 4, ja 4, es 4, pt 2, fr 1.
- **Seed `whiskies.json` carries a pre-existing duplicate `octomore` slug** (indexes 188 & 218). `data:export` writes unique slugs → 235 rows from 236 entries. Flagged, not in this batch's scope.
- **Pipeline:** db:sync (distilleries 80→83, videos 760→825), data:export (235), `npm run check` 0 errors / 25 pre-existing warnings. Queue lines 302-306 ticked.

## 2026-08-28 — Login/Review/Language modal width regression (fix)

- **A `width:100%` child inside an auto-sized flex item collapses.** The video-modal fix wrapped every panel in `div.relative max-w-full` (new flex child, shrink-to-fit). Panels sized by relative `w-full` (Login `max-w-sm`, Review `max-w-md`, Language `max-w-xs`) then resolved their % width against an auto parent → treated as `auto` → card collapsed to content width (login hugged the Google button). Video passed an absolute `w-[90vw]`, so it stayed correct.
- **Put width on the element that is the actual flex child.** Fix: wrapper `relative ${width} ${maxWidth}` (it is the flex item, sized like the old panel was), panel hard-codes `w-full` and fills it. No circularity; close-button anchoring (`-right-3 -top-3` on the `bare` ×, header × otherwise) derived from the same wrapper box → unchanged.
