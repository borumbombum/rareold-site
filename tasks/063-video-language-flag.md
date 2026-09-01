Status: [TODO]

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

- [ ] Each video thumbnail shows a flag emoji badge in its top-right corner
- [ ] The flag corresponds to the video's `language` field using `LOCALE_CONFIG`
- [ ] Same styling for all videos regardless of whether it's the active locale or an English fallback
- [ ] No overlap with the center play button or the bottom-right `i/n` counter
- [ ] No layout shift or overflow on mobile/desktop
- [ ] Unknown or missing language renders nothing (safe fallback)
