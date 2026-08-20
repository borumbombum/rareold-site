Status: TODO

# Hero video background with image fallback and loading spinner

## Context

The homepage hero (`src/lib/components/HeroHome.svelte`) currently shows a static image (`/images/whisky.webp`) with a gradient overlay. The user wants an immersive video background (YouTube or other source) that loads behind the image, with the image shown as fallback until the video is ready. A spinner in the top-right indicates loading state.

## Requirements

1. Embed a background video in `HeroHome.svelte` — YouTube iframe (or `<video>` tag for self-hosted) behind the current image
2. Show the existing static image as a placeholder/fallback while the video loads
3. When the video is ready (iframe `onReady` or video `canplay` event), fade out the image to reveal the video
4. Show a small loading spinner (e.g. `Loader2` icon from lucide with `animate-spin`) in the absolute top-right corner of the hero section while the video is loading
5. Hide the spinner once the video is loaded
6. The video should autoplay, be muted, loop, and have no controls (background decoration only)
7. The existing gradient overlay must remain on top of the video for text readability
8. The video URL should be configurable — either hardcoded constant at the top of the component (easy to change) or from a prop/admin setting
9. Respect `prefers-reduced-motion`: if user prefers reduced motion, don't load the video, just show the image
10. Mobile: video may be heavy — consider showing image only on mobile (`sm:` breakpoint) and video on `md:` and up

## Acceptance criteria

- Hero shows image initially, video fades in behind it when ready
- Spinner visible in top-right during video load, disappears after
- Gradient overlay maintains text readability over video
- No layout shift when video loads
- `prefers-reduced-motion` shows static image only
- `npm run build` succeeds

## Progress
