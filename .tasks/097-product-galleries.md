# Product galleries: multiple images per whisky

Status: [DONE]

## Context

Products had exactly one image (`products.image`). Task: let a product hold any number of images, stored in a normalized table, surfaced on the detail page without changing the current look, and backfill every existing product with its current single image.

## Requirements

- New `product_images` table (product_id, position, url, alt, created_at), any row count per product, `position` order, primary = position 0.
- Backfill: copy each product's current `image` path into the table as position 0. **No downloads, no image processing, no new files — same paths served by the existing `/data/images/[file]` route.**
- Detail page (whisky/[slug]) looks exactly as today for one image. With >1 image, floating prev/next chevron buttons switch the active image (wraps around). No thumbnails.
- Admin product form allows an unbounded list of image URLs (add/remove). Save persists rows (replace by position).
- `db-sync` bootstraps from seed `images[]` (fallback `[image]`), `db-export` emits `images` array. Whisky type gains `images?: string[]`.
- Localized messages (es/en/pt/ja/fr) for the new admin labels + prev/next titles.

## Acceptance criteria

- [x] Migration `0029_product_images.sql` (CREATE TABLE IF NOT EXISTS + unique `(product_id, position)` index + bootstrap INSERT OR IGNORE from products.image)
- [x] `db:sync` bootstraps product_images; unique index prevents double-insert (fixed a real double-backfill: 942 rows → 471)
- [x] `db:export` emits `images[]` — verified: all 471 products have `images`, `image === images[0]` for all
- [x] `npm run check` 0 errors (29 pre-existing warnings)
- [x] `npm run test` 92/92 pass; `npm run build` succeeds
- [x] Admin API (`createProduct`/`updateProduct`/`deleteProduct`) persists gallery rows; `listProducts` returns `images`
- [x] Pre-change DB backup + post-change DB backup (with `product_images`) stored in the git-ignored `db/backup/`
- [ ] No commit/push unless explicitly ordered

## Progress

- 2026-09-17: Backup script `scripts/db-backup.mjs` + pre-change backup (git-ignored `db/backup/`). Migration, sync/export/types wiring, detail-page gallery (prev/next chevrons, wrap), admin URL list (5-locale messages), API persistence. Applied migration live — hit `no such column: created_at` (products has none) → bootstrap now uses `datetime('now')`; hit duplicate rows (942 vs expected 471) → added unique `(product_id, position)` index live + in migration for fresh rebuilds. Re-ran db:sync/data:export/check/test/build all green. Post-change backup taken (471 product_images rows). Updating skill docs next.