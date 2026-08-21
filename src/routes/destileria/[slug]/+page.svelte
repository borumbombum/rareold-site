<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { localizeHref, getUrlOrigin } from '$lib/paraglide/runtime';
	import { buildAlternates } from '$lib/utils/seo';
	import SEO from '$lib/components/SEO.svelte';
	import Hero from '$lib/components/Hero.svelte';
	import ViewToggle from '$lib/components/ViewToggle.svelte';
	import ProductCard from '$lib/components/ProductCard.svelte';
	import ProductRow from '$lib/components/ProductRow.svelte';
	import ProductCompact from '$lib/components/ProductCompact.svelte';
	import { ratingStore, refreshRating, seedRating } from '$lib/stores/rating.svelte';
	import { view } from '$lib/stores/view.svelte';
	import { originFlag, originLabel } from '$lib/utils/origins';
	import { l10n } from '$lib/utils/l10n';
	import { ArrowLeft, BookOpen, ExternalLink, GlassWater, History } from '@lucide/svelte';
	import { m } from '$lib/paraglide/messages';
	import { getLocale } from '$lib/paraglide/runtime';
	import { formatNumber } from '$lib/utils/format';
	import type { LocaleKey } from '$lib/utils/locales';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	seedRating(data.countryCode, data.rating);
	const locale = $derived(getLocale());

	const distillery = $derived(data.distillery);
	const name = $derived(l10n(distillery, 'name') ?? distillery.name);
	const history = $derived(l10n(distillery, 'description'));
	const heroImageUrl = $derived(distillery.image ?? '/images/whisky.webp');
	const backHref = $derived(localizeHref('/'));

	onMount(() => {
		refreshRating(data.products.map((p) => p.slug));
	});

	const ranked = $derived(
		[...data.products].sort((a, b) => {
			const diff = ratingStore.get(b.slug).avg_rating - ratingStore.get(a.slug).avg_rating;
			if (diff !== 0) return diff;
			const diffCount = ratingStore.get(b.slug).review_count - ratingStore.get(a.slug).review_count;
			if (diffCount !== 0) return diffCount;
			const an = l10n(a, 'name') ?? a.name;
			const bn = l10n(b, 'name') ?? b.name;
			return an.localeCompare(bn);
		})
	);
	const mode = $derived(browser ? view.current : data.view);
	const count = $derived(ranked.length);

	const alternates = $derived(
		buildAlternates(() => `/destileria/${distillery.slug ?? distillery.id}`, getUrlOrigin())
	);
</script>

<svelte:head>
	{#if data.schemaJson}
		{@html `<script type="application/ld+json">${JSON.stringify(data.schemaJson)}</script>`}
	{/if}
</svelte:head>

<SEO
	title="{name} — Rare Old"
	description={(history ?? name).replace(/<[^>]*>/g, '').slice(0, 160)}
	canonicalPath={localizeHref(`/destileria/${distillery.slug ?? distillery.id}`)}
	ogImage={heroImageUrl.startsWith('/') ? getUrlOrigin() + heroImageUrl : heroImageUrl}
	hreflangAlternates={alternates}
/>

<Hero imageUrl={heroImageUrl} title={name} subtitle={originLabel(distillery.country ?? '')} count={m.products_count({ count: formatNumber(count, locale) })}>
	{#snippet children()}
		<div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/80">
			<span class="inline-flex items-center gap-1.5">
				<span>{originFlag({ origin: distillery.country })}</span>
				<span>{originLabel(distillery.country ?? '')}</span>
			</span>
			{#if distillery.region}
				<span>{distillery.region}</span>
			{/if}
			{#if distillery.founded}
				<span>{m.destillery_founded({ year: distillery.founded })}</span>
			{/if}
			{#if distillery.website}
				<a
					href={distillery.website}
					target="_blank"
					rel="noopener noreferrer"
					class="inline-flex items-center gap-1 underline underline-offset-2 transition hover:text-white"
				>
					{m.destillery_website()}
					<ExternalLink size={12} />
				</a>
			{/if}
		</div>
	{/snippet}
</Hero>

<section class="mx-auto max-w-7xl px-4 pb-24 sm:px-6">
	<a
		href={backHref}
		class="mt-8 inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
	>
		<ArrowLeft size={15} />
		{m.origin_back()}
	</a>

	<div class="mt-6 flex flex-col gap-10 lg:flex-row lg:gap-12">
		<!-- TOC -->
		<nav class="hidden shrink-0 lg:block lg:w-60">
			<div class="sticky top-24 self-start flex flex-col gap-1 border-l border-zinc-200 pl-4 dark:border-zinc-800">
				<a href="#productos" class="flex items-center gap-2 py-1.5 text-sm text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white">
					<GlassWater size={14} />
					{m.destillery_products()}
				</a>
				{#if history}
					<a href="#historia" class="flex items-center gap-2 py-1.5 text-sm text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white">
						<History size={14} />
						{m.destillery_history()}
					</a>
				{/if}
			</div>
		</nav>

		<div class="min-w-0 flex-1">
			<section id="productos" class="scroll-mt-24">
				<div class="flex items-center justify-between gap-4">
					<h2 class="flex items-center gap-2 font-display text-xl font-semibold text-zinc-900 dark:text-white">
						<BookOpen size={18} class="text-accent" />
						{m.destillery_products()}
						<span class="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
							{count}
						</span>
					</h2>
					{#if count > 0}
						<ViewToggle />
					{/if}
				</div>

				{#if count === 0}
					<p class="mt-4 text-sm text-zinc-500 dark:text-zinc-400">{m.reviews_empty()}</p>
				{:else if mode === 'grid'}
					<div class="mt-5 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
						{#each ranked as product, i (product.slug)}
							<ProductCard {product} rank={i + 1} country={data.countryCode} />
						{/each}
					</div>
				{:else if mode === 'list'}
					<div class="mt-5 flex flex-col gap-3">
						{#each ranked as product, i (product.slug)}
							<ProductRow {product} rank={i + 1} country={data.countryCode} />
						{/each}
					</div>
				{:else}
					<div class="mt-5 divide-y divide-zinc-100 dark:divide-zinc-800">
						{#each ranked as product, i (product.slug)}
							<ProductCompact {product} rank={i + 1} country={data.countryCode} />
						{/each}
					</div>
				{/if}
			</section>

			{#if history}
				<section id="historia" class="mt-14 scroll-mt-24">
					<h2 class="font-display text-xl font-semibold text-zinc-900 dark:text-white">
						{m.destillery_history()}
					</h2>
					<div
						class="mt-3 max-w-3xl text-zinc-600 dark:text-zinc-300 [&_p]:mt-2 [&_h2]:mt-3 [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-semibold [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:mt-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-accent [&_a]:underline"
					>
						{@html history}
					</div>
				</section>
			{/if}
		</div>
	</div>
</section>
