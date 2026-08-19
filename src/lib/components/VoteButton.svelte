<script lang="ts">
	import { Star } from '@lucide/svelte';
	import { ui } from '$lib/stores/ui.svelte';
	import { session } from '$lib/stores/session.svelte';
	import { reviewedStore } from '$lib/stores/reviewed.svelte';
	import { m } from '$lib/paraglide/messages';

	let {
		slug,
		country,
		productName = '',
		productImage = null,
		alwaysShowLabel = false,
		size = 'md'
	}: {
		slug: string;
		country: string;
		productName?: string;
		productImage?: string | null;
		alwaysShowLabel?: boolean;
		size?: 'sm' | 'md';
	} = $props();

	const isReviewed = $derived(reviewedStore.isReviewed(slug));

	const sizeClasses = $derived(
		size === 'sm'
			? 'gap-1 px-2 py-1 text-xs'
			: 'gap-1.5 px-3 py-1.5 text-sm'
	);

	const iconSize = $derived(size === 'sm' ? 14 : 18);

	function openReviewModal() {
		if (!session.isAuthed) {
			ui.openLogin();
			return;
		}
		ui.openReview({
			slug,
			productName,
			productImage,
			country
		});
	}
</script>

<button
	onclick={openReviewModal}
	title={isReviewed ? m.vote_change() : m.vote()}
	class="inline-flex shrink-0 items-center rounded-full border font-medium transition {sizeClasses} {isReviewed
		? 'border-amber-400 bg-amber-400 text-zinc-900'
		: 'border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-white'}"
>
	<Star size={iconSize} fill={isReviewed ? 'currentColor' : 'none'} />
	<span>{isReviewed ? m.vote_change() : m.vote()}</span>
</button>
