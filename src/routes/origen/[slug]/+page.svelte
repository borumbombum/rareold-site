<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { localizeHref } from '$lib/paraglide/runtime';
	import Hero from '$lib/components/Hero.svelte';
	import OriginFilters from '$lib/components/OriginFilters.svelte';
	import ViewToggle from '$lib/components/ViewToggle.svelte';
	import ProductCard from '$lib/components/ProductCard.svelte';
	import ProductRow from '$lib/components/ProductRow.svelte';
	import { karmaStore, refreshKarma, seedKarma } from '$lib/stores/karma.svelte';
	import { view } from '$lib/stores/view.svelte';
	import { filters, setRegion, resetFilters } from '$lib/stores/filters.svelte';
	import { originFlag, originLabel, originSlug, regionsByOrigin } from '$lib/utils/origins';
	import { l10n } from '$lib/utils/l10n';
	import { X, ArrowLeft } from '@lucide/svelte';
	import { m } from '$lib/paraglide/messages';
	import { getLocale } from '$lib/paraglide/runtime';
	import { formatNumber } from '$lib/utils/format';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	seedKarma(data.countryCode, data.karma);
	const locale = $derived(getLocale());

	const ORIGIN_HERO_IMAGES: Record<string, string> = {
		scotland: 'https://images.unsplash.com/photo-1513267048331-5611cad62e8f?w=1600&h=900&fit=crop',
		ireland: 'https://images.unsplash.com/photo-1590089415225-401eb6cbb075?w=1600&h=900&fit=crop',
		usa: 'https://images.unsplash.com/photo-1554059923-b72d858e2a5d?w=1600&h=900&fit=crop',
		japan: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=1600&h=900&fit=crop',
		india: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1600&h=900&fit=crop',
		canada: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1600&h=900&fit=crop',
		argentina: 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=1600&h=900&fit=crop',
		other: '/images/whisky.webp'
	};

	const heroImageUrl = $derived(ORIGIN_HERO_IMAGES[data.slug] ?? '/images/whisky.webp');
	const originName = $derived(originLabel(data.slug));

	const backHref = $derived(localizeHref('/'));

	onMount(() => {
		refreshKarma(data.products.map((p) => p.slug));
	});

	const regionsForOrigin = $derived(regionsByOrigin(data.products)[data.slug] ?? []);

	const filtered = $derived(
		data.products.filter((p) => {
			if (filters.region !== null && p.region !== filters.region) return false;
			return true;
		})
	);
	const ranked = $derived(
		[...filtered].sort((a, b) => {
			const diff = karmaStore.get(b.slug).karma - karmaStore.get(a.slug).karma;
			if (diff !== 0) return diff;
			const an = l10n(a, 'name') ?? a.name;
			const bn = l10n(b, 'name') ?? b.name;
			return an.localeCompare(bn);
		})
	);
	const mode = $derived(browser ? view.current : data.view);
	const count = $derived(ranked.length);
</script>

<svelte:head>
	<title>{originName} — Rare Old</title>
	<link rel="alternate" hreflang="es" href="https://borum.com.uy/origen/{originSlug(data.slug, 'es')}" />
	<link rel="alternate" hreflang="pt" href="https://borum.com.uy/br/origem/{originSlug(data.slug, 'pt')}" />
	<link rel="alternate" hreflang="en" href="https://borum.com.uy/en/origin/{originSlug(data.slug, 'en')}" />
</svelte:head>

<Hero
	imageUrl={heroImageUrl}
	title={m.origin_page_title({ origin: originName })}
	subtitle={m.origin_page_subtitle({ origin: originName })}
	count={m.products_count({ count: formatNumber(count, locale) })}
/>

<section class="mx-auto max-w-7xl px-4 pb-24 sm:px-6">
	<div class="flex flex-col gap-6 pt-10">
		<div class="flex items-center justify-between gap-4">
			<a
				href={backHref}
				class="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
			>
				<ArrowLeft size={15} />
				{m.origin_back()}
			</a>
			<ViewToggle />
		</div>

		<OriginFilters
			selected={data.slug}
			counts={{}}
			regions={regionsForOrigin}
			selectedRegion={filters.region}
			onSelect={(k) => {
				if (k === 'all') {
					resetFilters();
					goto(backHref);
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
					<span>{originFlag({ origin: data.slug })}</span>
					<span>{originName}</span>
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

		{#if mode === 'grid'}
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
