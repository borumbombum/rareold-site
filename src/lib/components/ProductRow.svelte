<script lang="ts">
	import { ArrowRight, Store, Star } from '@lucide/svelte';
	import { getLocale, localizeHref } from '$lib/paraglide/runtime';
	import { formatNumber } from '$lib/utils/format';
	import { originFlag } from '$lib/utils/origins';
	import { l10n } from '$lib/utils/l10n';
	import { resellersFor } from '$lib/utils/resellers';
	import { ratingStore } from '$lib/stores/rating.svelte';
	import VoteButton from './VoteButton.svelte';
	import FavoriteButton from './FavoriteButton.svelte';
	import PlayButton from './PlayButton.svelte';
	import { m } from '$lib/paraglide/messages';
	import type { CountryCode, Whisky } from '$lib/types';

	let {
		product,
		rank,
		country = 'UY'
	}: {
		product: Whisky;
		rank: number;
		country?: CountryCode;
	} = $props();

	const locale = $derived(getLocale());
	const slug = product.slug;
	const href = $derived(localizeHref(`/whisky/${slug}`));
	const flag = $derived(originFlag(product));
	const name = $derived(l10n(product, 'name') ?? product.name);
	const storesCount = $derived(resellersFor(product, country).length);
	const ratingEntry = $derived(ratingStore.get(slug));
	const avgRating = $derived(ratingEntry.avg_rating);
	const reviewCount = $derived(ratingEntry.review_count);
</script>

<article
	class="group relative flex flex-wrap items-center gap-2.5 rounded-2xl border border-zinc-200 bg-white p-2.5 transition hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 sm:gap-4 sm:p-3"
>
	<span class="w-6 shrink-0 text-center font-display text-base font-semibold text-zinc-400 sm:w-8 sm:text-lg">
		{rank}
	</span>

	<a href={href} class="relative grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-xl bg-zinc-50 dark:bg-white sm:h-20 sm:w-20">
		{#if product.image}
			<img
				src={product.image}
				alt={name}
				loading="lazy"
				class="h-full w-full object-contain transition group-hover:scale-105"
			/>
		{:else}
			<span class="text-3xl opacity-60">🥃</span>
		{/if}
		{#if product.video}
			<PlayButton url={product.video} size="sm" className="absolute bottom-1 right-1" />
		{/if}
	</a>

	{#if avgRating > 0}
		<span class="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-xs font-semibold text-zinc-900 backdrop-blur dark:bg-zinc-900/90 dark:text-white sm:hidden">
			<Star size={12} class="text-amber-500" fill="currentColor" />
			{avgRating.toFixed(1)}
		</span>
	{/if}

	<div class="min-w-0 flex-1">
		<a
			href={href}
			class="font-display min-w-0 block text-sm font-semibold text-zinc-900 hover:underline dark:text-white"
		>
			{flag} {name}
		</a>
		<p class="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{product.brand}</p>
		<p class="mt-1.5 flex items-center gap-1.5 text-xs text-zinc-400">
			<Store size={12} />
			{m.stores_count({ count: formatNumber(storesCount, locale) })}
		</p>
	</div>

	<div class="flex w-full shrink-0 items-center justify-end gap-1.5 sm:w-auto">
		<span class="hidden sm:inline-flex items-center gap-1 text-xs text-zinc-400 tabular-nums">
			<Star size={12} class="text-amber-500" fill="currentColor" />
			{avgRating > 0 ? avgRating.toFixed(1) : '—'}
		</span>
		<VoteButton {slug} {country} productName={name} productImage={product.image} size="sm" />
		<FavoriteButton {slug} size="sm" showLabel={false} />
		<a
			href={href}
			class="grid h-9 w-9 place-items-center rounded-full bg-zinc-900 text-white transition hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
			title={m.view()}
		>
			<ArrowRight size={15} />
		</a>
	</div>
</article>
