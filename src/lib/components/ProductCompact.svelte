<script lang="ts">
	import { ArrowRight, Star } from '@lucide/svelte';
	import { getLocale, localizeHref } from '$lib/paraglide/runtime';
	import { formatNumber } from '$lib/utils/format';
	import { originFlag, originKey, originLabel } from '$lib/utils/origins';
	import { l10n } from '$lib/utils/l10n';
	import { resellersFor } from '$lib/utils/resellers';
	import { karmaStore } from '$lib/stores/karma.svelte';
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

<div class="flex items-center gap-3 border-b border-zinc-100 py-2 text-xs dark:border-zinc-800 sm:gap-4 sm:py-2.5">
	<span class="w-6 shrink-0 text-center font-semibold text-zinc-400 tabular-nums">#{rank}</span>
	<span class="text-base leading-none">{flag}</span>
	<a {href} class="min-w-0 flex-1 truncate font-medium text-zinc-900 hover:underline dark:text-white">
		{name}
	</a>
	<span class="hidden shrink-0 text-zinc-500 sm:inline dark:text-zinc-400">{product.brand ?? ''}</span>
	<span class="hidden shrink-0 text-zinc-400 md:inline">{product.region ?? ''}</span>
	<span class="hidden shrink-0 text-zinc-400 md:inline">{product.abv != null ? `${product.abv}%` : ''}</span>
	<span class="hidden shrink-0 text-zinc-400 md:inline">{product.age != null ? `${product.age}y` : ''}</span>
	<span class="shrink-0 text-zinc-400">{storesCount}</span>
	<span class="inline-flex shrink-0 items-center gap-1 text-zinc-400 tabular-nums">
		<Star size={12} />
		{formatNumber(voteCount, locale)}
	</span>
	<a {href} class="shrink-0 text-zinc-400 transition hover:text-zinc-900 dark:hover:text-white">
		<ArrowRight size={14} />
	</a>
</div>
