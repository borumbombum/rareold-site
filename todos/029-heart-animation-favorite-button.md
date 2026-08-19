Status: TODO

# Heart animation effect on FavoriteButton

## Context

The `FavoriteButton.svelte` currently toggles between an empty heart and a filled rose heart with a simple CSS transition. This task adds a delightful micro-interaction: a **pop/bounce animation** on the heart when favoriting, plus a **particle burst** of small colored dots that fly outward from the button. Uses the exact CSS keyframes and animation pattern from the reference implementation.

The data layer (server-side favorites via `favorites` store + `/api/favorites`) stays unchanged — this is purely a visual enhancement.

## Requirements

### 1. CSS keyframes

Add to `src/app.css` (after the existing `@theme` keyframes):

```css
/* Heart pop animation */
@keyframes heartPop {
    0%   { transform: scale(1); }
    15%  { transform: scale(1.35); }
    30%  { transform: scale(0.9); }
    45%  { transform: scale(1.2); }
    60%  { transform: scale(1); }
}

/* Heart particle burst */
@keyframes heartParticleBurst {
    0%   { opacity: 1; transform: translate(0, 0) scale(1); }
    100% { opacity: 0; transform: translate(var(--tx), var(--ty)) scale(0); }
}
```

Register `heart-pop` in the `@theme` block:
```css
--animate-heart-pop: heartPop 0.45s cubic-bezier(0.175, 0.885, 0.32, 1.275);
```

### 2. FavoriteButton.svelte changes

**Animation state:**
- Add `let popping = $state(false)` — set to `true` on favorite, reset after 450ms
- Button gets class `animate-heart-pop` when `popping` is true
- Button needs `overflow: visible` so particles aren't clipped

**Particle spawn function:**
```ts
const PARTICLE_COLORS = ['#f43f5e', '#fb7185', '#fda4af', '#e11d48', '#f43f5e'];

function burst(x: number, y: number) {
    const count = 10;
    for (let i = 0; i < count; i++) {
        const el = document.createElement('span');
        el.className = 'heart-particle';
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
        const distance = 32 + Math.random() * 40;
        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance - 10;
        el.style.setProperty('--tx', tx + 'px');
        el.style.setProperty('--ty', ty + 'px');
        el.style.left = x + 'px';
        el.style.top = y + 'px';
        el.style.background = PARTICLE_COLORS[i % PARTICLE_COLORS.length];
        document.body.appendChild(el);
        setTimeout(() => {
            if (el.parentNode) el.parentNode.removeChild(el);
        }, 700);
    }
}
```

**Particle CSS class** (add to `src/app.css`):
```css
.heart-particle {
    position: fixed;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    pointer-events: none;
    z-index: 9999;
    animation: heartParticleBurst 0.7s ease-out forwards;
}
```

**Toggle function update:**
- On successful favorite (not unfavorite): trigger pop + burst
- Get button rect for particle spawn position: `btn.getBoundingClientRect()`
- On unfavorite: no particles, no pop (just smooth transition)

**Button element:**
```svelte
<button
    onclick={toggle}
    disabled={busy}
    title={m.favorite()}
    aria-pressed={isFav}
    class="heart-btn inline-flex shrink-0 items-center rounded-full border font-medium transition overflow-visible disabled:opacity-60 {sizeClasses} {isFav
        ? 'border-rose-400 bg-rose-400 text-white'
        : 'border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-white'} {popping ? 'animate-heart-pop' : ''}"
>
    <Heart size={iconSize} fill={isFav ? 'currentColor' : 'none'} />
</button>
```

### 3. Key implementation details

- **Only on add**: particles + pop fire only when `isFav` becomes `true`, not on remove
- **Both sizes**: works for `sm` (14px icon) and `md` (18px icon) — particles spawn at button center regardless of size
- **Dark mode**: particles are colored (rose tones), not themed — works the same
- **Cleanup**: particles are `position: fixed` on `document.body`, removed after 700ms via `setTimeout`
- **No new dependencies**: pure CSS keyframes + DOM manipulation
- **Svelte 5**: use `$state` for `popping`, `setTimeout` for cleanup

## Files affected

| File | Change |
|------|--------|
| `src/app.css` | Add `heartPop`, `heartParticleBurst` keyframes, `.heart-particle` class, register `--animate-heart-pop` in `@theme` |
| `src/lib/components/FavoriteButton.svelte` | Add `popping` state, `burst()` function, trigger on favorite, `overflow-visible` + animation class on button |

## Acceptance criteria

- Clicking heart to favorite triggers a bounce/pop animation on the heart icon (scale 1 → 1.35 → 0.9 → 1.2 → 1)
- 10 colored particles (rose tones) burst outward from the button center on favoriting
- Particles fade out and are removed from DOM after 700ms
- Unfavoriting has a smooth transition but no particles, no pop
- Works on both `sm` and `md` button sizes
- Works in dark mode
- No visual glitches (no clipping, no z-index issues, particles appear above other elements)
- `npm run check`, `npm run build` pass

## Progress

