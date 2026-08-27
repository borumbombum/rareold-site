Status: [DONE]

# Users upload an image and location of their experience when voting and sharing

## Context

Future feature: users will be able to upload an image and provide the location of their experience when voting and sharing. Nothing exists today: no upload, geolocation, or coordinate fields anywhere in `src/`. The vote POST body is only `{ entity_id, karma, country }` (`src/lib/components/VoteButton.svelte` lines ~58-62; `src/routes/api/vote/+server.ts` lines ~13-18).

## Requirements

- Image upload when voting and sharing.
- Location of the experience (e.g. geolocation / coordinates) when voting and sharing.

## Acceptance criteria

- Vote/share flow accepts an optional image and location.
- Image and location are persisted and displayed with the vote/review.
- Google-login auth applies as usual.

## Progress

- 2026-08-21 (ox-alpha): Started. Plan: reviews table gains image + lat/lng columns (migration), upload endpoint storing under data/uploads served like /data/images, ReviewModal gets optional photo attach + geolocation, review cards render image/location, activity feed shows them.
- 2026-08-21 (ox-alpha): DONE. Migration 0021 (reviews.image BLOB, image_type, lat, lng). insertReview persists them; upsert keeps existing photo/coords via COALESCE. getReviewImage() + GET /api/reviews/[id]/image serves bytes w/ correct Content-Type + 30-day immutable cache per AGENTS.md images rule. POST /api/reviews switched to multipart (image <=3MB jpeg/png/webp only, auth + SvelteKit CSRF apply). Client: utils/image.ts downscaleImage (canvas -> <=1200px JPEG ~0.82), new ReviewAttachments.svelte (photo picker w/ preview+remove, geolocation chip w/ clear) mounted in both ReviewSection form and ReviewModal vote flow. Cards render photo + MapPin coords linking to Google Maps; ActivityCard renders review photo. Messages review_photo/review_location x5 locales. Tests: reviews suite extended to 8 (persistence, image_url exposure, COALESCE-on-update); full suite 82 passing; check 0 errors; build OK; E2E verified on isolated local libsql DB (POST->list->image endpoint->SSR rendering).
