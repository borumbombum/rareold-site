Status: [DONE]

# Drawer — animate country → regions expand/collapse

## Context

In `src/lib/components/Drawer.svelte`, tapping a country origin toggles `expanded`, and its region list renders inside an `{#if expanded === origin.key}` block (lines ~160–181), appearing/collapsing instantly. The chevron already rotates via `transition-transform duration-200` (line ~153). The project rule is Tailwind classes only (no custom CSS, no `svelte/transition` JS animations).

## Requirements

- Animate the region list smoothly when a country is toggled open/closed (expand + collapse, not instant).
- Tailwind-only: e.g. a grid `grid-template-rows` transition (`grid-rows-[0fr]` ↔ `grid-rows-[1fr]`) with an `overflow-hidden` inner wrapper, optionally fading/sliding the content. This requires keeping the region block mounted and switching classes rather than `{#if}`.
- Preserve the existing single-open behavior (`expanded` state), chevron rotation, aria attributes, and dark mode styling.

## Acceptance criteria

- Toggling a country animates its region list open and closed in the drawer.
- Only one country's regions can be open at a time; chevron still rotates.
- `npm run check` passes; no drawer regressions.

## Progress

- 2026-08-15 — Replaced the `{#if expanded === origin.key}` region block in `src/lib/components/Drawer.svelte` with a Tailwind-only grid-rows transition: outer wrapper `grid transition-[grid-template-rows] duration-200 ease-out` toggling `grid-rows-[1fr]` ↔ `grid-rows-[0fr]`, inner `min-h-0 overflow-hidden` grid item; block stays mounted. Collapsed content is `inert` + `aria-hidden` (preserves the unmount a11y behavior and prevents tab focus). Single-open `expanded` state, chevron rotation, and active styles unchanged.
- Verified: `npm run check` 0 errors, 12 warnings (same as before).
