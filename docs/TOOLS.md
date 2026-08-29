# Tools

This project's own helper scripts (beyond the `scripts/*.mjs` added by earlier tasks) live in `scripts/`.

## `scripts/yt-search.mjs`

YouTube search scraper — no API key needed. Fetches the public results page and dumps matching videos.

Usage:

```bash
node scripts/yt-search.mjs "Talisker Storm review"
node scripts/yt-search.mjs "タリスカー ストーム テイスティング ウイスキー"
```

Output (tab-separated, one per line):

```
ID      length  channel        title
sKfSNf9EYqY  7:51  Whisky.com    Talisker Storm | Whisky Review
```

Why this exists: discovery of non-English review videos via `websearch` was unreliable (returns blogs/e-commerce), and plain text of YouTube is JS-rendered. `ytInitialData` regex extraction works for the search page with a desktop User-Agent.

Verification rule — ALWAYS confirm a video before assigning it to a locale slot, because YouTube auto-translates titles by the `hl`/`Accept-Language` hint: a "French" title can belong to an English channel. Check via oEmbed (no key):

```bash
curl -s "https://www.youtube.com/oembed?url=https%3A//www.youtube.com/watch%3Fv%3D<ID>&format=json"
```

Returned `author_name`/`title` is authoritative for the real spoken language.

## Research scratch helpers (in `/tmp/opencode/research/`, not repo-maintained)

One-off helpers used during influencer-video research batches:
- `ytsearch.sh` — calls the unauthenticated YouTube innertube search endpoint and prints `id | age | length | channel | title`. Note: titles are auto-translated into the query language; don't trust them for language determination.
- `verify.sh` — per video: `youtube.com/oembed` (canonical title/author) + fetches the watch page and extracts `captionTracks` `languageCode` to confirm spoken language (`<lang>/asr`).
- `caplang.js` / `capall.js` — dump caption-track languages for a downloaded watch page.

### Wave-2b2 scratch helpers (`/tmp/opencode/research/`, not repo-maintained)
- `ytsearch.mjs <query>` → parses `ytInitialData` from `youtube.com/results` HTML, prints `id | title | channel` (search titles auto-translated; oEmbed only).
- `ysv.mjs <query> [n]` → search + per-video oEmbed in one go: `id<TAB>oEmbedTitle<TAB>author<TAB>[st:searchTitle]` — the fast feed while researching (three independent calls: video ID from results HTML, oEmbed title, oEmbed author).
- `verify.mjs <id>...` → per video: oEmbed + `api/timedtext?type=list` caption list (dead in this env, always NONE — superseded by `capsall.mjs`).
- `finalverify.mjs` → read `/tmp/opencode/research/ids.txt` (one ID per token), oEmbed all, write `/tmp/opencode/research/verified.json` + one `id<TAB>code<TAB>author<TAB>title` line per video. Run once at the end.
- `capsall.mjs` → read `ids.txt`, fetch each watch page WITH cookie jar `-b cj3.txt` + desktop UA, brace-balance the real `"captionTracks":[...]`, print `id<TAB>lang1/asr,lang2`. This is the caption ground-truth pass (same gotcha as Balblair wave: naive `languageCode` grep false-positives on the huge translate-target array; always parse the array).
- Single-file deliverable: `/tmp/opencode/research/wave2-b2.json`.
