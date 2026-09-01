Status: [DONE]

# Video Language Flag on Product Page

## Context

The `InfluencerVideos` component displays up to 4 video thumbnails on the product page. When the user's selected language doesn't have enough videos, English videos fill the gap (via `videosForLocale`). Currently there's no visual indicator on each video box showing which language it belongs to — users can't tell if a video is in their language or an English fallback.

Each `ProductVideo` already carries a `language` field. `LOCALE_CONFIG` in `src/lib/utils/locales.ts` maps language codes to flags (`en` → 🇺🇸, `es` → 🇺🇾, `pt` → 🇧🇷, `ja` → 🇯🇵, `fr` → 🇫🇷).

## Requirements

1. Add a language flag badge on each video thumbnail in `InfluencerVideos.svelte`, absolutely positioned in the **top-right corner** of the video box.
2. The flag is the emoji from `LOCALE_CONFIG[v.language]`, same styling for all videos (no active-locale / fallback differentiation).
3. Use the existing `LOCALE_CONFIG` flag emojis — no new assets needed.

## Files to modify

- `src/lib/components/InfluencerVideos.svelte` — add flag badge UI, import `LOCALE_CONFIG`

No other files need changing; `ProductVideo` already carries `language` and `LOCALE_CONFIG` is directly importable from `$lib/utils/locales`.

## Acceptance criteria

- [x] Each video thumbnail shows a flag emoji badge in its top-right corner
- [x] The flag corresponds to the video's `language` field using `LOCALE_CONFIG`
- [x] Same styling for all videos regardless of whether it's the active locale or an English fallback
- [x] No overlap with the center play button or the bottom-right `i/n` counter
- [x] No layout shift or overflow on mobile/desktop
- [x] Unknown or missing language renders nothing (safe fallback)

## Progress

- 2026-09-01 (big-pickle): Starting task. Confirmed `LOCALE_CONFIG` in `src/lib/utils/locales.ts` carries `flag` emojis per locale key (`en/es/pt/ja/fr`); `ProductVideo.language` is available in `InfluencerVideos.svelte`. Plan: add a top-right flag badge inside the relative `<button>`, keyed off `LOCALE_CONFIG[v.language]`, same styling for all videos, `{#if v.language && LOCALE_CONFIG[v.language]}` for the safe fallback. The `i/n` counter is bottom-right and the play button is centered, so a top-right flag won't overlap.
- 2026-09-01 (big-pickle): Done. Added a `flag()` helper in `InfluencerVideos.svelte` that returns the emoji from `LOCALE_CONFIG` for a language (empty string for unknown/missing), and a top-right badge `<span class="absolute right-1 top-1 rounded bg-white/80 px-1 text-sm leading-none shadow-sm">` inside each video `<button>`. TS needed a `LocaleKey` cast because `v.language` is typed `string` and `LOCALE_CONFIG` is a closed object literal (indexing with `string` errored). `npm run check` clean (0 errors, 25 baseline warnings). Verified on live dev (`/whisky/craigellachie-13-yo`): flag badges render as `absolute right-1 top-1 ... shadow-sm">🇺🇸</span>` per video. All acceptance criteria met.
- 2026-09-01 (big-pickle): Revision — flag now overhangs the video corner (like the modal close button). The `<button>` had `overflow-hidden` which clipped anything extending past its bounds, so I moved `overflow-hidden` off the button onto an inner `<span class="absolute inset-0 overflow-hidden rounded-[inherit]">` that wraps only the thumbnail/placeholder block (keeps the image clipped to rounded corners). The badge, `i/n` counter, and center play overlay are now unclipped siblings of the button. Badge classes changed to `absolute -right-1.5 -top-1.5 z-10 rounded bg-white/80 px-1 text-sm leading-none shadow-sm` (modest ~6px overhang, `z-10` on top). `npm run check` clean (0 errors, 25 baseline warnings). Live SSR confirms badge renders as a sibling `<span class="absolute -right-1.5 -top-1.5 z-10 ...">🇺🇸</span>` outside the clip wrapper.
