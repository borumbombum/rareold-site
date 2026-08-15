Status: TODO

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

