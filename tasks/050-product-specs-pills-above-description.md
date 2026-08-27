Status: [DONE]

# Move Product Specs Above Description as Compact Pills

## Context

On the product detail page (`/whisky/[slug]`), the technical specs (region, age, ABV, volume, cask) currently appear at the very bottom of the right column, inside a full `<section>` with a ClipboardList icon title "Details" and a `<dl>` grid of rounded boxes. This is too far down — users have to scroll past the description, rating bar, stores, reviews, and videos to see basic product info. The specs should be immediately visible after the product name and distillery, rendered as compact inline pills without a section header.

## Requirements

1. **Move specs section** from bottom (after videos) to right after the distillery name line.
2. **Remove** the `<section>` wrapper, the ClipboardList icon, the "Details" heading, and the `<dl>` grid layout.
3. **Replace** with a simple `flex-wrap` row of small rounded-full pills.
4. Each non-empty spec renders as: `label: value` in a compact pill badge.
5. Separator dots between pills for visual clarity.
6. Specs list remains the same data: region, age, ABV, volume, cask (from the existing `specs` derived).

## Acceptance Criteria

- [ ] Specs appear directly below the distillery name, above the description.
- [ ] No section header or ClipboardList icon — just inline pills.
- [ ] Each spec is a small rounded pill with `bg-zinc-100 dark:bg-zinc-800` styling.
- [ ] Separator dots between pills.
- [ ] All existing specs still render when present.
- [ ] Empty specs are still filtered out (no empty pills).
- [ ] `npm run check`, `npm run build` pass.

## Implementation Plan

### 1. `src/routes/whisky/[slug]/+page.svelte`

**Remove** the specs section block (lines ~143–160, the `{#if specs.length > 0}` `<section>` with ClipboardList + `<dl>` grid).

**Insert** a new block right after the distillery name `<p>` (after the `{#if product.distillery}` block, before the description section):

```svelte
{#if specs.length > 0}
    <div class="mt-3 flex flex-wrap items-center gap-1.5">
        {#each specs as spec, i}
            {#if i > 0}
                <span class="text-zinc-300 dark:text-zinc-600">·</span>
            {/if}
            <span class="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                {spec.label}: {spec.value}
            </span>
        {/each}
    </div>
{/if}
```

No other files need changes.

## Progress

- 2026-08-21 (buffy): Task created. Awaiting implementation.
- 2026-08-22 (ox-alpha-v050): DONE. Moved specs from bottom `<section>` (ClipboardList + dl grid) to a flex-wrap pill row directly under the distillery name, above the description. Pills: `rounded-full bg-zinc-100 dark:bg-zinc-800` with `·` separators; removed ClipboardList import. E2E verified on preview: ardbeg-10-yo renders all 5 pills (Region/Age/ABV/Volume/Cask), 1770-glasgow-peated renders only Region (nulls filtered). check 0 errors, build OK.
