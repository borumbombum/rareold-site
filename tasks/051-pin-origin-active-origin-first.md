Status: [DONE]

# Pin Origins + Active Origin First

## Context

Visitors can filter by origin on the homepage and origin pages, but have no way to keep their favorite origins always visible. Origins overflow into a "More origins" dropdown when there are more than 7. Additionally, when viewing a specific origin page (`/origen/[slug]`), there's no visual signal in the origin filter list indicating *which* origin the user is currently browsing — they rely solely on the hero header.

This task adds two related behaviors:
1. **Pin an origin**: Visitor clicks a pin icon → origin gets a pinned badge and always appears in the visible origin list site-wide. Persisted in `localStorage`.
2. **Active origin first**: When viewing an origin page, that origin moves to position #1 in the origin filter list with a distinct accent highlight, making it clear the user is "inside" that origin.

## Requirements

### 1. Storage

- `localStorage` key `rareold.pinnedOrigins` → `string[]` of origin IDs.
- Purely client-side, no DB, no auth required. Same pattern as existing sort preference.
- Max 5 pinned origins enforced.

### 2. Origin sorting precedence (replaces hardcoded `PINNED_ORIGINS`)

Current: `PINNED_ORIGINS` (`['canada']`) → by count → top 7.

New order:
1. **Active origin** (user is viewing it) — always #1, highlighted accent style
2. **User-pinned origins** (from localStorage) — sorted by product count
3. **Hardcoded pinned** (`'canada'`) — kept as a baseline
4. **Remaining origins** — by product count
5. Up to `MAX_VISIBLE_ORIGINS` (7) total visible; rest in overflow
6. Pinned origins never go to overflow; limit grows to accommodate them

### 3. Pin button UX

- Small `Pin` icon (Lucide, 14px) on each origin pill/row — outline when unpinned, filled + accent color when pinned.
- Click toggles pin with `ui.showToast` feedback ("Pinned Scotland" / "Unpinned Scotland").
- Hidden on the "All" pill.
- Works in both `OriginFilters.svelte` (homepage + origin pages) and `Drawer.svelte`.

### 4. Active origin visual

- When `activeOrigin` matches an origin key, that pill gets `ring-2 ring-accent/50` plus accent background — visually distinct from normal "selected" state.
- On origin pages, pass `activeOrigin={data.slug}` to `OriginFilters`.

### 5. Overflow behavior

- Pinned origins always visible, never in overflow.
- If pinning pushes visible count past `MAX_VISIBLE_ORIGINS`, the limit grows to `MAX_VISIBLE_ORIGINS + MAX_PINNED`.
- Active origin always visible regardless of pin state.

## Acceptance Criteria

- [ ] Pin icon appears on each origin pill (except "All") in `OriginFilters` and `Drawer`
- [ ] Clicking pin toggles state, persisted in `localStorage`
- [ ] Pinned origins always visible in the origin list, never in overflow
- [ ] Active origin (on `/origen/[slug]`) appears first with distinct accent styling
- [ ] Max 5 pinned origins enforced; toast feedback on pin/unpin
- [ ] Works on both homepage and origin pages, plus drawer
- [ ] `npm run check`, `npm run build` pass

## Implementation Plan

### 1. `src/lib/utils/origins.ts`

- Add `MAX_PINNED = 5`.
- Add `getPinnedOrigins(): string[]` — reads `localStorage` key `rareold.pinnedOrigins`, returns array.
- Add `togglePinnedOrigin(key: string): boolean` — adds/removes from list, enforces max 5, writes to `localStorage`, returns new pinned state.
- Add `isPinnedOrigin(key: string): boolean` — checks if key is in pinned list.
- Add `sortOriginsForDisplay(counts: Record<string, number>, activeOrigin?: string): OriginDef[]` — implements the full precedence: active → user-pinned → hardcoded pinned → rest by count. Reserves slots for pinned origins beyond `MAX_VISIBLE_ORIGINS`.
- Export these new functions alongside existing ones.

### 2. `src/lib/components/OriginFilters.svelte`

- Accept new optional prop `activeOrigin?: string`.
- For each origin pill (not "All"), add a `Pin` icon button (Lucide) at the right edge.
- Pin icon: outline when unpinned, filled `text-accent` when pinned.
- On click: call `togglePinnedOrigin(origin.key)`, show toast.
- When `activeOrigin === origin.key`, apply accent ring styling: `ring-2 ring-accent/50` + `bg-accent/10`.
- Update `visible` derived to use `sortOriginsForDisplay(counts, activeOrigin)` instead of `visibleOriginsWithPinned`.

### 3. `src/lib/components/Drawer.svelte`

- Same pin icon treatment on each origin row (not "All").
- Same `activeOrigin` logic (derive from `filters.origin` when not `'all'`).
- Import `Pin` from Lucide, `togglePinnedOrigin`, `isPinnedOrigin` from origins utils.
- On click: toggle pin, show toast.

### 4. `src/routes/+page.svelte`

- No changes needed — homepage has no active origin (user arrives fresh), so `activeOrigin` is not passed or is `undefined`.

### 5. `src/routes/origen/[slug]/+page.svelte`

- Pass `activeOrigin={data.slug}` to `OriginFilters`.

### 6. i18n — `messages/{en,es,pt,ja,fr}.json`

Add keys:
- `origin_pinned`: "Pinned" / "Fijado" / "Fixado" / "ピン留め" / "Épinglé"
- `origin_unpinned`: "Unpinned" / "Desfijado" / "Desfixado" / "ピン留め解除" / "Désépinglé"

## Progress

- 2026-08-22 (buffy): Task created. Awaiting implementation.
- 2026-08-27 (big-pickle): Implemented. Verified current UI has NO 7-cap/"More origins" overflow (single flat scrollable list), so scoped to pinning + active-origin-first. Added `src/lib/stores/pinned-origins.svelte.ts` (rune store, `rareold.pinnedOrigins`, max 5, mirrors `view.svelte.ts`); `sortOriginsForDisplay()` in `origins.ts` (all → active → pinned → baseline canada → rest by count); Pin button + toast in `OriginFilters.svelte` and `Drawer.svelte`; `activeOrigin` prop passed from `/origen/[slug]` with accent ring; i18n keys in en/es/pt/ja/fr. `npm run check` 0 errors, `npm run build` OK. Marked DONE.
- 2026-08-28 (big-pickle): Fixed default ordering. Removed the hardcoded `BASELINE_PINNED = ['canada']` override (carried from task 051), which wrongly forced Canada (1 whisky) near the top before count-sorted origins. Precedence is now: All → active/navigated origin → user-pinned (by count) → remaining by count, so the default (no active/pinned) is purely whisky-count ordered (Scotland first). `npm run check` 0 errors.
