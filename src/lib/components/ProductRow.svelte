<script lang="ts">
	import { ArrowRight, Store, Star } from '@lucide/svelte';
	import { getLocale, localizeHref } from '$lib/paraglide/runtime';
	import { formatNumber } from '$lib/utils/format';
	import { originFlag } from '$lib/utils/origins';
	import { l10n } from '$lib/utils/l10n';
	import { resellersFor } from '$lib/utils/resellers';
	import { karmaStore } from '$lib/stores/karma.svelte';
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
	const voteCount = $derived(karmaStore.get(slug).votes);
</script>

<article
	class="group flex items-center gap-2.5 rounded-2xl border border-zinc-200 bg-white p-2.5 transition hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 sm:gap-4 sm:p-3"
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

	<div class="flex shrink-0 items-center gap-1.5">
		<span class="inline-flex items-center gap-1 text-xs text-zinc-400 tabular-nums">
			<Star size={12} />
			{formatNumber(voteCount, locale)}
		</span>
		<VoteButton {slug} {country} />
		<FavoriteButton {slug} />
		<a
			href={href}
			class="grid h-9 w-9 place-items-center rounded-full bg-zinc-900 text-white transition hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
			title={m.view()}
		>
			<ArrowRight size={15} />
		</a>
	</div>
</article>
