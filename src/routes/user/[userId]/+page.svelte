<script lang="ts">
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import {
		ArrowLeft,
		Heart,
		LogOut,
		MessageCircle,
		ShieldCheck,
		Star,
		ThumbsUp
	} from '@lucide/svelte';
	import ViewToggle from '$lib/components/ViewToggle.svelte';
	import ProductCard from '$lib/components/ProductCard.svelte';
	import ProductRow from '$lib/components/ProductRow.svelte';
	import ProductCompact from '$lib/components/ProductCompact.svelte';
	import UserReviewCard from '$lib/components/UserReviewCard.svelte';
	import { ratingStore, refreshRating, seedRating } from '$lib/stores/rating.svelte';
	import { view } from '$lib/stores/view.svelte';
	import { favorites } from '$lib/stores/favorites.svelte';
	import { session } from '$lib/stores/session.svelte';
	import { getLocale, localizeHref } from '$lib/paraglide/runtime';
	import { l10n } from '$lib/utils/l10n';
	import { m } from '$lib/paraglide/messages';
	import SEO from '$lib/components/SEO.svelte';
	import type { Whisky } from '$lib/types';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	seedRating(data.countryCode, data.rating);

	onMount(() => {
		refreshRating(data.products.map((p) => p.slug));
	});

	const homeHref = $derived(localizeHref('/', { locale: getLocale() }));
	const country = data.countryCode as 'UY' | 'BR' | 'US';
	const mode = $derived(browser ? view.current : data.view);

	function byRanking(a: Whisky, b: Whisky) {
		const diff = ratingStore.get(b.slug).avg_rating - ratingStore.get(a.slug).avg_rating;
		if (diff !== 0) return diff;
		const diffCount = ratingStore.get(b.slug).review_count - ratingStore.get(a.slug).review_count;
		if (diffCount !== 0) return diffCount;
		const an = l10n(a, 'name') ?? a.name;
		const bn = l10n(b, 'name') ?? b.name;
		return an.localeCompare(bn);
	}

	const favoriteProducts = $derived(
		data.products
			.filter((p) => data.favoriteSlugs.includes(p.slug) && favorites.has(p.slug))
			.sort(byRanking)
	);
	const votedProducts = $derived(
		data.products.filter((p) => data.votedSlugs.includes(p.slug)).sort(byRanking)
	);

	function productNameFor(slug: string): string {
		const p = data.products.find((w) => w.slug === slug);
		return p ? (l10n(p, 'name') ?? p.name) : slug;
	}

	async function logout() {
		await session.clear();
		goto(homeHref);
	}
</script>

<SEO title={m.favorites_title()} description={data.user.name} noindex={true} />

<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6">
	<a
		href={homeHref}
		class="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
	>
		<ArrowLeft size={15} />
		{m.detail_back()}
	</a>

	<div class="mt-6 flex items-center gap-4">
		<span class="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full border border-zinc-200 bg-zinc-100 text-xl font-semibold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
			{#if data.user.avatar}
				<img src={data.user.avatar} alt={data.user.name} class="h-full w-full object-cover" />
			{:else}
				{data.user.name.slice(0, 1).toUpperCase()}
			{/if}
		</span>
		<div class="flex-1">
			<h1 class="font-display text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">
				{data.user.name}
			</h1>
			<p class="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{m.favorites_title()}</p>
		</div>
		{#if data.user.role === 'admin'}
			<a
				href={localizeHref('/admin', { locale: getLocale() })}
				class="inline-flex shrink-0 items-center gap-2 rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 transition hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-white"
			>
				<ShieldCheck size={15} />
				Admin
			</a>
		{/if}
		<button
			onclick={logout}
			class="inline-flex shrink-0 items-center gap-2 rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 transition hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-white"
		>
			<LogOut size={15} />
			{m.logout()}
		</button>
	</div>

	<!-- Favoritos -->
	<section class="mt-10">
		<div class="flex flex-wrap items-center justify-between gap-3">
			<h2 class="flex items-center gap-2 font-display text-lg font-semibold text-zinc-900 dark:text-white">
				<Heart size={18} class="text-accent" />
				{m.favorites_title()}
				<span class="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
					{favoriteProducts.length}
				</span>
			</h2>
			{#if favoriteProducts.length > 0}
				<ViewToggle />
			{/if}
		</div>

		{#if favoriteProducts.length === 0}
			<p class="mt-3 text-sm text-zinc-500 dark:text-zinc-400">{m.favorites_empty()}</p>
		{:else}
			<div class="mt-4">
				{#if mode === 'grid'}
					<div class="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
						{#each favoriteProducts as product, i (product.slug)}
							<ProductCard product={product} rank={i + 1} {country} />
						{/each}
					</div>
				{:else if mode === 'list'}
					<div class="flex flex-col gap-3">
						{#each favoriteProducts as product, i (product.slug)}
							<ProductRow product={product} rank={i + 1} {country} />
						{/each}
					</div>
				{:else}
					<div class="divide-y divide-zinc-100 dark:divide-zinc-800">
						{#each favoriteProducts as product, i (product.slug)}
							<ProductCompact product={product} rank={i + 1} {country} />
						{/each}
					</div>
				{/if}
			</div>
		{/if}
	</section>

	<!-- Votados -->
	<section class="mt-12">
		<div class="flex flex-wrap items-center justify-between gap-3">
			<h2 class="flex items-center gap-2 font-display text-lg font-semibold text-zinc-900 dark:text-white">
				<ThumbsUp size={18} class="text-accent" />
				{m.voted_title()}
				<span class="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
					{votedProducts.length}
				</span>
			</h2>
			{#if votedProducts.length > 0}
				<ViewToggle />
			{/if}
		</div>

		{#if votedProducts.length === 0}
			<p class="mt-3 text-sm text-zinc-500 dark:text-zinc-400">{m.voted_empty()}</p>
		{:else}
			<div class="mt-4">
				{#if mode === 'grid'}
					<div class="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
						{#each votedProducts as product, i (product.slug)}
							<ProductCard product={product} rank={i + 1} {country} />
						{/each}
					</div>
				{:else if mode === 'list'}
					<div class="flex flex-col gap-3">
						{#each votedProducts as product, i (product.slug)}
							<ProductRow product={product} rank={i + 1} {country} />
						{/each}
					</div>
				{:else}
					<div class="divide-y divide-zinc-100 dark:divide-zinc-800">
						{#each votedProducts as product, i (product.slug)}
							<ProductCompact product={product} rank={i + 1} {country} />
						{/each}
					</div>
				{/if}
			</div>
		{/if}
	</section>

	<!-- Comentarios -->
	<section class="mt-12 pb-8">
		<h2 class="flex items-center gap-2 font-display text-lg font-semibold text-zinc-900 dark:text-white">
			<MessageCircle size={18} class="text-accent" />
			{m.reviews_mine_title()}
			<span class="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
				{data.reviews.length}
			</span>
		</h2>

		{#if data.reviews.length === 0}
			<p class="mt-3 text-sm text-zinc-500 dark:text-zinc-400">{m.reviews_mine_empty()}</p>
		{:else}
			<div class="mt-4 flex max-w-2xl flex-col gap-4">
				{#each data.reviews as review (review.id)}
					<UserReviewCard
						{review}
						productName={productNameFor(review.product_id)}
					/>
				{/each}
			</div>
		{/if}
	</section>
</div>
