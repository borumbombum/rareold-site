Status: DONE

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

- 2026-08-21 (ox-alpha): Starting implementation. Corrections vs spec: migration file is
  **0020** (0019 taken by french_content); `product_videos` table is EMPTY (0 rows) so country
  data migration is a no-op — only the 7 `products.video` URLs migrate, as `language='en'`
  stamped first (ORDER BY created_at ASC + early fixed timestamp). User decisions: play buttons
  removed everywhere (cards/rows included), thumbnails open the existing in-page VideoModal,
  migrated videos also added to seed for rebuild parity. Test data: real YouTube reviews for
  /whisky/arran-sherry-cask in all 5 languages.
- 2026-08-21 (ox-alpha): Migration `0020_influencer_videos.sql` written and applied to Turso
  (influencer_videos created, 7 products.video URLs migrated as en, product_videos dropped,
  products.video column dropped). db-sync.mjs updated (no video col; insertInfluencerVideos;
  summary count). Seed whiskies.json: video stripped everywhere, influencer_videos arrays added
  for the 7 migrated products. db-export.mjs: video removed from SELECT/mapping, new
  influencer_videos.json export. types.ts ProductVideo {language, platform, url, label},
  Whisky.video removed. videos.ts rewritten (listInfluencerVideos with en-fill ≤4 + URL dedup,
  raw listProductInfluencerVideos for admin, add/delete). data.ts cache key now
  `videos:<lang>:<productId>` + invalidateInfluencerVideos loops all locales.
- 2026-08-21 (ox-alpha): API /api/admin/videos rewritten to language param with requireAdmin
  guard on GET/PUT/DELETE (found+fixed unauth GET leak during smoke test → 403). Admin products
  form: global video input removed; per-language Influencer Videos manager added in edit mode
  (language dropdown, list w/ platform icon + label + delete, add form platform/url/label).
  Messages: admin_products_video_url/sommelier_videos_* replaced by videos_title +
  admin_videos_* keys in all 5 locales; paraglide recompiled. New InfluencerVideos.svelte
  (~150px 16:9 thumbs, YouTube i.ytimg.com hqdefault thumbs, Instagram placeholder tile,
  click → ui.openVideo modal) placed above the image in the left column. Product page: old
  vertical sommelier section and image PlayButton removed, share button back to top-4.
  ProductCard/ProductRow PlayButton blocks removed; PlayButton.svelte deleted (no usages).
  Test data inserted into Turso for arran-sherry-cask: en×4, es×3, pt×1, ja×2, fr×2 (real
  verified reviews) + same array in seed. Verified: db:sync (19 videos), data:export, check
  = 2 pre-existing errors only, test 66/67 (1 pre-existing), build exit 0, preview smoke:
  all 5 locales show correct own-language videos topped up with English to exactly 4
  (dedup by URL), no-video product renders no strip, sommelier section gone, admin/API
  auth returns 307/403.
- 2026-08-21 (ox-alpha): Follow-up fix round (user feedback). (1) Play buttons restored in ALL
  list views via new reusable `PlayVideosButton.svelte` (size sm/md, stopPropagation so card
  links don't navigate): grid card (md chip bottom-right of image), list row (sm chip on
  thumbnail), compact row (sm inline icon after name). Click opens VideoModal with the FIRST
  video + full playlist. (2) Modal is now a playlist player: ui store holds {list,index}
  (openVideo(url, list?) backward compatible), prev/next buttons + "label · n/total" counter,
  close X overlay, new video_prev/video_next messages in all 5 locales. (3) Mobile overflow
  fixed: root cause was the scroll container's intrinsic width propagating through the sticky
  column (grid item min-width:auto) blowing the single-column track wider than the viewport.
  Added min-w-0 to product-page grid + left column, dropped negative margins on the scroller,
  thumbs now w-[38vw] max-w-[150px], strip clicks open the modal at that index. (4) Lists get
  build-time data: db-export embeds `videos` per product into whiskies.json (omitted when
  empty); shared client-safe `videosForLocale()` in $lib/utils/videos.ts now powers both the
  server fill and all components; server videos.ts refactored onto it. Verified: export shows
  8 products with videos embedded, check = 2 pre-existing errors, tests 66/67 (1 pre-existing),
  build exit 0, preview smoke: home grid renders 8 play buttons per locale with correct
  localized labels (no en leak on /es/), arran-sherry-cask strip shows 4 thumbs + 1/4 badge,
  min-w-0 classes present.
