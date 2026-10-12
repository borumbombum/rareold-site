Status: [DONE] Youtube Influencer Contact List

## Context

After all whiskies from the pending queue have been added (task 037–060), the site will have influencer videos attached to products in all languages. We need a consolidated list of every YouTube influencer whose videos are embedded, so we can reach out and tell them about the project.

## Requirements

- Scan all product records and extract unique YouTube video URLs (across all languages).
- For each unique video, fetch the channel name and channel URL from YouTube (or from metadata already stored).
- Deduplicate by channel (one entry per influencer/channel).
- Output a clean list (markdown or CSV) with: channel name, channel URL, number of videos featured, and the product names their videos appear on.
- Each entry must carry contact information (email/website when discoverable, otherwise the channel URL). No duplicate channels.

## Acceptance criteria

- [x] A script exists that produces the influencer list (`scripts/youtube-influencers.mjs`, runnable standalone).
- [x] The list is saved to `docs/youtube-influencers.csv` (plus a readable `docs/youtube-influencers.md`).
- [x] Each entry has: channel name, contact, video count, product names.
- [x] No duplicate channels in the final list (730 unique channels, 0 duplicates; dedupe key is the normalized channel URL).

## Results (2026-09-25)

- Source: `src/lib/data/influencer_videos.json` — 4552 rows → 4083 unique videos → 4074 resolved via oEmbed, 9 dead.
- **730 unique channels.** Contacts: 96 emails + 370 websites = 466 with real contact; 264 fall back to channel URL.
- oEmbed results cached at `/tmp/rareold-batch/influencers-oembed.json` so re-runs skip the ~4083 network calls.
- Output columns: `channel, contact, video_count, whiskies` (whiskies = semicolon-separated product names).
- Top: Whisky.com (241 videos, https://www.whisky.com/), ひとくちウイスキー (158, https://x.com/sake), HABLANDO DE WHISKY (124), 宅飲みバーTakeo (117), Los Whiskochos (102).

## Progress

- 2026-08-31: Task created.
- 2026-09-25: Built `scripts/youtube-influencers.mjs` — oEmbed per unique video ID → channel name/URL, dedupe by channel URL, scrape channel About pages (best effort) for email/website contact, fall back to channel URL, write `docs/youtube-influencers.csv` (RFC-4180) + `.md`. Contact precision work in this task: the first-pass regex matched CSS variable-font ranges (`wght@0..100`) from embedded Google Fonts CSS on every page, so the contact regex now requires an alphabetic TLD (>=2 chars); `mailto:` links take priority; website-link fallback filters all youtube/google/schema/w3/gstatic/ggpht/font/tracking domains and strips trailing `...`, punctuation, and mid-string `http` jams.
