Status: TODO

# Share button on product pages (Web Share API)

## Context

The product detail page (`src/routes/whisky/[slug]/+page.svelte`) has no share button. The product image sits in a `relative` container (line ~62), and a `PlayButton` is already absolutely positioned top-right (line ~69) when a product has a video — so the share button placement must avoid a collision.

The Web Share API (`navigator.share`) opens the OS share sheet. It requires a user gesture and a secure context, and is not available on all desktop browsers, so it needs a graceful fallback: copy the link to the clipboard and surface feedback via the existing toast (`ui.showToast` in `src/lib/stores/ui.svelte.ts`). No `share*` Paraglide message keys exist in `messages/es.json` / `messages/pt.json` yet.

## Requirements

- Add a share button on the product detail page, absolute-positioned top-right over the product image.
- On tap, call `navigator.share({ title, text, url })` with the localized absolute product URL (`window.location.origin` + `localizeHref('/whisky/' + slug)`) and the product name/description.
- Handle unavailable `navigator.share` (and aborted/failed shares) gracefully: copy the link to the clipboard and show a toast; never throw.
- Avoid overlap with the existing video `PlayButton`: keep the share button top-right and move/stack the play button as needed.
- Tailwind classes only; use the lucide `Share`/`Share2` icon following existing icon conventions; add the Paraglide message key(s) for es/pt.

## Acceptance criteria

- Share button visible top-right over the product image on desktop and mobile.
- Tapping opens the native share sheet where supported; otherwise it copies the link and shows a toast.
- No visual overlap with the video play button when a video exists.
- `npm run check` passes; build works.

## Progress

