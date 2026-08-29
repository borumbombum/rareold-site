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
