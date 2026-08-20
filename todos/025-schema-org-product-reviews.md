Status: DONE

## Progress

- 2026-08-20: Starting implementation. Creating schema.ts helper and tests.

# Schema.org structured data for products + reviews

## Context

The product detail page (`/whisky/[slug]`) has all the data needed for rich structured data: product name, brand, description, image, origin, specs (ABV, age, volume, cask), vote count, and user reviews with scores + comments. No Schema.org markup exists today. Adding it enables Google rich results (product carosels, review stars in search) and improves SEO significantly.

The `+page.server.ts` already loads the product, reviews, karma, and videos. The `+page.svelte` already has `<svelte:head>` with `<title>` and `<meta description>`. The JSON-LD block slots right in.

## Requirements

### 1. Schema builder

`src/lib/server/schema.ts` (new file):

`buildProductSchema(product, reviews, karma, origin)` → returns a JSON-LD object:

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "...",
  "description": "...",
  "image": "https://origin/data/images/slug.webp",
  "brand": { "@type": "Brand", "name": "..." },
  "category": "Single Malt Whisky",
  "countryOfOrigin": { "@type": "Country", "name": "Scotland" },
  "url": "https://origin/whisky/slug",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": 4.2,
    "bestRating": 5,
    "worstRating": 1,
    "ratingCount": 12
  },
  "review": [
    {
      "@type": "Review",
      "author": { "@type": "Person", "name": "..." },
      "reviewRating": { "@type": "Rating", "ratingValue": 5, "bestRating": 5 },
      "datePublished": "2026-08-15T...",
      "reviewBody": "...",
      "publisher": { "@type": "Organization", "name": "Old Rare" }
    }
  ]
}
```

- `aggregateRating`: computed from reviews (average score rounded to 1 decimal, count). Skip when zero reviews.
- `review` array: limited to top 20 reviews to avoid bloated HTML. Sorted by most recent first.
- `image`: full absolute URL using the provided origin.
- `url`: full absolute URL to the product page.
- `name` and `description`: use the localized versions (already resolved in the page via `l10n()`).
- Pure function, no side effects, easy to test.

### 2. Page integration

`src/routes/whisky/[slug]/+page.svelte`:
- In the `<svelte:head>` block, add a `<script type="application/ld+json">` tag containing the JSON-LD from `buildProductSchema()`.
- Use the data already available: `product`, `data.reviews`, `data.karma`, `data.countryCode`.
- The origin URL is derived from `window.location.origin` on client or `event.url.origin` on server — since this is in `<svelte:head>` (SSR-safe), use the origin from the page data or a constant.

### 3. Server data

`src/routes/whisky/[slug]/+page.server.ts`:
- No changes needed — product, reviews, and karma are already loaded and passed to the page.

### 4. Tests

`tests/schema.test.ts`:
- Correct JSON-LD structure for a product with reviews.
- AggregateRating computation: average of scores, correct count.
- Edge case: zero reviews → no `aggregateRating`, empty `review` array.
- Edge case: single review → ratingValue equals that score.
- Edge case: >20 reviews → array capped at 20.
- Brand, countryOfOrigin, image URL correct.

## Acceptance criteria

- Each `/whisky/[slug]` page has valid JSON-LD `<script type="application/ld+json">` in `<head>`.
- Product schema includes name, description, image (absolute URL), brand, category, countryOfOrigin, url.
- `aggregateRating` computed correctly from reviews (average to 1 decimal, count).
- Reviews mapped with author, rating, date, body, publisher.
- Zero-review products render without `aggregateRating` (Google requires it to be absent, not null).
- Google Rich Results Test (manually) passes for a product page.
- `npm run check`, `npm test`, `npm run build` pass.

## Progress

