<script lang="ts">
	import { Star } from '@lucide/svelte';
	import { goto } from '$app/navigation';
	import { localizeHref } from '$lib/paraglide/runtime';
	import { l10n } from '$lib/utils/l10n';
	import type { Review, Whisky } from '$lib/types';

	let {
		review,
		product
	}: {
		review: Review;
		product: Whisky;
	} = $props();

	const productName = $derived(l10n(product, 'name') ?? product.name);
	const fullStars = $derived(Math.floor(review.score));
	const hasHalf = $derived(review.score - fullStars >= 0.3);

	function navigate() {
		goto(localizeHref(`/whisky/${product.slug}`));
	}
</script>

<button
	onclick={navigate}
	class="group flex h-full w-full flex-col gap-2 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-4 text-left transition hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 cursor-pointer"
>
	<div class="flex items-center gap-3">
		<div class="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-zinc-100 text-sm font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
			{#if review.user_avatar}
				<img src={review.user_avatar} alt="" class="h-full w-full object-cover" />
			{:else}
				{(review.user_name ?? '?').slice(0, 1).toUpperCase()}
			{/if}
		</div>
		<div class="min-w-0 flex-1">
			<p class="truncate text-sm font-semibold text-zinc-900 dark:text-white">
				{review.user_name ?? 'Anonymous'}
			</p>
			<div class="flex items-center gap-0.5">
				{#each [1, 2, 3, 4, 5] as n}
					<Star
						size={12}
						class={n <= fullStars ? 'text-amber-500' : 'text-zinc-300 dark:text-zinc-700'}
						fill="currentColor"
					/>
				{/each}
			</div>
		</div>
		{#if product.image}
			<img
				src={product.image}
				alt={productName}
				class="h-12 w-12 shrink-0 rounded-xl object-contain"
				loading="lazy"
			/>
		{/if}
	</div>

	{#if review.comment || review.image_url}
		{#if review.image_url}
			<img
				src={review.image_url}
				alt=""
				loading="lazy"
				class="max-h-40 w-full rounded-xl object-cover"
			/>
		{/if}
		{#if review.comment}
			<p class="text-sm text-zinc-600 dark:text-zinc-300 line-clamp-2">{review.comment}</p>
		{/if}
	{/if}

	<p class="text-xs font-medium text-zinc-400 dark:text-zinc-500 group-hover:text-accent transition-colors truncate">
		{productName}
	</p>
</button>
