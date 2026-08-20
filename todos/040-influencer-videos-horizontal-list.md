Status: TODO

# Influencer videos: language-based, horizontal scrollable list above product image

## Context

Each whisky product page shows a horizontal scrollable list of influencer/sommelier videos above the main product image. Videos are **per-language** (not per-country). If a language has fewer than 4 videos, the remaining slots are filled with English videos (deduplicated by URL). This fully replaces the existing `product_videos` (country-based) table and the `products.video` global field.

**Layout math:** Left column is ~612px wide on desktop. 16:9 thumbnails at ~150px wide = 4 videos fit in a row. Mobile uses horizontal scroll for any count.

## Requirements

### 1. DB migration (`db/migrations/0019_influencer_videos.sql`)

Create `influencer_videos` table:
```sql
CREATE TABLE IF NOT EXISTS influencer_videos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id TEXT NOT NULL,
  language TEXT NOT NULL,       -- locale key: 'es', 'en', 'pt', 'ja', 'fr'
  platform TEXT NOT NULL DEFAULT 'youtube',  -- 'youtube' | 'instagram'
  url TEXT NOT NULL,
  label TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE(product_id, language, url)
);
CREATE INDEX IF NOT EXISTS idx_influencer_videos_product ON influencer_videos(product_id);
CREATE INDEX IF NOT EXISTS idx_influencer_videos_lang ON influencer_videos(language);
```

### 2. Data migration

- Migrate existing `product_videos` rows → `influencer_videos`, mapping country→language:
  - UY → es, BR → pt, US → en, JP → ja
  - Platform defaults to 'youtube', label preserved
- Migrate `products.video` (global YouTube URL) → `influencer_videos` with `language='en'`, `platform='youtube'`
- Drop `product_videos` table
-ALTER TABLE `products` DROP COLUMN `video`

### 3. Types (`src/lib/types.ts`)

Update `ProductVideo` interface:
```typescript
export interface ProductVideo {
  language: string;    // was: country: CountryCode
  platform: 'youtube' | 'instagram';
  url: string;
  label: string;
}
```

### 4. Server code (`src/lib/server/videos.ts`)

Rewrite all queries for the new table:
- `listInfluencerVideos(productId, language)`: Fetch videos for the given language. If fewer than 4 results, fetch English videos to fill up to 4 (deduplicated by URL).
- `addInfluencerVideo(productId, language, platform, url, label)`
- `deleteInfluencerVideo(productId, language, url)`
- Remove old `listProductVideos`, `addProductVideo`, `deleteProductVideo` functions

### 5. API (`/api/admin/videos`)

Update endpoints:
- `GET ?productId=xx&language=en` — list videos for product+language
- `PUT` body: `{ productId, language, platform, url, label }` — add video
- `DELETE` body: `{ productId, language, url }` — remove video
- Remove `country` parameter, replace with `language`

### 6. Admin form (`/admin/products`)

- Remove the `products.video` URL input field
- Add an "Influencer Videos" section per product:
  - Language selector (dropdown of available locales)
  - For each language: list of videos with platform icon, URL, label, delete button
  - Add video form: platform selector (YouTube/Instagram), URL input, label input
  - Videos grouped by language with collapsible sections

### 7. Component (`InfluencerVideos.svelte`)

Create new component:
- Horizontal scrollable row of video thumbnail cards
- Each card: platform icon (YouTube/Instagram), label or truncated URL, click opens in new tab
- Max 4 visible on desktop (overflow scrolls), horizontal scroll on mobile
- Only renders if videos exist for the product
- Compact design: ~150px wide cards, 16:9 aspect ratio thumbnails
- Uses `aspect-video` class for thumbnail containers

### 8. Product page (`src/routes/whisky/[slug]/+page.svelte`)

- Remove the PlayButton overlay from the image (lines 97-99)
- Remove the conditional `top-16` class on the share button (line 102)
- Place `<InfluencerVideos>` component in the left column, above the image container
- Pass the videos array from page data

### 9. Data loading (`+page.server.ts`)

- Update `getProductVideos` call to use new `listInfluencerVideos(product.id, locale)`
- Pass locale to the video fetch

### 10. Export pipeline (`scripts/db-export.mjs`)

- Export `influencer_videos` to `src/lib/data/influencer_videos.json`
- Include in the build-time data

### 11. Seed data (`data/seed/whiskies.json`)

- Remove `video` field from all product entries
- Add `influencer_videos` array per product (if any videos exist)

## Acceptance criteria

- Product pages show up to 4 horizontal video thumbnails above the image
- Videos are per-language: switching locale shows different videos
- If a language has <4 videos, English videos fill the remaining slots
- Clicking a thumbnail opens the YouTube/Instagram page in a new tab
- Admin can manage influencer videos per product per language
- The old `product_videos` table and `products.video` column are removed
- Existing video data is migrated correctly (country→language mapping)
- Responsive layout works on mobile (horizontal scroll)
- No layout shift when videos load
- `npm run db:sync && npm run data:export && npm run build` succeeds

## Progress
