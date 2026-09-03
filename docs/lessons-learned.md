# Lessons learned (errors and corrections)

## 2026-09-02 — Batch of 5 whiskies (Royal Lochnagar 12, Royal Brackla 12, Blair Athol 12, Loch Lomond Original, Inchmurrin 12)

- **Diageo `malts.com` product image URLs return HTML, not images** (the Classic Malts pages are client-rendered; the `.../packshot.png` guesses 404). Use retail CDN sources instead: `thespiritco.com/cdn/shop/products/...` (Royal Lochnagar 12), `whiskeyreviewer.com/wp-content/uploads/...` (Royal Brackla 12), `jeffreyst.com/cdn/shop/files/...` (Blair Athol F&F), `cdn11.bigcommerce.com/images/stencil/...` (Loch Lomond Original), `theliquorbarn.com/cdn/shop/files/...` (Inchmurrin 12).
- **`curl file` is the ground truth for downloads** — a `231`/`200` HTTP code on a guessed product CDN URL can still be an HTML doc. Check `file <download>` before converting; the failed `.png`/`.webp` guesses were HTML.
- **Loch Lomond Original is 40% ABV with no age statement, Inchmurrin 12 is 46% non-chill-filtered** (three American oak cask types, straight-neck stills). Both are Highland (distillery at Alexandria, 55.9923,-4.5766).
- **Video coverage diversity confirmed again:** Blair Athol 12 (es/fr/ja/en — no pt), Loch Lomond Original (es/pt/ja/en — no fr), Loch Lomond and Royal Brackla (all five), Royal Lochnagar (en/ja only) all shipped honest-search results with no padding; English tops up.
- **`ON CONFLICT DO NOTHING` for the 4 new distilleries** — each record was complete (coords + 5-locale descriptions) on first insert so they plot on /map and render localized.
- **Inchmurrin 12's sub-assigned French slot `kRuJCrA9Am4` was actually an ENGLISH-spoken video** ("Inchmurrin 12 year old single malt whisky review", channel Whisky Lovers Society) mislabeled `fr` by the search sub-agent. Caught via oEmbed — a non-localized video must not be placed in a non-`en` slot. Removed and re-synced; no genuine French Inchmurrin 12 review exists, so `fr` ships empty (English tops up at runtime).

## 2026-09-02 — Batch of 5 whiskies (Glenglassaugh Portsoy, Clynelish 14, Glendronach 12/15/18)

- **Glendronach og:image URLs use `_2-1` / `_2-2` suffixes, not the obvious `_1-1`.** Guessing `GD_15YO-1-1.png` / `GD_18YO-1-1.png` 404s; the real files are `GD_15YO-2-1.png` and `GD_18YO-2-2.png` (confirmed via the product page's `og:image` meta). Always scrape the `og:image` meta rather than guessing the filename pattern.
- **whiskybase CDN 403s persist** for `static.whiskybase.com/...` — the working Clynelish 14 image was `img.thewhiskyexchange.com/900/clyob.14yo.jpg`.
- **A "Portuguese" channel is not a Spanish channel.** Tierri Whisky (`w-Lyn-URRHc`) review of Portsoy is Brazilian Portuguese ("Avaliação..."), so it belongs in `pt` only — do not also slot it under `es`. Verify the narration language from the oEmbed title, not the channel name.
- **Video coverage varies by product:** Portsoy is thin (en4 / pt1 / ja1 — no exact es or fr review exists despite full native+Invidious+oEmbed search); Clynelish 14 is the richest (en4 / es4 / ja4 / fr2 / pt1); Glendronach 12 (en/es/pt/ja all ≥3, fr0), 15 (en4/es2/pt3/ja1, fr0), 18 (en4/es2/pt3/ja3, fr0). French exact-expression reviews for Glendronach core range simply don't exist — English top-up covers those slots at runtime. Do NOT pad.
- **Two new distilleries** (Glendronach 1826 / Forgue, Aberdeenshire 57.4847,-2.6255; Clynelish new 1967 / Brora 58.0243,-3.8692) with full 5-locale descriptions + coords so they plot on /map on first insert (`ON CONFLICT DO NOTHING`).

## 2026-09-02 — Batch of 5 whiskies (Aberfeldy 21, Ardmore Legacy, Ben Nevis 10, Deanston 12 + Virgin Oak)

- **whiskybase.com image URLs 403 with the default request.** Several candidate images (`static.whiskybase.com/storage/...`) returned HTTP 403. Swap to a different working source instead of retrying: `img.thewhiskyexchange.com/330/...` (Aberfeldy 21), the official distillery PNG (Ben Nevis 10), `img.thewhiskyexchange.com/540/...` (Deanston Virgin Oak) all worked.
- **`data:export` does NOT embed videos in `whiskies.json`.** Product objects carry a `videos` array, but the flat `src/lib/data/influencer_videos.json` (keyed by `product_id`) is the authoritative count. Verify per-language video counts there, not on the `whiskies.json` product.
- **`videosForLocale` requires a min of the localized videos and tops up with English** (`src/lib/utils/videos.ts`). Shipping fewer than 4 for a thin language (es/pt/ja/fr) is fine and expected — English fills the row. Aberfeldy 21 (es 0), Ben Nevis 10 (pt 0), Ardmore Legacy (fr 0) all shipped thin on honest-search grounds.
- **Multi-expression tastings qualify.** A Portuguese video tasting Aberfeldy 12/16/21 together (`C4tHWTBl33g`) is a legit exact-expression PT slot for the 21 — it covers the 21 among the set.
- **New distilleries run `ON CONFLICT DO NOTHING`** — the Ardmore, Ben Nevis and Deanston records had to be complete (coords, all 5 locale descriptions) on first insert or they'd stay broken.

- **whisky.my image CDN needs UPPERCASE upload slugs.** Lowercase guesses (`aberfeldy-16-year-old.webp`) 404; the working form is `.../wp-content/uploads/ABERFELDY-16-Year-Old.webp` (captialized like the actual filename). It 307-redirects to a real JPEG — follow redirects with `-L` and check `file`, don't trust the `curl -w %{http_code}` alone (307 ≠ actual content).
- **More confirmed image sources** for the fallback ladder: `cdn11.bigcommerce.com` (Signet, Aberfeldy 12), `www.liquoronbroadway.com/cdn/shop/products/*.png` (Quinta Ruban 12), `cdn.shoplightspeed.com` (Oban 14). All download and convert to 500×500 webp cleanly.
- **Invidious titles are sometimes garbled/mismatched** — e.g. a Spanish "Aberfeldy 12" search returned `zn96Uppitc4` whose oEmbed title proved to be Glenfiddich 12, and `70UU…`-style IDs whose true channel/title differed from the search result. oEmbed (via `yt-verify.mjs`) is the only authority for both exact-whisky and spoken language.
- **Official brand-channel tastings can be the wrong language for a slot.** The Aberfeldy 16 official "Tasting" video (`pmCi1SKIawk`) is English-spoken but a search surfaced it under a Japanese query with a Russian auto-label — it belongs in `en`, never `ja`. Always judge spoken language from oEmbed author/title, not the query language or the label text.
- **Quinta Ruban "12" vs current "14" bottling:** the present-day bottle is 14 YO (relaunched 2021). Many reviews searchable now target the 14; only videos that name/review the **12 YO Quinta Ruban** (or a 14-vs-12 head-to-head) qualify for this product. The 14-only clips were rejected.
- **Fail-thin language results shipped as-is:** Quinta Ruban 12 (pt 1, ja 1, fr 0), Aberfeldy 12 (fr 0), Aberfeldy 16 (ja 0, fr 0) after multi-source searching found no genuine exact-expression video in those languages. English top-up fills the gaps at runtime — never pad a slot with a non-exact or wrongly-languaged video.
- Reconfirmed pipeline check: videos live in the flat `src/lib/data/influencer_videos.json` keyed by `product_id` after `data:export`; the `whiskies.json` product objects don't embed them. Count there.

## 2026-09-01 — YouTube search: Aultmore 12 (youtube-search skill)

- **French query prefixes overridden by native `yt-search`.** Every French query ("Aultmore 12 ans dégustation test avis") returned only English/Spanish channels with YouTube's auto-translated English titles — no genuine French Aultmore 12 review exists (only French channels doing other whiskies). Skill rule applied: ship zero for `fr` rather than pad with a non-French video. `Malt à propos` and `Les Grands Alambics` are French *channels* but their featured videos were Macallan/rhum, not Aultmore 12 — don't grab a same-channel different-whisky video.
- **Invidious auto-escapes HTML entities** (`Can&#39;t`), so read `|||`-split titles carefully; oEmbed is the authority.
- **One Invidious candidate (dBrjv_ph_Bc) verified as a DIFFERENT whisky** (Aberfeldy 12) even though it appeared in the Aultmore 12 Japanese search — always oEmbed-verify, never trust query relevance or translated titles.
- **Embeds: `ATGdhRk4zsE` (Cultura del Whisky) verified as BLOCK** — embed-blocked videos must be discarded per the skill; there will sometimes be a solid-looking candidate that fails the embed check.
- Aultmore 12 had deep multi-language coverage (en/es/pt/ja all ≥3 verified). If any search returns this many exacts, still verify every candidate before shipping.

## 2026-09-01 — API paywall model + /database page (065/066 planning)

- **Payment model for the API changed from one-time to two tiers** ($19/year yearly-billed vs $99 lifetime). When the business model shifts, the task file must be updated at plan time, not discovered mid-implementation. 065 now carries `plan` + `expires_at` columns so expiry auto-blocks yearly consumers.
- **Payment method is still undecided (owner may accept Bitcoin/Stripe later)** — keep the out-of-band admin-gated flow from 044 and design the toggle swap-friendly rather than baking in a billing provider.
- **Paraglide catch-all URL pattern already localizes any new static route** (`/database` → `/br/database` etc.) — only `origen`/`destileria`-style dynamic slugs need `vite.config.ts` pattern entries.
- **`/download` is neither in the nav nor in `buildLocaleSitemap()`** — it was built without a nav link or sitemap entry. The new `/database` page must explicitly add both.
- **"Absorb" meant full replacement, not redirect.** When the user said `/database` absorbs the db-download flow and to forget `/download`, the new page reimplements the flow; `/download` gets no redirect wiring. Don't add redirect/keep instructions the user didn't ask for.
- **When a [DONE] task's deliverable gets superseded, add a dated Progress note, don't rewrite the history.** 044 shipped `/download`; 066 moves the purchase UI to `/database`. The 044 note records the supersession and that its API/DB machinery is reused.

## 2026-09-01 — Batch of 3 whiskies (Glenrothes Maker's Cut, Mortlach 12 + 16)

- **Videos land in `data/export`'s `influencer_videos.json`, not embedded on the product.** After `data:export`, the exported `whiskies.json` shows `influencer_videos: []` or `videos: []` on each product — the actual rows live in the flat `src/lib/data/influencer_videos.json` keyed by `product_id`. Verify video counts there, not on the whisky object (`v = v.filter(x => x.product_id === slug)`).
- **Whisky Shop (whiskyshop.com) media CDN is a valid image fallback**: `https://www.whiskyshop.com/media/catalog/product/m/o/mortlach_16yo_ps.png?width=2500&store=whiskyshop&image-type=image` downloaded and converted cleanly. Add to the fallback ladder alongside HTFW and official Shopify CDNs.
- Mortlach distillery created complete (founded 1823, Diageo, Dufftown 57.443/-3.122) so both Mortlach products share one distillery record; coordinates present so it renders on the `/map` page.

## 2026-09-01 — "Sauvignon Blanc Cask" == "White Wine Cask Edition" for Tamnavulin

- Tamnavulin's Sauvignon Blanc release is the **Sauvignon Blanc Cask Edition**, sold earlier under the
  same expression name **"White Wine Cask Edition"** — they are the same whisky. English reviews titled
  "White Wine Cask Edition" / "White Wine Cask Finish" are exact matches for the Sauvignon Blanc slot and
  usable for `en` (Whisky.com, Whisky Lock 163, Whiskey Straight Al, Short Pours all verified 200).
- Non-English (es/pt/ja/fr) exact-expression reviews don't exist for this bottling. Every non-en source
  returns either English/German/Dutch/Polish channels, or **Sauvignon Blanc wine** (grape) tasting/
  education videos that are irrelevant, or same-brand Double Cask/Sherry/Red Wine — so those slots must
  stay empty. There is no genuine foreign-language review of the Sauvignon Blanc Cask edition.
- PITFALL reconfirmed: YouTube shows **auto-localized Japanese titles** on English channels (Whisky Lock,
  Short Pours) in ja result sets — those are translation artifacts, not Japanese-narrated videos. Verify
  the *channel* before trusting a title for language determination.

- Royal Salute 30 Key To The Kingdom and Royal Salute 62 Gun Salute (and similar ultra-premium/one-off
  collector bottlings) return, across every search source and language, only short official promos
  (~16–31s brand spots) and retailer/product ads — no independent review/tasting of the exact expression.
- Per the exact-whisky rule these are excluded, so such products ship with **empty** `influencer_videos`
  (runtime English top-up can't help either, since English has none). This is the correct honest outcome.
- Mainstream expressions (e.g. The Glenrothes 12) fill fully across languages by contrast.

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

## 2026-08-29 — YouTube research: don't trust translated search titles; verify via oEmbed + caption asr

- Mistake risk: search-result titles (both websearch and innertube API) are auto-translated into the query language, so an English video can appear with a French/Spanish/Japanese title. That nearly put English videos in non-English slots.
- Correction applied on the Tomatin research: every URL was run through `youtube.com/oembed` (HTTP 200 + canonical title/author) and spoken language confirmed via the watch page's `captionTracks` `languageCode` (`<lang>/asr` auto-caption). Channels whose claimed language only surfaced as `en/asr` were rejected for that language slot (e.g. French Tomatin candidates), and those languages were reported `dry` rather than forcing a mismatch.

## 2026-08-29 — YouTube influencer video research: language verification workflow

- Generic web-search returning blog articles (not videos) is useless for sourcing YouTube review slots.
  Instead, fetch `https://www.youtube.com/results?search_query=<q>` directly (HTML), extract the
  embedded `ytInitialData` JSON (`ReactDOMServer`-rebuilt from the `videoRenderer` nodes), and pull
  {videoId, title, lengthText, ownerText}. Blog sites (dram1.com, whiskyart.blog, sister-ley.com, etc.)
  only aggregate written reviews, no honest spoken-language video matches.
- ALWAYS distrust search-result titles: YouTube returns auto-translated titles (e.g. an English
  "Whiskey is a Journey" video shows up as "¿Lo bebes o no lo bebes?"/"Test du Kilchoman Sanaig"),
  and English-channel titles get machine-translated into es/pt/ja/fr. The ONLY reliable narration
  signal is YouTube's own `captionTracks[].languageCode` (ASR auto-captions) — grep `"captionTracks"`
  in the watch page. Videos with NO captions must be confirmed via canonical-title language + channel
  origin (e.g. Brazilian channels WhiskyBrasil / Márcio Becker / Eng. Milton Salgado), per the task rules.
- Verify every final URL with `https://www.youtube.com/oembed?url=...&format=json` → HTTP 200; use that
  returned canonical `title` + `author_name` (NOT the search-result title) in the output JSON.
- Proven scarcity reality-check for Kilchoman: non-English depth is Machir Bay / Sanaig > Loch Gorm >
  the rest. Portuguese (BR) has honest content only for Machir Bay + Sanaig; PX/Sauternes/MBC had NO
  honest pt/es-px/es-sauternes/ja-sauternes/fr-sauternes results (≤1 honest candidate), so those slots
  were marked `dry` rather than substituting English or inventing.
- Reuse/`verify.mjs` helper: node script that takes video IDs, prints oEmbed title+author AND
  caption languageCode in one pass — built at /tmp/opencode/research/verify.mjs during this task.

## 2026-08-29 — White Oak / Eigashima video research (6 Akashi products)

- Akashi has rich honest en/es/pt/ja coverage: did exact matches for Akashi Red (es x4 exact, ja x4 exact), Akashi Single Malt (en+ja exact), White Oak (en+ja exact) and heavily peated (ja x4 exact, en x1 exact). es/pt have no expression-level reviews → widened to any Akashi/White Oak expression in-language (allowed), never English substitution.
- Japanese language (ja) has the deepest pool via 地ウイスキーあかし/ホワイトオークあかし search terms (明石/あかし/江井ヶ嶋). Use 宅飲みバーTakeo, もふチャンTV, バッカスズキ, せるじお, お酒の塾長 channels.
- `fr` stayed empty (dry) for ALL products: only ONE honest French Akashi video exists (Vie Pratique Meisei, 1:25). Beware YouTube auto-translates search-result titles AND video titles per hl/gl — e.g. "5 Japanese Whisky Brands ROBBING You" (Cask Index) and "Whisky Verkostung" (German) appeared French-translated in fr results; must check oEmbed canonical title+channel, never the search snippet.
- Watch pages (`youtube.com/watch`) intermittently return ~3KB bot-shells with no ytInitialPlayerResponse, killing captionTracks/duration extraction. Fallbacks that work reliably: oEmbed (canonical title+author), and search-result HTML `lengthText`/`simpleText` for duration via a `videoId` → `"simpleText":"m:ss"` search. videoRenderer `label` is localized — parse `simpleText` instead.
- oEmbed 401 (vVVXPGOdc-k) = embed-blocked → discard even though watch page exists.
- Reuse the verified akashi-blue-blended pool (Tito Whisky es, Tierri/Além do Rótulo pt, Whisky.com en) when a product lacks exact reviews.

## Kavalan video top-up (ja/es/pt/fr)
- YouTube auto-translates search-result titles AND (with hl/gl) video titles; trust ONLY oEmbed canonical title+author_name. Check captions via watch-page `captionTracks` languageCode.
- oEmbed HTTP 401 = embed-blocked → exclude (URWTAeDQJA4, URHHVCmewyY).
- kavalan-solist-port dedicated Japanese is scarce (ひとくちウイスキー wl9MhvBPfYE is the one solid ja); widened es/pt/fr with general solist Kavalan vids (La Guida es, Jornada do Whisky pt, LMDW fr).
- fr is essentially LMDW-only; pt dedicated limited to select-2/port-finish/ex-bourbon; verified before marking dry.
- Easiest reliable pipeline: `ytsearch.sh` (results HTML) + `oe.sh` (oEmbed) + `caps.sh` (captionTracks).

## 2026-08-29 — Wave-2c1 video research (Balblair / Benromach / Glenturret)
- CRITICAL caption gotcha: the raw watch-page HTML contains TWO captionTracks-like structures. A naive `grep -o '"languageCode":"..."'` matches the huge "auto-translate target language" array (all ~110 langs) and FALSE-POSITIVES a video as captioned. Always brace-balance the actual `"captionTracks":[ ... ]` array and read the FIRST track's `languageCode` (+ `kind` asr/manual). Reliable parser: find `"captionTracks":` → `[`, depth-count to matching `]`, JSON.parse, take track[0].
- The innertube `youtubei/v1/player` POST returns captions:null in this env (needs cookies/API key / returns "Precondition check failed") — it is NOT a valid caption fallback. oEmbed works for canonical title+author but carries no captions.
- `youtube.com/watch` bot-shell (387-byte, no player response) is bypassed by the saved cookie jar `-b /tmp/opencode/research/cj3.txt` + full Chrome UA. Most whisky reviewer videos have real ASR captions (`en/asr`, `ja/asr`, ...) that only show with cookies.
- Language ground truth = the single real caption track, NOT the translated search/title/author heuristics. e.g. `lIikAKXibEs` shows a French "Glenturret 7 Ans" title in fr results but its caption is `en/asr` → it's English (Spanish channel) → assign en.
- Glenturret FRENCH is essentially empty: after exhaustive in-language search the ONLY captioned French Glenturret video is Armagnacs Darroze "Le Spiritueux du Mois : le Whisky Glenturret" (qADcnsjaUd8). French reviewers (Malt à propos "meilleur jeune tourbé", Goût Divin, DEGUST'Emoi, LMDW) surface in glenturret searches but either caption nothing or cover other whiskies; search engine loosely matches "glenturret". Set fr=1 (not ≥2) for all 3 Glenturret products rather than inventing.
- Benromach fr found via `fr/asr` captions on LMDW-Officiel "BENROMACH 10 ANS" (eDuCeX7h3DY) + Malt à propos "Quel est le meilleur Benromach ?" (oSJtKmFDI6s). Malts rich in es/pt/ja/en with ASR captions.
- Balblair got full 5-language ≥2 coverage from reviewer ASR captions (ひとくちウイスキー ja, Whisky.com en, LMDW fr, Porção dos Anjos pt, El Whisky Bar es).

## 2026-08-29 — Wave-2c5 video research (Wolfburn x4, Old Ballantruan x2, Scapa 13)
- innertube `youtubei/v1/player` POST **works without cookies** in this env when using `clientName:"WEB"` + `clientVersion:"2.20240801.00.00"` (older clients → "Precondition check failed"). Returns `videoDetails.title`, `videoDetails.shortDescription`, `captionTracks`. Descriptions here were the reliable language ground truth because almost every reviewer video has `CAPS: none` (no ASR) — so use description language (Portuguese/Japanese/… text) as the confirmation signal, not captions.
- Channel-language traps reconfirmed: `foodquig` is an ENGLISH channel (Spanish titles are YouTube auto-translations of e.g. "Tasting Sunday") → reject for es slots. `j_R8kr8cAnc` Scotch Down Under is english — the existing `influencer_videos.json` lists it under scapa es, which is WRONG (verified desc EN). Caldo Whisky Bar `4dyG8eWoTes` is Bulgarian, not pt.
- oEmbed HTTP 401 (LiquorHound e5ApSsSV9ac) = embed-disabled → discard even though player API returns content.
- Language scarcity reality: **es/pt/fr Wolfburn core is thin** — es = only Whisky o Muerte "Wolfburn 7 años CS" (oAfLMGjA4SQ, usable once as same-distillery fallback for all 4 core) + HABLANDO Northland; pt = only Porção dos Anjos Aurora + Langskip; fr = only La voie du whisky #9 Aurora. Old Ballantruan has NO fr at all; es only HABLANDO 10yo. Scapa fr = only Whisky et Cie "Scapa 10" + Tellement Soif distillery feature. Honest answer for morven/northland pt & fr, OB pt/fr, OB-NAS es = mark dry, never substitute English.
- Old Ballantruan "bare title" (Tierri, Whisky.com) = the NAS 50% Peated Malt → belongs to old-ballantruan-4-yo, not the 10yo. Jp has deep pool: ひとくちウイスキー, SAKETRY, BAR PEGASUS (定番4種 was used once for langskip+morven ja), 繊月, ウイスキー同好会, CRAZY BARTENDER KEN スキャパ.

## 2026-08-29 — Wave-2c4 video research (Talisker 10/18/DE/Storm, Tobermory 12, Ledaig 10)
- `timedtext?type=list` returns no tracks for basically every video in this env — DO NOT use it as the caption signal. Watch-page `captionTracks` brace-balanced array with `-b cj3.txt` + Chrome UA is the only working caption endpoint.
- All 94 selected c4 videos verified: oEmbed 200 + in-language canonical title; caption check confirmed every assignment (es/pt/ja/fr channels ship matching ASR tracks; fr reviewers uncaptioned here: AlexWhiskyBlog, Monsieur KHONAR).
- Talisker 18 / Distillers Edition / Storm have NO genuine French reviewer video (only EN auto-translated; also Ledaig 10 has exactly one fr: Whisky et Cie). French Talisker coverage is lachaineduwhisky (10, 57°N), Whisky et Cie (10, 14 2025), AlexWhiskyBlog (10), Le Whisky Brunch (E21 Talisker), Malt à propos (Wilder Seas) — used as same-distillery fallback.
- Spanish Talisker 18/DE also have no dedicated reviewer video; es fallback = Spanish Talisker 10 reviews (Destila2, WHISKY BUBU, Whisky Mexico, El Whisky Bar, Nehomar, Los Whiskochos, Abdul Le Tavernier).
- Whisky Capital (Gustavo Araujo) is the richest PT-BR source (t18, DE, Storm, Dark Storm). Sanson has both PT and ES uploads — per-video oEmbed title decides (Ledaig 18 was PT, not ES).
- English channels that pollute localized searches here: Gwhisky, The Whiskey Dictionary, Erik Wait Whisky Studies, Eat Smoke Drink, Sippers Social Club, Whiskey Novice, Whisky Lock, Bevvy, McIntyre's Malts, Whisky.com.

## 2026-08-29 — Wave-2b2 video research (Laphroaig / Bowmore / Bunnahabhain)
- Full 5-language ≥2 coverage achieved for all 8 products (Laphroaig 10/QC/Lore, Bowmore 12/15 Darkest/18, Bunnahabhain 12/18). Delivered `/tmp/opencode/research/wave2-b2.json`; every URL oEmbed-200 with canonical oEmbed title+author.
- Caption validation (watch-page `captionTracks` with cj3.txt) confirmed ~all assignments. Key mismatch/corange: WhiskyBrasil.com "Laphroaig Lore Review" (032LmC3EoEE) has NO caption track and an English title → dropped from pt Lore despite Brazilian channel; pt Lore kept Bebendo Whisky (PX) + Destilados Brasil (PX) both `pt/asr`.
- Captions also confirm: Destilados Brasil, Whisky Capital, Tierri Whisky, Sanson Single Malt, Márcio Becker, Jornada do Whisky, WhiskyBrasil.com (others) are genuine `pt/asr`; Los Whiskochos/El Whisky Bar/Sam's Single Malt/Tito Whisky/Whisky o Muerte/HABLANDO DE WHISKY/Todo Whisky/Amantes Del Whisky/Cultura del Whisky/Kata-dores/Whisky Masters/ElPedroWhisky/Clan de Whiskeros/es audio all `es/asr`.
- A handful of videos legitimately have no caption track (uncaptioned vlogs): 7pCdsxll2I0 (Todo Whisky es), NbDVOngRpgQ (榎商店 ja), ILZqYIHp5bk (Todo Whisky es), 1W0F4I1XYfA (Revista Sobremesa es) — kept on Spanish/Japanese title + native channel; treat caption-missing as "title+channel only", acceptable when both point to the same native lang.
- Bowmore French is thin: only three real French Bowmore sources surfaced — lachaineduwhisky ep11 (Bowmore 12, `fr/asr`, +en), Whisky Live Paris MASTERCLASS BOWMORE (`fr/asr`), Gouilland "La Décapsule Bowmore" (`fr/asr`). Reused across the three Bowmore products as same-distillery fallback.
- Bunnahabhain 18 ja: no dedicated 18yo Japanese video exists; used ひとくちウイスキー (Cruach-Mhona/Eirigh Na Greine) + CROSSROAD LAB 2nd (Mòine), all `ja/asr`, as distillery fallback.
- Bowmore 15 Darkest ja: mapped to modern "15年ダーケストの後継品" (15yo sherry-cask successor) videos (`ja/asr`) — the Darkest was discontinued; its direct successor is the current snow 15. Kept name-faithful titles, mapped closest expression.

## 2026-08-29 — Balvenie DoubleWood 12 addition + seed/export parity fix
- `src/lib/data/whiskies.json` wraps products in `{whiskies: [...]}` (plus `source`/`generatedAt`) while `distilleries.json` is a plain array — accessors differ; the export renames `influencer_videos` → `videos` and inlines `distillery` (without lat/lon; the map uses the standalone distilleries export). Validate every key against the exported object before asserting "missing".
- Seed contained a stale duplicate product: both `octomore-16-1` and `octomore` (same name/slug/desc, identical 11 videos) — only `octomore` ever landed in Turso (unique slug), causing the persistent seed↔export 1-off (237 vs 236). Removed the stray from seed; parity now exact (236/236, 0 mismatches). Root cause matches the earlier "pre-existing duplicate octomore slug" note.
- Whiskybase static images returned 403 on hotlink; retailer CDN (bigcommerce stencil `.png`) worked for the Balvenie bottle shot via `prepare-image.mjs`.
- `npm run db:sync` output counts are Turso table totals (idempotent), not per-run insertions — read them as totals, not deltas.
- Balvenie DW12 video depth: en/es strong (4+ each), pt 3, ja 2, fr 1 — French genuinely dry (only Esprit Dégustation covers this expression); same-channel Balvenie tasting (`F8bv2tXGaWI`) used as the fr#2 same-distillery fallback. A research-supplied Spanish URL (`bj11tLQ0Osw`) oEmbed-404'd — always re-verify every foreign-search URL before use.
- Raw YouTube `https://www.youtube.com/results?search_query=<q>` scrape yields watch IDs; pair each with oEmbed for quick author+title language triage.
## 2026-08-29 — Balvenie Caribbean Cask 14 addition
- No French CC14 review exists; fr slots used same-channel Balvenie videos reused from the DW12 product (cross-product reuse is fine; the runtime dedups per product URL, not across products).
- `qaAwz6AUYN0` (Hablemos de Whisky es candidate) oEmbed-401 (embed-disabled) → discarded despite agent claiming verified; confirms the embed-blocked check must run even on "agent-verified" lists.
- thebalvenie.com product pages are age-gated (no og:image served), but the US shop's S3 attachment CDN (`access-sdk-apos.s3.amazonaws.com`) serves `.full.jpg` bottle shots freely — use it for Balvenie product images.
- db:sync totals now 237 products / 1827 videos; 236→237 product delta confirmed the add.

## 2026-08-31 — Task 053 Wave 2b batch 1 (HP/Dalmore/Glengoyne + dup fixes)
- **Orphan purge key is (language, url), not url:** the "dup" rows I removed (e.g. an EN watch URL copied into the `fr` slot) share their URL with a legitimately-kept `en` row, so a `url`-only surplus check never flags them. Purge `DELETE` conditions must match `(product_id, language, url)` against the seed set.
- Deducing an intra-product dup "by URL, keep first" is wrong when the dup is the SAME url mislabeled under a different language: dropping both copies gutted an `en` slot. Fix rule: keep the url where its spoken language is genuine, drop the wrongly-labeled copy.
- `@libsql/client` `transaction('write')` must be **awaited** (`const tx = await client.transaction('write')`); forgetting the await yields a Promise with no `.batch` and a confusing `tx.batch is not a function`.
- A 2037-row per-`client.execute` upsert loop over the network timed out at 120 s; the same work done as one `tx.batch([{sql,args},...])` (exactly how db-sync builds statements via `stmt()`) completes in seconds. Batch everything DB-side.
- `db:sync` is `INSERT OR IGNORE` for videos — relabeling existing rows in the seed requires an external `ON CONFLICT ... DO UPDATE SET label` upsert; otherwise exports keep the DB's stale (often empty) label.
- SQLite string literals need single quotes; `label = ""` in the HTTP client fails on "no such column".
- Research agent output needs an author column; without it the injected `label` is empty and a post-hoc backfill pass is required.

## 2026-08-31 — Task 053 Wave 2b batch 2 (Amrut/Paul John/Rampur/Penderyn/Speyburn)
- Research agents get 429-rate-limited mid-search; their partial yields are still usable — verify each ID via oEmbed and drop low-confidence rows (author that contradicts agent claims, near-duplicate re-uploads from the same channel).
- oEmbed title is the language judge: an agent's "Spanish" row whose actual author is an unknown channel and title is English (`xHN9FFGhZcg` → "Qantima Group") stays unconfirmed — drop rather than label.
- Same channel can legitimately fill two slots with different videos (amrut-cask-strength `fr` Whisky et Cie ×2); a single video can fill two products of the same distillery (`XQa14qKkyLc` Eito Ajima ja for both Amrut Single Malt and Cask Strength) — intra-product uniqueness is the only rule.
- Specialty markets like Indian single malts and Penderyn have almost no native fr/pt exclusive coverage; 1-en-only products (Rampur, Penderyn Portwood/Rich Oak, Speyburn Bourbon Cask) are honest floors to document, not failures.

## 2026-08-31 — Task 053 Wave 2b batch 3 (AnCnoc/Smokehead/Benromach/Glenallachie/Balblair/Glenfarclas/Glencadam + Irish)
- Research agents are flaky: 2 of 5 returned junk (project summaries) instead of TSV; one claimed to "run the whole pipeline" but the only thing that mattered was its injected candidates (Irish batch legitimately landed). Always verify repo state with gap.mjs after a batch rather than trusting agent claims.
- Some agents confirmed candidates themselves via oEmbed; others only give search-derived IDs — always re-run my verify.mjs on every ID before injection regardless of what the agent claims.
- oEmbed is the authority on channel identity: agent-said "Whisky Lovers" turned out to be HABLANDO DE WHISKY; agent-said unknown channels turned out to be Whisky Lovers Society / Tito Whisky / Gwhisky. Use the verified author as the label, not the agent's guess.
- 2 candidate IDs (oCB5LPFfPbc glencadam-origin en, RLV38ICOMtk ancnoc-12 es) were DEAD at verify → dropped; confirms the oEmbed pass is non-optional even on "agent-verified" lists.

## 2026-08-31 — Royal Salute adds: expression-specific video scarcity for GTR exclusives

- Royal Salute Peated Blend (21) and Treasured Blend (25) are Global Travel Retail exclusives with very few YouTube reviews — only English-language coverage exists. Spanish/Portuguese/Japanese/French review videos for those exact expressions essentially don't exist on YouTube.
- Per skill rules, shipped minimum (en-only for those two) and let runtime English top-up fill the other slots. Signature Blend (flagship, retail) had full es/pt/ja/en coverage.
- Image sourcing: official site (royal-salute.com/wp-content) is hotlinkable and validated HTTP 200 — good PNG bottle shots, larger files but compress well to WebP.
- Chivas Brothers HQ coordinates confirmed from Historic Environment Scotland listing: 55.856, -4.417 (Paisley, 111-113 Renfrew Road). For blend houses without their own stills, anchor to owner HQ/real physical home.

## 2026-08-31 — Royal Salute video backfill: use Invidious HTML search, not generic web search

- The first attempt delegated video research to a subagent using generic web search, which wrongly concluded "no non-English videos exist" for Royal Salute Peated/25 GTR exclusives. That was lazy — led to en-only video sets.
- **Correct method: `https://inv.nadeko.net/search?q=<query>` HTML search.** The JSON API search/trending endpoints are disabled (403), but the HTML search page returns real results with titles in `<p dir="auto">…</p>` next to each `/watch?v=<ID>`. Query per language (e.g. `ロイヤル サルート 21年`, `royal salute 21 anos`, `royal salute 21 años cata`) to find in-language reviewers by reading the title. Then confirm each with the YouTube oEmbed endpoint.
- Findings: **Signature Blend (21)** has rich genuinely-multilingual coverage (Whisky o Muerte/Tito Whisky/Los Whiskochos in es; WhiskyBrasil/Tierri/Jornada do Whisky in pt; ひとくちウイスキー/はっちばっち in ja). **French is genuinely scarce** — only Malt à propos covers Royal Salute; there is effectively no French Royal Salute content, so French slots fall back to English top-up (honest, not a search shortcut).
- Peated and 25 YO GTR exclusives have no exact-expression reviews outside English, so per the skill's widening rule they use same-brand (Royal Salute 21) in-language reviews in es/pt/ja slots. This satisfies "no videos in languages other than English".
- URL dedup is per-product, so the same RS 21 in-language video can appear on multiple Royal Salute products (esp. the scarcer pt language).
- The running `vite dev` (--host, setsid-detached) hot-reloads the regenerated `src/lib/data/*.json` snapshot, so the live Tailscale instance reflects new videos without a manual restart.

## 2026-08-31 — Influencer videos: exact-whisky rule + Turso row deletion gotchas

- **The user's hard rule:** product-page videos MUST review the EXACT whisky/expression. Never another version, another age, or another whisky — no "widening" to same-brand/same-style substitutes. If a language has no exact-expression video, leave that language empty and let the English top-up fill it. Updated `.agents/skills/add-product/SKILL.md` (removed the widen rule, added explicit rejection examples).
- **db:sync only inserts videos (`INSERT OR IGNORE`) — it never deletes.** So removing wrong videos from the seed alone is NOT enough; the wrong rows persist in Turso and keep being exported. Must `DELETE` them directly from Turso.
- **Deleting from Turso with @libsql/client:** `tx.execute()` in a `transaction('write')` reported `rowsAffected: 0` and did NOT persist. The working pattern (as db-sync uses) is to build statement objects `{sql, args}` and call `await tx.batch([...])` then `await tx.commit()`. Verify with a COUNT query before and after.
- **Dev server in-memory cache gotcha:** `getInfluencerVideos` uses a per-process `Map` cache (`src/lib/server/cache.ts`) with a 300s TTL. After removing rows and re-exporting, the still-running dev server served STALE non-English videos for routes already hit (the `/es/` route showed the old RS21 videos while `/whisky/...` showed correct ones). Fix: restart the dev server to clear the in-process cache. Production is immune (fresh process per deploy).
- **kill/vite hang:** `pkill -f "vite dev"` can match and kill the calling shell wrapper, hanging the session. Use `ss -tlnp` to check the port and target the specific PID, or restart detached with `setsid nohup npm run dev -- --host &` and a bounded timeout.
- Royal Salute final state: Signature Blend (21) keeps full es/pt/ja/fr (all exact 21); Peated and 25 YO are English-only in the DB (only exact-expression videos exist in English) — the runtime English top-up fills those slots across all languages.

## 2026-09-01 — Fettercairn 12 backfill: medium brand = rich English, thin foreign

- Native YouTube + Invidious both searched across es/pt/en/ja/fr. Fettercairn 12 has abundant genuine English reviews (Whiskey Novice, Whisky.com, The Grail, Good Juice, Malt Box, WhiskyJason, Whisky Wars, LetstalkWhisky, etc.).
- **Portuguese is genuinely covered** (unexpected for a smaller Highland distillery): Porção dos Anjos Whisky (BR review) and Whisky Justificado / EP121 (BR podcast, "Fettercairn 12 anos" exact). Verified 200 by oEmbed.
- **French is thin:** the only genuine exact-expression French review is a podcast, Eau-de-Vie "Portrait chinois d'un spiritueux - Fettercairn 12 ans" (13:28). The rest (La Maison du Whisky "Fettercairn 12 Ans – Le Monde des Whiskies") is a brand/retailer channel → excluded per rules.
- **Japanese is thin:** only ひとくちウイスキー "フェッターケアン12年（ストレート）" (2:14) is exact-expression. It's a "straight-pour" tasting channel; short but not a Short (>1:00), included as the only genuine ja match.
- **Spanish is genuinely dry:** no dedicated Spanish-language Fettercairn 12 review exists. The English channels (Good Juice, The Grail) auto-translate their titles into Spanish ("Reseña del Fettercairn de 12 años") but oEmbed confirms they're English — Spanish channels (El Whisky Bar 22yr, Los Whiskochos Fior) only cover other expressions.

- Hankey Bannister (entry Original blend): same-brand 12/25 fallback rarely needed because the entry blend has genuine coverage in en/pt/es/ja. French is dry — no genuine French review channel covers Hankey Bannister (native+Invidious "dégustation/avis" returned only English/Spanish channels). Beware Invidious output: its (id,title) pairs are desynced — an ID can carry another video's title (e.g. Vg6dJKqpkPs mislabeled "Hankey Bannister Original - Review 113", GksEaGm_zlc labeled "ハンキーバニスター12年..."). Never trust Invidious title-vs-ID mapping; always resolve with yt-verify oEmbed, and drop any ja video whose canonical title doesn't explicitly name Hankey (qgaXO5P71vQ "日本再上陸" and DfxUWu1Pid4 "1000円台ウイスキー" were excluded despite being about the re-listed Japanese bottle). Brazilian pt has 4 exact Hero/Original reviews (Tierri Whisky x2, Vivian Leny Fins, Destilados Brasil).

## 2026-09-01 — Batch 2: Craigellachie 13/17 + Cragganmore 12
- Images: whisky.my CDN is a reliable fallback for bottle art (`https://whisky.my/cdn-cgi/image/width=1024,height=1024,fit=scale-down,quality=80,format=auto,onerror=redirect,metadata=none/wp-content/uploads/<SLUG>.webp`). The `onerror=redirect` param handles missing files. BigCommerce (`cdn11.bigcommerce.com`) also works for bottle product shots.
- Video coverage by expression: Craigellachie 13 and Cragganmore 12 have full 5-language coverage (en/es/pt/ja/fr all genuine). Craigellachie 17 only has en + pt; es/ja/fr slots stay empty (per exact-whisky rule, English tops those up at runtime).
- Portuguese overlap: Whisky Capital (Gustavo Araujo) covers 13, 17 and Cragganmore 12 — a recurring reliable BR source across expressions.
- Distillery coords resolved from Wikipedia/official: Craigellachie 57.488/-3.185 (founded 1891, vibe worm-tub sulphurous), Cragganmore 57.410/-3.394 (founded 1869, flat-top stills). Both Speyside.
- Python inline strings: never embed literal non-ASCII text with `\u` sequences inside single-quoted shell `python3 -c "..."` — the shell passes `\u` through and Python's `unicodeescape` errors on malformed sequences (e.g. "urze"). Instead write the script to a `.py` file with UTF-8 characters, or use raw `\uXXXX` escapes correctly formed (4 hex digits).
- Pipeline confirmed: distilleries must be added to `distilleries.json` BEFORE products; `db:sync` orders them first. All 3 new products verified in flat `influencer_videos.json` (5 each), `npm run check` clean (0 errors, 25 baseline warnings).

## 2026-09-01 — Batch 3: Linkwood 12, Glen Moray Elgin Classic/Port Cask, Singleton Dufftown 12, Knockando 12

- whiskybase static images 403 on direct download (server-side block). Fallback: Shopify CDN of The Whisky Barrel (`cdn/shop/files/<slug>_grande.jpg`) worked for Linkwood 12 Flora & Fauna art. houseofmalt and whiskyshop product jpgs download fine.
- Video coverage by expression (5 products): all have geniune en + es + ja (el whisky bar/tito whisky/whiskokos/whiskeros argentina/宅飲みバーTakeo recurring). Singleton of Dufftown additionally has genuine pt (Brauna Drinks). French is dry across all 5 (no exact-expression French reviews exist); pt also dry for the 4 ex-Glen Moray ones. English tops the empty slots up at runtime.
- Linkwood 12 coordinates from Wikipedia 57.635448/-3.286238 (Elgin); Glen Moray 57.64444/-3.34111 (Elgin, Rivers Lossie); Dufftown 57.435748/-3.12782 (founded 1895 as Dufftown-Glenlivet); Knockando 57.457/-3.343944 (founded 1898, first distillery with electric lighting). All Diageo-owned except Glen Moray (La Martiniquaise).
- Pipeline: distilleries before products, single db:sync pass, data:export regenerates src/lib/data, npm run check 0 errors / 25 baseline warnings, queue ticks in docs after export verified.
- Cask labels used: Linkwood 12 "Ex-Bourbon & Ex-Sherry", Glen Moray Elgin Classic "Ex-Bourbon", Port Cask Finish "Port Cask Finish", Singleton "PX & Oloroso Sherry", Knockando 12 "Ex-Bourbon".

## 2026-09-01 — Video backfill batch 3: how to actually hit 4 per language

- First pass shipped only 1 video per language because I delegated search to subagents with a "ONE video per language" instruction. That violates add-product Step 5 (target 4/language, floor 2). When delegating video search, instruct agents to return EVERY genuine verified match up to 4/language — or run the youtube-search skill yourself.
- Which products have enough genuine foreign coverage vs not:
  - The Singleton of Dufftown 12 is the goldmine: 4 en, 4 es (La Guia del Whisky, La Whiskería-Costa Rica, HABLANDO DE WHISKY, Los Whiskochos), 2 pt (Tierri Whisky RESUMO + Brauna), 2 ja (ひとくちウイスキー + 正直者がお酒を見る).
  - Linkwood 12: 4 en, 1 es, 2 ja. Knockando 12: 4 en, 1 es, 3 ja. Glen Moray Elgin Classic: 4 en, 1 es, 1 ja. Glen Moray Port Cask: 4 en, 2 es (WHISKEROS + Tito "Oporto vs Ahumado").
  - pt/fr remain 0 for Linkwood/Glen Morays/Knockando — no exact-expression, in-language reviews exist despite native+Invidious+websearch; the English top-up covers those slots at runtime. Do NOT pad.
- Invidious title↔ID pairs are heavily desynced in this repo's runs (e.g. knockando `bx0_Il8aspA` labeled "ノッカンドゥ12年、カーデュー12年 飲み比べ" is actually ひとくちウイスキー's standalone "ノッカンドゥ12年（ストレート）"). ALWAYS settle with `node scripts/yt-verify.mjs` oEmbed — it is the only ground truth for expression + language.
- Trap videos to always reject on these products (verified): "グレンマレイ クラシック で乾杯" (もかじ) is ambiguous cask; ウイスキー専門TEN's "better than Glenfiddich" is generic; Los Whiskochos "Top 5 whiskies de 12 años" is a roundup; 俺のモルト "グレンターナー ポートカスクフィニッシュ" is Glen Turner not Glen Moray; DEAD 401s (yixSa1Hv-rI) and unboxings (Whisky Makers "Unboxing Singleton Dufftown 12") don't count.
- Ready sources per region found this batch: ja → ひとくちウイスキー (straight tastings, exact-expressions, reliable), 宅飲みバーTakeo, CRAZY BARTENDER KEN; es → El Whisky Bar, Tito Whisky, HABLANDO DE WHISKY, La Guia del Whisky, La Whiskería; en → Whisky.com, Whiskey Novice, The Spirit Safe, No Nonsense Whisky, Whisky Lock, Whisky Wednesday, Moa Nilsson, Tierri Whisky (BR, but pt).

## 2026-09-02 — Batch: Edradour 10 YO, Edradour Caledonia, Glen Garioch Founder's Reserve, Glen Garioch 12 YO, Glenglassaugh Sandend

- 3 new distilleries (Edradour 1825/Pitlochry, Glen Garioch 1797/Oldmeldrum, Glenglassaugh 1875/Sandend Bay). All with town-level coords for /map.
- Video coverage: Edradour 10 YO full 5/9 (en4 es2 fr2 ja3 pt2). Caledonia en4 es2 pt2 fr1 ja1. Glen Garioch FR en4 es2. Glen Garioch 12 en4 ja2 pt1. Sandend en4 fr1. pt/fr/ja gaps on the newer/obscure expressions have NO exact in-language reviews despite native+Invidious+oEmbed search — English top-up covers at runtime (do NOT pad).
- Invidious ↔ oEmbed desync again proved fatal: `efCtVcNpQnU` labeled "グレンガリオック12年" was actually Glen Scotia 12 (SAKETRY); `7gIIrK55xYU` "Glen Garioch Founders" was really Glenlivet Illicit Still; `b8oJQlItvBM` Glen Garioch "JA" was a Chinese distillery-tour (好總監瞎談). ALWAYS yt-verify.
- Glen Garioch 12 genuine ja sources found: 俺のモルト (グレンギリー12年 リクエストボトル), ひとくちウイスキー. Glen Garioch FR es: HABLANDO DE WHISKY + foodquig.
- whiskybase static images remain 403-blocked. Reliable sources this batch: img.thewhiskyexchange.com (TWE product codes, e.g. edrob.10yov1.jpg, edrob.12yo.jpg), i0.wp.com malt-review PNGs (Garioch-Founders-Reserve / Garioch-12), mensjournal t_share PNG (Sandend).

## 2026-09-02 — Glendronach 15 Revival video research (youtube-search skill)

- **French is genuinely dry for this exact expression.** No live in-language French video whose oEmbed title confirms the "Glendronach 15 Revival" was found. French candidates were either embed-blocked (`gcQFmw167GY` Whisky on the West Coast GlenDronach 15/18/21 comparison = BLOCK) or had generic titles that don't prove the exact expression (Le Chardon "Pourquoi les experts ne jurent que par ce whisky à 50€" `5zPWaV6HYGc`, Malt à propos "Quel est le meilleur whisky de 15 ans d'âge ?" `wbfAPEIrCWw`). Per the exact-expression rule, ship ZERO for `fr` rather than include an unconfirmed-expression video.
- **Spanish exact-expression is thin (2 found):** Whisky o Muerte "Glendronach 15: entramos en la recta final del core range" (`QS4H3t7AA_g`, 23:57) and Julio Oñate Whiskylover "Un Glendronach 15 años..." (`cv_Ec5MzBbU`, short 3:15). Cultura del Whisky "Glendronach 15 Revival" (`c3S1Lwle5qA`) is embed-blocked → discarded.
- **Portuguese has 3 exact:** WhiskyBrasil "Glendronach 15 Review" (`8gQ_jUpNGU0`), Bebendo Whisky Eng. Milton Salgado "Whisky 227: GlenDronach 15 anos Revival" (`gwKs5FuECDU`), Sanson Single Malt "Explorando o GlenDronach 15 Anos" (`nNof5XbPHas`).
- **Japanese has 1 exact:** もっさんハイボール倶楽部's 4-bottle vertical tasting of Glendronach 12 & 15 old/new (`DFxUiPUau34`) — a genuine `ja` multi-expression tasting that covers the 15 Revival. The 5XIOWqzMFaU "15 リバイバル 新旧比較" appears Japanese-titled but is the English Whisky Whistle channel (machine-translated) → rejected for `ja`.
- **English is deep (verified 200):** Whisky.com, Erik Wait Whisky Studies, Malt Muser, No Nonsense Whisky, Deni Kay, Whisky Bloke, Noels, Malt Activist, etc. all exact "Revival".
- Auto-translate trap reconfirmed: Scotch 4 Dummies and Whisky Wars surface auto-localized es/fr/ja titles ("Reseña...", "Critique de whisky", "Reseña de whisky") but are English channels — never slot them as genuine foreign. oEmbed author is the gate.

## 2026-09-03 — Task-list migration to `.tasks/TASKS.md` + 067 created

- Migrated the task list from AGENTS.md `## Tasks` into `.tasks/TASKS.md` (per the `tasks` skill section 18). AGENTS.md now holds only a pointer line. Task files stay in `tasks/`.
- 056–059 (JSON sharding/split for scale) are superseded by **067 Local SQLite Migration** — flat sharded-JSON is abandoned in favor of a single self-hosted SQLite DB with an efficient search index.
- 067 is the **LAST task**, deferred to project completion (owner sequencing); flagged "DO NOT AUTO-PICK" in the file and "(LAST TASK)" on the board line so it is never auto-selected early.
- 067 plan (recorded, not implemented): manually download Turso DB → local SQLite file; app connects via a sqlite3 driver (local `file:`); switch `adapter-vercel` → `adapter-node`; Docker Compose + Cloudflare Tunnel serving production on a local server/homelab; SQLite bind-mounted outside the container for persistence.

## 2026-09-03 — Backfill batch 4e (last 6 real zero-video products + conv.)

- Batch 4e closed 7 of 13 remaining zero-video products (23 verified videos injected). ZERO: 15→8, of which 2 (royal-salute-30/62) are permanent honest-dry; 6 real zeros stay (Catto's 12/25, La Alazana Peated, Madoc ×3).
- Full parity pipeline confirmed for a pure-append batch: `data:export` puts influencer videos in `src/lib/data/influencer_videos.json` as a FLAT array keyed by `product_id` (NOT nested in `whiskies.json`) — parity checks must compare seed-nested vs export-flat via the `product_id|language|url|label` tuple, not assume nesting.
- Ultra-niche Argentine single malts (Casanegra, EMC Pampa) have NO formal review tastings on YouTube — only Spanish brand-founder/feature content. For these, expression-exact native-language (es) feature content was the honest best option; documented rather than padded. La Alazana Peated and the Madoc line were left dry because existing videos never name an exact expression (Madoc), or name a distinct expression (Haidd Merlys ≠ Peated).
- Soup-of-blends lesson: Catto's 12/25 have no dedicated reviews; all Catto's coverage is the base no-age blend/3yo — cross-using to the 12/25 would violate the exact-expression rule.

## 2026-09-03 — Backfill wave 4f (partials, +65 videos)

- Second full-honesty expansion: 65 oEmbed-verified videos across 19 mainstream partials. Best yields: Arran 10 (es/pt/ja/fr all filled), Glenfarclas 105 + 12 (es/ja/pt/fr). Rich Japanese (Takeo, ひとくち, もっさん, 俺のモルト) and Spanish (Whisky o Muerte, HABLANDO DE WHISKY, Los Whiskochos) coverage exists for famous single malts.
- Genuine-dry stays dry: cu-bocan, dingle batch/potstill, craigellachie-17, glen-garioch, glenrothes, royal-lochnagar, penderyn, wolfburn, glenglassaugh, glenwyvis etc. have no exact-expression non-English reviews — never pad.
- Label drift is a recurring parity issue: the seed holds richer labels than Turso/export for older rows ("X — review" short form). Full-catalog seed↔export parity requires a dedicated reconcile pass aligning seed labels/langs to the DB by URL (23 fields this wave).

## 2026-09-03 — Backfill wave 4g (partials round 2, +17 videos)

- Yield drops sharply as gaps narrow: this round of mainstream 2-gap products (Glasgow 1770×4, Longmorn DC, Talisker 18/DE, Dalmore KA, Glenturret 12, Tomatin 14/CS, Tomintoul 12/tlath, Auchentoshan 18/AO, Kavalan solist-vinho, Amrut, Paul John) is genuinely dry in pt/fr/ja/es — no in-language exact-expression review exists. Expect diminishing marginal returns from here.
- Auto-translated-title traps were the main risk: `6KXKsGZ4cyA` (irishman "ja"), `eFw0CP5RM6Y` (aberfeldy "ja") looked Japanese but oEmbed showed English audio — dropped. Never trust a search result's displayed title language.
- Per-language gaps now es 67, pt 90, ja 50, fr 153. fr is the persistent biggest gap; French whisky YouTube largely doesn't cover these mid-tier single malts precisely.
