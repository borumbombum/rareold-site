<script lang="ts">
    import { onMount } from "svelte";
    import { browser } from "$app/environment";
    import OriginFilters from "$lib/components/OriginFilters.svelte";
    import ViewToggle from "$lib/components/ViewToggle.svelte";
    import ProductCard from "$lib/components/ProductCard.svelte";
    import ProductRow from "$lib/components/ProductRow.svelte";
    import { karmaStore, refreshKarma, seedKarma } from "$lib/stores/karma.svelte";
    import { view } from "$lib/stores/view.svelte";
    import { filters, setOrigin, setRegion } from "$lib/stores/filters.svelte";
    import { originFlag, originKey, originLabel, regionsByOrigin } from "$lib/utils/origins";
    import { l10n } from "$lib/utils/l10n";
    import { X } from "@lucide/svelte";
    import { m } from "$lib/paraglide/messages";
    import { getLocale } from "$lib/paraglide/runtime";
    import { formatNumber } from "$lib/utils/format";
    import type { PageData } from "./$types";

    let { data }: { data: PageData } = $props();

    seedKarma(data.countryCode, data.karma);
    const locale = $derived(getLocale());

    onMount(() => {
        refreshKarma(data.products.map((p) => p.slug));
    });

    // swap for your real hero image (from data, a CMS field, static asset, whatever)
    const heroImageUrl = "/images/whisky.webp";

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
            const diff = karmaStore.get(b.slug).karma - karmaStore.get(a.slug).karma;
            if (diff !== 0) return diff;
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

<section class="hero">
    <div class="hero__bg" style="background-image: url('{heroImageUrl}')"></div>
    <div class="hero__overlay"></div>

    <div class="hero__content mx-auto max-w-7xl px-6 w-full">
        <h1 class="hero__title font-display leading-[100%]">{m.ranking_title()}</h1>
        <p class="hero__subtitle">{m.ranking_subtitle()}</p>
        <p class="hero__count">
            {m.products_count({ count: formatNumber(count, locale) })}
        </p>
    </div>
</section>

<section class="mx-auto max-w-7xl px-4 pb-24 sm:px-6">
    <div class="flex flex-col gap-6 pt-10">
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
            onSelect={(k) => setOrigin(k)}
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
        {:else}
            <div class="flex flex-col gap-3">
                {#each ranked as product, i (product.slug)}
                    <ProductRow {product} rank={i + 1} country={data.countryCode} />
                {/each}
            </div>
        {/if}
    </div>
</section>

<style>
    .hero {
        position: relative;
        min-height: 380px;
        display: flex;
        align-items: flex-end;
        overflow: hidden;
    }

    @media (min-width: 640px) {
        .hero {
            min-height: 460px;
        }
    }

    .hero__bg {
        position: absolute;
        inset: 0;
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
    }

    .hero__overlay {
        position: absolute;
        inset: 0;
        background: linear-gradient(
                to right,
                rgba(0, 0, 0, 0.8) 0%,
                rgba(0, 0, 0, 0.6) 28%,
                rgba(0, 0, 0, 0.2) 58%,
                rgba(0, 0, 0, 0) 85%
            ),
            linear-gradient(to top, rgba(0, 0, 0, 0.35) 0%, rgba(0, 0, 0, 0) 40%);
    }

    .hero__content {
        position: relative;
        z-index: 1;
        padding-top: 2rem;
        padding-bottom: 2.5rem;
    }

    @media (min-width: 640px) {
        .hero__content {
            padding-top: 2.5rem;
            padding-bottom: 3.5rem;
        }
    }

    .hero__title {
        font-weight: 600;
        letter-spacing: -0.02em;
        font-size: 2.25rem;
        color: #ffffff;
        text-shadow: 0 1px 12px rgba(0, 0, 0, 0.35);
    }

    @media (min-width: 640px) {
        .hero__title {
            font-size: 3rem;
        }
    }

    .hero__subtitle {
        margin-top: 0.75rem;
        font-size: 1rem;
        color: rgba(255, 255, 255, 0.85);
    }

    .hero__count {
        margin-top: 0.5rem;
        font-size: 0.875rem;
        color: rgba(255, 255, 255, 0.6);
    }
</style>
