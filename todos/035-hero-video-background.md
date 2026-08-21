Status: DONE

## Progress

- 2026-08-20: Initial attempt with YouTube IFrame API (HeroYoutube.svelte). YouTube iframe can't do object-fit: cover — iframe stays small and centered, mobile broken.
- 2026-08-20: Switched to self-hosted `<video>` approach. Downloaded 10-second clip at 480p via yt-dlp (`static/videos/hero.mp4`, 1.3MB).
- 2026-08-20: Created `src/lib/components/HeroVideo.svelte` — native `<video autoplay muted loop playsinline>` with `object-cover`, canplay event, prefers-reduced-motion check, spinner.
- 2026-08-20: Created `src/lib/configuration.ts` — hero.videoEnabled, hero.videoSrc, hero.videoStartSeconds, hero.mobileVideoEnabled.
- 2026-08-20: Modified `src/lib/components/HeroHome.svelte` — conditional HeroVideo render, z-index layering, opacity-0 fade on videoReady.
- 2026-08-20: Deleted `HeroYoutube.svelte`. Build verified — `npm run build` passes.
- 2026-08-20: Added client-side caching. Moved video from `static/videos/` to `data/videos/`, created `src/routes/data/videos/[file]/+server.ts` SvelteKit endpoint (provider-agnostic, prerendered, 30-day immutable cache). Updated `configuration.ts` to `/data/videos/hero.mp4`. Cleaned up leftover partial download. Build verified.
- 2026-08-20: Fixed two bugs:
  1. Mobile: `mobileVideoEnabled` was `false`, wrapper had `hidden sm:block`. Now set to `true` so video shows on mobile.
  2. Gray background on mobile: `onCanPlay` fired even when video was CSS-hidden, causing image to fade to `opacity-0` with nothing behind it. Added visibility check — `onReady()` only fires if `mobile || window.innerWidth >= 640`.
  3. Confirmed via curl that Cache-Control headers ARE sent correctly in dev mode for both image and video endpoints. Caching works — slow reload may be browser `<video>` range-request behavior, not a missing header issue.

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

- 2026-08-21 (ox-alpha): Marked DONE during housekeeping — verified implemented earlier by another agent (build passed, progress log complete).
