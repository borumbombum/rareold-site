Status: TODO

# YouTube video search skill to populate missing whisky videos

## Context

Each product has a single nullable `video` URL field (YouTube/Instagram/direct). Currently only 4 of 156 products have a video — the rest are `null`. There is already a working video player (`VideoModal.svelte`, `parseVideoUrl` in `format.ts`) and `PlayButton` on cards/rows/detail. The task is to build a one-shot script (like `scripts/download-images.mjs`) that searches YouTube for each whisky and populates the missing `video` fields.

## Requirements

1. **Script**: `scripts/youtube-videos.mjs` (new npm script `data:youtube-videos`).
2. **Input**: reads `data/seed/whiskies.json`, processes only products where `video` is `null`.
3. **YouTube Data API v3**: uses `YOUTUBE_API_KEY` env var; calls `youtube.search.list` with type=video, maxResults=3 per whisky.
4. **Search query**: `"{brand} {name} whisky review"` — builds from product name + brand.
5. **Relevance scoring heuristic**:
   - Title contains the whisky name → +10
   - Title contains "review" / "tasting" / "nota" / "prova" → +5
   - Channel name contains "whisky" → +3
   - Prefer 3–20 min videos (typical review length)
   - Penalize shorts, compilations, ads
6. **Output**: updates `whiskies.json` with the winning YouTube URL. Only fills `null` — never overwrites existing videos.
7. **DB write**: after updating `whiskies.json`, run a batch UPDATE on Turso (`UPDATE products SET video = ? WHERE id = ? AND video IS NULL`) to push new videos to the database. Alternatively, add a `ON CONFLICT(id) DO UPDATE SET video = excluded.video WHERE products.video IS NULL` path in db-sync for just the video column.
8. **Flags**:
   - `--dry-run` — print proposed matches without writing
   - `--from=<slug>` — resume from a specific product slug
9. **Rate limiting**: add a small delay between API calls (YouTube free tier = 10k units/day; 156 queries fits comfortably).
10. **Documentation**: add `YOUTUBE_API_KEY` to `.env.example` and README env table.

## Acceptance criteria

- `npm run data:youtube-videos` fills all null video fields with relevant YouTube URLs in `whiskies.json`.
- `--dry-run` shows proposed matches without modifying any files.
- Existing videos (the 4 already set) are never overwritten.
- Updated `whiskies.json` + Turso have matching video URLs after `npm run data:export`.
- `npm run check` and `npm run build` pass.
- `YOUTUBE_API_KEY` documented in `.env.example` and README.

## Progress

