# Learnings

## 2026-08-22 — Origin hero images (Scotland/Ireland fix)

- Origin page heroes are a hardcoded `ORIGIN_HERO_IMAGES` map in `src/routes/origen/[slug]/+page.svelte`; there are no per-origin images on the homepage (tiles use flag emojis). Fallback everywhere is `/images/whisky.webp` via `onerror` in `Hero.svelte`/`HeroHome.svelte` — so a dead remote URL fails *silently*.
- Two of the twelve hotlinked Unsplash URLs had rotted to 404 (scotland, ireland) without anyone noticing. Lesson: self-host hero imagery under `static/images/origins/*.webp` instead of hotlinking; check remote URLs periodically (`curl -o /dev/null -w "%{http_code}" -L <url>` loop works well).
- Unsplash download endpoint `https://unsplash.com/photos/<slug>/download?force=true&w=2000` reliably returns the full-res JPEG for any free (non Unsplash+) photo; verify each slug resolves before committing to it.
- sharp WebP tuning: `effort: 6` (max is 6, default 4) shrinks detailed photos ~10-15% over plain quality setting. Detailed landscape shots compress far worse than product-on-plain-background: Glenfinnan viaduct @2000w q80 ≈ 500KB vs whisky.webp 107KB. Don't assume one quality number gives similar sizes across image types.
- Inlang localization gotcha when smoke-testing: base locale (en) has NO path prefix — English pages live at `/origen/scotland`, not `/en/origen/scotland`. Check `project.inlang/settings.json` urlPatterns before curling localized routes.
- This repo's `ps`, `pkill`, `file` binaries may be missing in the container; use `/proc/<pid>/cmdline` iteration or `kill $(...)` and `head -c N | od -c` for file type checks.
