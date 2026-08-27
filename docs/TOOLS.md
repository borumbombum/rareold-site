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
