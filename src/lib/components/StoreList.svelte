<script lang="ts">
	import { Store, ExternalLink } from '@lucide/svelte';
	import { m } from '$lib/paraglide/messages';
	import { formatPrice } from '$lib/utils/format';
	import { detectUserCountry, countryFlag } from '$lib/utils/geo-client';
	import type { Reseller } from '$lib/types';

	let { resellers, currency, locale }: { resellers: Reseller[]; currency: string; locale: string } =
		$props();

	let country = $state<string | null>(null);
	const flag = $derived(countryFlag(country));

	$effect(() => {
		detectUserCountry().then((c) => (country = c));
	});
</script>

<section class="mt-8">
	<h2 class="flex items-center gap-2 font-display text-xl font-semibold text-zinc-900 dark:text-white">
		<Store size={20} class="text-accent" />
		{m.stores_title()}
		{#if flag}<span aria-hidden="true">{flag}</span>{/if}
	</h2>
	<p class="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{m.stores_note()}</p>
	<div class="mt-4 flex flex-col gap-3">
		{#each resellers as reseller (reseller.url)}
			<a
				href={reseller.url}
				target="_blank"
				rel="noopener noreferrer sponsored"
				class="group flex items-center justify-between gap-3 rounded-2xl border border-zinc-200 px-4 py-3.5 transition hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:hover:border-zinc-700"
			>
				<span class="font-medium text-zinc-900 dark:text-white">{reseller.name}</span>
				<span class="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
					{#if reseller.price != null}
						<span class="font-semibold text-zinc-900 dark:text-white">
							{formatPrice(reseller.price, currency, locale)}
						</span>
					{/if}
					<span class="flex items-center gap-1 text-zinc-400 transition group-hover:text-accent">
						{m.view()}
						<ExternalLink size={14} />
					</span>
				</span>
			</a>
		{/each}
	</div>
</section>
