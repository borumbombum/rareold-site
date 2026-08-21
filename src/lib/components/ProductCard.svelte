<script lang="ts">
	import { ArrowRight, Store, Star } from '@lucide/svelte';
	import { getLocale, localizeHref } from '$lib/paraglide/runtime';
	import { formatNumber } from '$lib/utils/format';
	import { originFlag, originKey, originLabel } from '$lib/utils/origins';
	import { l10n } from '$lib/utils/l10n';
	import { resellersFor } from '$lib/utils/resellers';
	import { ratingStore } from '$lib/stores/rating.svelte';
	import VoteButton from './VoteButton.svelte';
	import FavoriteButton from './FavoriteButton.svelte';
	import PlayVideosButton from './PlayVideosButton.svelte';
	import { videosForLocale } from '$lib/utils/videos';
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

	const slug = product.slug;
	const href = $derived(localizeHref(`/whisky/${slug}`));
	const locale = $derived(getLocale());
	const flag = $derived(originFlag(product));
	const originKeyLabel = $derived(originKey(product));
	const name = $derived(l10n(product, 'name') ?? product.name);
	const storesCount = $derived(resellersFor(product, country).length);
	const ratingEntry = $derived(ratingStore.get(slug));
	const avgRating = $derived(ratingEntry.avg_rating);
	const reviewCount = $derived(ratingEntry.review_count);
	const videos = $derived(videosForLocale(product.videos, locale));
</script>

<article
	class="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
>
	<a href={href} class="relative block aspect-[4/5] overflow-hidden bg-zinc-50 dark:bg-white">
		{#if product.image}
			<img
				src={product.image}
				alt={name}
				loading="lazy"
				class="h-full w-full object-contain transition duration-300 group-hover:scale-[1.03]"
			/>
		{:else}
			<div class="grid h-full w-full place-items-center text-5xl opacity-60">🥃</div>
		{/if}

		<span
			class="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-zinc-900 backdrop-blur dark:bg-zinc-900/90 dark:text-white"
		>
			#{rank}
		</span>

		{#if avgRating > 0}
			<span class="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-zinc-900 backdrop-blur dark:bg-zinc-900/90 dark:text-white">
				<Star size={12} class="text-amber-500" fill="currentColor" />
				{avgRating.toFixed(1)}
			</span>
		{/if}

		<PlayVideosButton {videos} className="absolute right-3 top-14" />
	</a>

	<div class="flex flex-1 flex-col gap-2 p-4">
		<p class="text-[11px] font-medium uppercase tracking-wide text-zinc-400">
			{flag} {originLabel(originKeyLabel)}
		</p>

		<a href={href} class="font-display min-w-0 block text-base font-semibold leading-snug text-zinc-900 hover:underline dark:text-white">
			{name}
		</a>

		<div class="flex items-center gap-1.5">
			<VoteButton {slug} {country} productName={name} productImage={product.image} size="sm" />
			<FavoriteButton {slug} size="sm" showLabel={false} />
		</div>

		{#if product.distillery}
			<p class="text-xs text-zinc-500 dark:text-zinc-400">{l10n(product.distillery, 'name')}</p>
		{/if}

		<div class="mt-auto flex items-center justify-between gap-2 pt-2">
			<p class="flex items-center gap-1.5 text-xs text-zinc-400">
				<Store size={14} />
				{m.stores_count({ count: formatNumber(storesCount, locale) })}
			</p>
			<a
				href={href}
				class="flex shrink-0 items-center gap-1.5 rounded-full bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
			>
				{m.view()}
				<ArrowRight size={13} />
			</a>
		</div>
	</div>
</article>
