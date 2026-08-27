Status: [DONE]

# One-time image download and webp conversion script

## Context

The catalog images had to be downloaded once from the alambique.com.uy API, compressed to webp (quality 85) with the `png2webp` Go tool (https://github.com/borumbombum/png2webp), and served from `/data`. Images are the only assets heavily cached on the client with a 30-day TTL, so the build-time conversion matters for speed.

## Requirements

- One-time execution script to download all product images.
- Compress them to webp with the `png2webp` repo (auto-cloned and built into `tools/` on first run).
- Serve them from the project `/data` (static, prerendered at build).
- Update the products json to point at the new webp files.

## Acceptance criteria

- `scripts/download-images.mjs` (`npm run data:images`) downloads, converts, and rewrites each whisky's `image` to `/data/images/<slug>.webp`.
- Webp files and updated JSON committed; `data/images/raw/` and `tools/` gitignored.
- Served by `src/routes/data/images/[file]/+server.ts` with `Cache-Control: public, max-age=2592000, immutable`.
