<script lang="ts">
    import { onMount } from "svelte";
    import { browser } from "$app/environment";
    import { goto } from "$app/navigation";
    import { localizeHref } from "$lib/paraglide/runtime";
    import HeroHome from "$lib/components/HeroHome.svelte";
    import ActivityFeed from "$lib/components/ActivityFeed.svelte";
    import OriginFilters from "$lib/components/OriginFilters.svelte";
    import ViewToggle from "$lib/components/ViewToggle.svelte";
    import ProductCard from "$lib/components/ProductCard.svelte";
    import ProductRow from "$lib/components/ProductRow.svelte";
    import ProductCompact from "$lib/components/ProductCompact.svelte";
    import { ratingStore, refreshRating, seedRating } from "$lib/stores/rating.svelte";
    import { view } from "$lib/stores/view.svelte";
    import { filters, setOrigin, setRegion } from "$lib/stores/filters.svelte";
    import { originFlag, originKey, originLabel, originSlug, regionsByOrigin } from "$lib/utils/origins";
    import { l10n } from "$lib/utils/l10n";
    import { X } from "@lucide/svelte";
    import { m } from "$lib/paraglide/messages";
    import { getLocale } from "$lib/paraglide/runtime";
    import type { PageData } from "./$types";

    let { data }: { data: PageData } = $props();

    seedRating(data.countryCode, data.rating);
    const locale = $derived(getLocale());

    onMount(() => {
        refreshRating(data.products.map((p) => p.slug));
    });

    const regionsForOrigin = $derived(regionsByOrigin(data.products)[filters.origin] ?? []);

    const filtered = $derived(
        data.products.filter((p) => {
            if (filters.origin !== "all" && originKey(p) !== filters.origin) return false;
            if (filters.region !== null && p.region !== filters.region) return false;
            return true;
        }),
    );
    const ranked = $derived(
        [...filtered].sort((a, b) => {
            const diff = ratingStore.get(b.slug).avg_rating - ratingStore.get(a.slug).avg_rating;
            if (diff !== 0) return diff;
            const diffCount = ratingStore.get(b.slug).review_count - ratingStore.get(a.slug).review_count;
            if (diffCount !== 0) return diffCount;
            const an = l10n(a, "name") ?? a.name;
            const bn = l10n(b, "name") ?? b.name;
            return an.localeCompare(bn);
        }),
    );
    const mode = $derived(browser ? view.current : data.view);
    const count = $derived(ranked.length);
    const originCounts = $derived.by(() => {
        const counts: Record<string, number> = { all: data.products.length };
        for (const p of data.products) {
            const k = originKey(p);
            counts[k] = (counts[k] ?? 0) + 1;
        }
        return counts;
    });
</script>

<svelte:head>
    <title>{m.seo_home_title()}</title>
</svelte:head>

<HeroHome title={m.ranking_title()} subtitle={m.ranking_subtitle()} />

<section id="ranking" class="mx-auto max-w-7xl px-4 pb-24 sm:px-6 mt-2 md:mt-5">
    <div class="flex flex-col gap-6 pt-2">
        <div class="flex items-center justify-between gap-4">
            <p class="font-display text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                {m.filters_origin()}
            </p>
            <ViewToggle />
        </div>

        <OriginFilters
            selected={filters.origin}
            counts={originCounts}
            regions={regionsForOrigin}
            selectedRegion={filters.region}
            onSelect={(k) => {
                if (k === "all") {
                    setOrigin("all");
                } else {
                    goto(localizeHref(`/origen/${originSlug(k, locale)}`));
                }
            }}
            onSelectRegion={setRegion}
        />

        {#if filters.region !== null}
            <div class="flex flex-wrap items-center gap-2">
                <span
                    class="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-2 text-sm font-medium text-zinc-900 dark:text-white"
                >
                    <span>{originFlag({ origin: filters.origin })}</span>
                    <span>{originLabel(filters.origin)}</span>
                    <span class="text-zinc-500 dark:text-zinc-400">· {filters.region}</span>
                </span>
                <button
                    onclick={() => setRegion(null)}
                    class="grid h-9 w-9 place-items-center rounded-full border border-zinc-200 text-zinc-500 transition hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-white"
                    aria-label={m.drawer_clear()}
                >
                    <X size={15} />
                </button>
            </div>
        {/if}

        {#if mode === "grid"}
            <div class="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
                {#each ranked as product, i (product.slug)}
                    <ProductCard {product} rank={i + 1} country={data.countryCode} />
                {/each}
            </div>
        {:else if mode === "list"}
            <div class="flex flex-col gap-3">
                {#each ranked as product, i (product.slug)}
                    <ProductRow {product} rank={i + 1} country={data.countryCode} />
                {/each}
            </div>
        {:else}
            <div class="divide-y divide-zinc-100 dark:divide-zinc-800">
                {#each ranked as product, i (product.slug)}
                    <ProductCompact {product} rank={i + 1} country={data.countryCode} />
                {/each}
            </div>
        {/if}
    </div>
</section>

{#if data.activity && data.activity.length > 0}
    <ActivityFeed items={data.activity} />
{/if}
