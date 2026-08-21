<script lang="ts">
	import { MapPin, Star } from '@lucide/svelte';
	import { goto } from '$app/navigation';
	import { getLocale, localizeHref } from '$lib/paraglide/runtime';
	import { formatDate } from '$lib/utils/format';
	import { formatCoords } from '$lib/utils/image';
	import type { Review } from '$lib/types';

	let { review, productName }: { review: Review; productName: string } = $props();

	const locale = $derived(getLocale());

	const fullStars = $derived(Math.floor(review.score));
	const hasHalf = $derived(review.score - fullStars >= 0.3);
</script>

<article class="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
	<div class="flex items-center gap-x-2 gap-y-1">
		<div class="flex items-center gap-0.5">
			{#each [1, 2, 3, 4, 5] as n}
				<Star
					size={13}
					class={n <= fullStars
						? 'text-amber-500'
						: n === fullStars + 1 && hasHalf
							? 'text-amber-500'
							: 'text-zinc-300 dark:text-zinc-700'}
					fill="currentColor"
				/>
			{/each}
		</div>
		<span class="text-xs text-zinc-400">{formatDate(review.created_at, locale)}</span>
	</div>
	{#if review.comment}
		<p class="mt-2 text-sm text-zinc-700 dark:text-zinc-300">{review.comment}</p>
	{/if}
	{#if review.image_url}
		<img src={review.image_url} alt="" loading="lazy" class="mt-2 max-h-56 w-auto rounded-xl object-cover" />
	{/if}
	<div class="mt-3 flex flex-wrap items-center justify-between gap-2">
		<button
			onclick={() => goto(localizeHref(`/whisky/${review.product_id}`))}
			class="text-sm font-medium text-zinc-900 transition hover:text-accent dark:text-white"
		>
			{productName}
		</button>
		{#if review.lat != null && review.lng != null}
			<a
				href="https://maps.google.com/?q={review.lat},{review.lng}"
				target="_blank"
				rel="noopener noreferrer"
				class="inline-flex items-center gap-1 text-xs text-zinc-500 transition hover:text-accent dark:text-zinc-400"
			>
				<MapPin size={12} />
				{formatCoords(review.lat, review.lng)}
			</a>
		{/if}
	</div>
</article>
