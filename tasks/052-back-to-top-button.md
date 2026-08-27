Status: [DONE]

# Back to top button

## Context

Long pages (home grid, origin listings, product pages) need a quick way back to the top. This is a pure UI task — no data layer or API changes. The button must be **site-wide**: mounted once in `+layout.svelte` so it appears on every page after scrolling down.

Project constraints apply: Tailwind classes only (no custom CSS), Svelte 5 runes (`$state`/`$derived`), localized text via paraglide messages, ultra-light (no new dependencies).

## Requirements

### 1. Component: `src/lib/components/BackToTop.svelte`

- Fixed circular button, bottom-right (`fixed bottom-6 right-6 z-40`).
- Icon: `ArrowUp` from `@lucide/svelte` (already a dependency).
- Styling: Tailwind only — bordered/zinc palette consistent with existing buttons (see AuthButton/VoteButton styles), with `dark:` variants.
- Visibility logic:
  - Use `<svelte:window bind:scrollY={y} />` with `let y = $state(0)`.
  - Visible when `y > 500`, hidden otherwise.
  - Hide/show via opacity + translate transition (`transition-opacity` / translate-y), plus `pointer-events-none` when hidden so it never blocks clicks near the footer.
- Click: `window.scrollTo({ top: 0, behavior: 'smooth' })`.
- Accessibility: `<button>` with localized `aria-label` and `title`.
- z-index below modals/drawer (modals use higher z) so it never overlaps overlays.

### 2. Mount site-wide

- Render `<BackToTop />` once in `src/routes/+layout.svelte` (outside page content, after `<main>`).

### 3. Localization

- New message key `back_to_top` ("Back to top") in all 5 locale files:
  - `messages/en.json`: "Back to top"
  - `messages/es.json`: "Volver arriba"
  - `messages/pt.json`: "Voltar ao topo"
  - `messages/ja.json`: "トップへ戻る"
  - `messages/fr.json`: "Retour en haut"
- Recompile paraglide afterwards (`npx paraglide-js compile --project ./project.inlang --outdir ./src/lib/paraglide`) — never hand-edit generated files.

## Files affected

| File | Change |
|------|--------|
| `src/lib/components/BackToTop.svelte` | New component |
| `src/routes/+layout.svelte` | Mount `<BackToTop />` site-wide |
| `messages/{en,es,pt,ja,fr}.json` | Add `back_to_top` key |

## Acceptance criteria

- Button appears after scrolling ~500px on any page (all locales) and hides again at the top with a smooth transition.
- Hidden state does not intercept clicks (no invisible overlay over footer content).
- Smooth-scrolls to top on click; works with keyboard focus + Enter.
- Looks correct in light and dark mode.
- No layout shift / CLS introduced; no horizontal overflow on mobile.
- Does not overlap modal/drawer overlays when they are open.
- `npm run check` passes; dev smoke on `/` confirms behavior.

## Progress

- 2026-08-27 (big-pickle): Implemented. Created `src/lib/components/BackToTop.svelte` (fixed bottom-right `z-40`, `<svelte:window bind:scrollY>`, visible >500px, opacity+translate+pointer-events-none hidden state, `inert`, smooth scroll, localized aria-label/title, ArrowUp icon, zinc+dark palette matching VoteButton). Mounted `<BackToTop />` in `+layout.svelte`. Added `back_to_top` key to en/es/pt/ja/fr. Ran explicit `npx paraglide-js compile` to regenerate messages (svelte-check alone doesn't pick up new keys). `npm run check` 0 errors, `npm run build` OK. Marked DONE.
