<script lang="ts">
	import { onMount } from 'svelte';
	import OriginFilters from '$lib/components/OriginFilters.svelte';
	import ViewToggle from '$lib/components/ViewToggle.svelte';
	import ProductCard from '$lib/components/ProductCard.svelte';
	import ProductRow from '$lib/components/ProductRow.svelte';
	import { karmaStore, seedKarma } from '$lib/stores/karma.svelte';
	import { view } from '$lib/stores/view.svelte';
	import { filters, setOrigin, setRegion } from '$lib/stores/filters.svelte';
	import { originFlag, originKey, originLabel, regionsByOrigin } from '$lib/utils/origins';
	import { l10n } from '$lib/utils/l10n';
	import { X } from 'lucide-svelte';
	import { m } from '$lib/paraglide/messages';
	import { getLocale } from '$lib/paraglide/runtime';
	import { formatNumber } from '$lib/utils/format';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	seedKarma(data.countryCode, data.karma);
	const locale = $derived(getLocale());

	onMount(() => {
		const slugs = data.products.map((p) => p.slug).join(',');
		fetch(`/api/karma?slugs=${encodeURIComponent(slugs)}`)
			.then((r) => (r.ok ? r.json() : null))
			.then((res) => {
				if (!res?.items) return;
				karmaStore.refresh(
					res.items.map((e: { entity_id: string; karma: number; vote_count: number }) => ({
						slug: e.entity_id,
						karma: e.karma,
						votes: e.vote_count
					}))
				);
			})
			.catch(() => {});
	});

	const regionsForOrigin = $derived(regionsByOrigin(data.products)[filters.origin] ?? []);

	const filtered = $derived(
		data.products.filter((p) => {
			if (filters.origin !== 'all' && originKey(p) !== filters.origin) return false;
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
	const mode = $derived(view.current);
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

<section class="mx-auto max-w-7xl px-4 pb-24 sm:px-6">
	<div class="py-10 text-center sm:py-16">
		<h1 class="font-display text-4xl font-semibold tracking-tight text-zinc-900 dark:text-white sm:text-5xl">
			{m.ranking_title()}
		</h1>
		<p class="mt-3 text-base text-zinc-500 dark:text-zinc-400">{m.ranking_subtitle()}</p>
		<p class="mt-2 text-sm text-zinc-400">
			{m.products_count({ count: formatNumber(count, locale) })}
		</p>
	</div>

	<div class="flex flex-col gap-6">
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
				<span class="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-2 text-sm font-medium text-zinc-900 dark:text-white">
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

		{#if mode === 'grid'}
			<div class="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
				{#each ranked as product, i (product.slug)}
					<ProductCard product={product} rank={i + 1} country={data.countryCode} />
				{/each}
			</div>
		{:else}
			<div class="flex flex-col gap-3">
				{#each ranked as product, i (product.slug)}
					<ProductRow product={product} rank={i + 1} country={data.countryCode} />
				{/each}
			</div>
		{/if}
	</div>
</section>
