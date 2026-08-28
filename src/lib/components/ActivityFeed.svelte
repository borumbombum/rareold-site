<script lang="ts">
	import { browser } from '$app/environment';
	import { MessageSquare } from '@lucide/svelte';
	import { m } from '$lib/paraglide/messages';
	import ActivityCard from './ActivityCard.svelte';
	import type { ActivityItem } from '$lib/server/data';

	let { items }: { items: ActivityItem[] } = $props();

	let scrollEl = $state<HTMLDivElement | null>(null);
	let activeIndex = $state(0);

	let cardsPerView = $derived.by(() => {
		if (!scrollEl) return 1;
		const step = getCardStep();
		if (!step) return 1;
		return Math.max(1, Math.round(scrollEl.clientWidth / step));
	});

	let totalPages = $derived(Math.max(1, items.length - cardsPerView + 1));
	let pageIndex = $derived(Math.min(activeIndex, totalPages - 1));

	function getCardStep(): number {
		if (!scrollEl) return 0;
		const children = scrollEl.children;
		if (children.length >= 2) {
			return (children[1] as HTMLElement).offsetLeft - (children[0] as HTMLElement).offsetLeft;
		}
		const first = children[0] as HTMLElement | undefined;
		return first ? first.offsetWidth + 8 : 0;
	}

	function handleScroll() {
		if (!scrollEl) return;
		const step = getCardStep();
		if (!step) return;
		activeIndex = Math.min(Math.round(scrollEl.scrollLeft / step), items.length - 1);
	}

	function scrollToPage(page: number) {
		if (!scrollEl) return;
		const step = getCardStep();
		if (!step) return;
		const target = Math.min(page * step, scrollEl.scrollWidth - scrollEl.clientWidth);
		scrollEl.scrollTo({ left: target, behavior: 'smooth' });
	}
</script>

<section class="mx-auto max-w-7xl px-4 py-6 sm:px-6">
	<h2 class="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-zinc-900 dark:text-white">
		<MessageSquare size={18} class="text-accent" />
		{m.activity_title()}
	</h2>

	<div
		bind:this={scrollEl}
		role="presentation"
		aria-label="User reviews carousel"
		class="no-scrollbar flex gap-2 overflow-x-auto snap-x snap-mandatory lg:flex-wrap lg:overflow-visible lg:snap-none"
		onscroll={handleScroll}
	>
		{#each items as item (item.review.id)}
			<div class="snap-start h-44 w-[80vw] shrink-0 overflow-hidden lg:w-[calc((100%-24px)/4)] lg:shrink-0">
				<ActivityCard review={item.review} product={item.product} />
			</div>
		{/each}
	</div>

	{#if browser && totalPages > 1}
		<div
			class="mt-3 flex justify-center gap-1.5 lg:hidden"
			aria-hidden="true"
		>
			{#each Array(totalPages) as _, i}
				<button
					aria-label="Go to slide {i + 1}"
					tabindex="0"
					onclick={() => scrollToPage(i)}
					class="h-1.5 cursor-pointer rounded-full transition-all duration-300 {i === pageIndex
						? 'w-4 bg-accent'
						: 'w-1.5 bg-zinc-300 dark:bg-zinc-600'}"
				></button>
			{/each}
		</div>
	{/if}
</section>
