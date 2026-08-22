<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import type { CountryCode, Whisky } from '$lib/types';
	import { Star } from '@lucide/svelte';
	import ProductCard from './ProductCard.svelte';

	let {
		products,
		country
	}: { products: Whisky[]; country?: CountryCode } = $props();
</script>

{#if products.length > 0}
	<section
		id="featured"
		class="mx-auto max-w-7xl px-4 pt-2 sm:px-6 md:pt-5"
		aria-label={m.featured_section_title()}
	>
		<h2 class="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-zinc-900 dark:text-white">
			<Star size={18} class="fill-amber-400 text-amber-400" />
			{m.featured_section_title()}
		</h2>
		<div class="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
			{#each products as product, i (product.slug)}
				<ProductCard {product} rank={i + 1} {country} />
			{/each}
		</div>
	</section>
{/if}
