<script lang="ts">
	import { Store, ExternalLink } from '@lucide/svelte';
	import { getLocale } from '$lib/paraglide/runtime';
	import { m } from '$lib/paraglide/messages';
	import { formatPrice } from '$lib/utils/format';
	import { countryFlag, detectUserCountry } from '$lib/utils/geo-client';
	import type { Store as StoreItem } from '$lib/types';

	let { productSlug }: { productSlug: string } = $props();

	let loading = $state(true);
	let error = $state(false);
	let country = $state<string | null>(null);
	let currency = $state('USD');
	let stores = $state<StoreItem[]>([]);

	let flagCountry = $state<string | null>(null);
	const flag = $derived(countryFlag(flagCountry));
	const locale = $derived(getLocale());

	$effect(() => {
		detectUserCountry().then((c) => (flagCountry = c));
	});

	$effect(() => {
		const slug = productSlug;
		let cancelled = false;
		loading = true;
		error = false;
		stores = [];

		fetch(`/api/stores?product=${encodeURIComponent(slug)}`)
			.then((res) => {
				if (!res.ok) throw new Error(String(res.status));
				return res.json() as Promise<{ country: string | null; currency: string; stores: StoreItem[] }>;
			})
			.then((data) => {
				if (cancelled) return;
				country = data.country;
				currency = data.currency;
				stores = data.stores;
			})
			.catch(() => {
				if (!cancelled) error = true;
			})
			.finally(() => {
				if (!cancelled) loading = false;
			});

		return () => {
			cancelled = true;
		};
	});
</script>

<section class="mt-8">
	<h2 class="flex items-center gap-2 font-display text-xl font-semibold text-zinc-900 dark:text-white">
		<Store size={20} class="text-accent" />
		{m.stores_title()}
		{#if flag}<span aria-hidden="true">{flag}</span>{/if}
	</h2>
	<p class="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{m.stores_note()}</p>

	{#if loading}
		<div class="mt-4 flex flex-col gap-3" aria-hidden="true">
			{#each [0, 1, 2] as i (i)}
				<div
					class="flex animate-pulse items-center justify-between gap-3 rounded-2xl border border-zinc-200 px-4 py-3.5 dark:border-zinc-800"
				>
					<span class="h-4 w-32 rounded bg-zinc-200 dark:bg-zinc-700"></span>
					<span class="flex items-center gap-3">
						<span class="h-3 w-12 rounded bg-zinc-200 dark:bg-zinc-700"></span>
						<span class="h-3 w-8 rounded bg-zinc-200 dark:bg-zinc-700"></span>
					</span>
				</div>
			{/each}
		</div>
	{:else if error}
		<p class="mt-4 text-sm text-zinc-500 dark:text-zinc-400">—</p>
	{:else if stores.length === 0}
		<p class="mt-4 text-sm text-zinc-500 dark:text-zinc-400">{m.stores_empty()}</p>
	{:else}
		<div class="mt-4 flex flex-col gap-3">
			{#each stores as store (store.id)}
				<a
					href={store.url}
					target="_blank"
					rel="noopener noreferrer sponsored"
					class="group flex items-center justify-between gap-3 rounded-2xl border border-zinc-200 px-4 py-3.5 transition hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:hover:border-zinc-700"
				>
					<span class="flex min-w-0 items-center gap-3">
						{#if store.logo_url}
							<img
								src={store.logo_url}
								alt=""
								loading="lazy"
								class="h-8 w-8 shrink-0 rounded-md object-contain"
							/>
						{/if}
						<span class="truncate font-medium text-zinc-900 dark:text-white">{store.name}</span>
					</span>
					<span class="flex shrink-0 items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
						{#if store.price != null}
							<span class="font-semibold text-zinc-900 dark:text-white">
								{formatPrice(store.price, currency, locale)}
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
	{/if}
</section>