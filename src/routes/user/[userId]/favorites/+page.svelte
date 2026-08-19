<script lang="ts">
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import { ArrowLeft, Heart, LogOut, ShieldCheck } from '@lucide/svelte';
	import ViewToggle from '$lib/components/ViewToggle.svelte';
	import ProductCard from '$lib/components/ProductCard.svelte';
	import ProductRow from '$lib/components/ProductRow.svelte';
	import ProductCompact from '$lib/components/ProductCompact.svelte';
	import { karmaStore, refreshKarma, seedKarma } from '$lib/stores/karma.svelte';
	import { view } from '$lib/stores/view.svelte';
	import { favorites } from '$lib/stores/favorites.svelte';
	import { session } from '$lib/stores/session.svelte';
	import { getLocale, localizeHref } from '$lib/paraglide/runtime';
	import { l10n } from '$lib/utils/l10n';
	import { m } from '$lib/paraglide/messages';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	seedKarma(data.countryCode, data.karma);

	onMount(() => {
		refreshKarma(data.products.map((p) => p.slug));
	});

	const homeHref = $derived(localizeHref('/', { locale: getLocale() }));
	const country = data.countryCode as 'UY' | 'BR';
	const mode = $derived(browser ? view.current : data.view);

	const saved = $derived(data.products.filter((p) => favorites.has(p.slug)));
	const ranked = $derived(
		[...saved].sort((a, b) => {
			const diff = karmaStore.get(b.slug).karma - karmaStore.get(a.slug).karma;
			if (diff !== 0) return diff;
			const an = l10n(a, 'name') ?? a.name;
			const bn = l10n(b, 'name') ?? b.name;
			return an.localeCompare(bn);
		})
	);

	async function logout() {
		await session.clear();
		goto(homeHref);
	}
</script>

<svelte:head>
	<title>{m.favorites_title()}</title>
</svelte:head>

<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6">
	<a
		href={homeHref}
		class="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
	>
		<ArrowLeft size={15} />
		{m.detail_back()}
	</a>

	<div class="mt-6 flex items-center gap-4">
		<span class="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full border border-zinc-200 bg-zinc-100 text-xl font-semibold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
			{#if data.user.avatar}
				<img src={data.user.avatar} alt={data.user.name} class="h-full w-full object-cover" />
			{:else}
				{data.user.name.slice(0, 1).toUpperCase()}
			{/if}
		</span>
		<div class="flex-1">
			<h1 class="font-display text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">
				{m.favorites_title()}
			</h1>
			<p class="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{data.user.name}</p>
		</div>
		{#if data.user.role === 'admin'}
			<a
				href={localizeHref('/admin', { locale: getLocale() })}
				class="inline-flex shrink-0 items-center gap-2 rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 transition hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-white"
			>
				<ShieldCheck size={15} />
				Admin
			</a>
		{/if}
		<button
			onclick={logout}
			class="inline-flex shrink-0 items-center gap-2 rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 transition hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-white"
		>
			<LogOut size={15} />
			{m.logout()}
		</button>
	</div>

	{#if ranked.length === 0}
		<div class="mt-10 flex flex-col items-center gap-3 rounded-3xl border border-dashed border-zinc-300 px-6 py-16 text-center dark:border-zinc-700">
			<span class="grid h-14 w-14 place-items-center rounded-full bg-zinc-100 text-zinc-400 dark:bg-zinc-800">
				<Heart size={24} />
			</span>
			<p class="max-w-md text-sm text-zinc-500 dark:text-zinc-400">{m.favorites_empty()}</p>
			<a
				href={homeHref}
				class="mt-2 rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
			>
				{m.nav_home()}
			</a>
		</div>
	{:else}
		<div class="mt-8 flex items-center justify-between gap-4">
			<p class="font-display text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
				{ranked.length}
			</p>
			<ViewToggle />
		</div>

		<div class="mt-4">
		{#if mode === 'grid'}
			<div class="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
				{#each ranked as product, i (product.slug)}
					<ProductCard product={product} rank={i + 1} country={country} />
				{/each}
			</div>
		{:else if mode === 'list'}
			<div class="flex flex-col gap-3">
				{#each ranked as product, i (product.slug)}
					<ProductRow product={product} rank={i + 1} country={country} />
				{/each}
			</div>
		{:else}
			<div class="divide-y divide-zinc-100 dark:divide-zinc-800">
				{#each ranked as product, i (product.slug)}
					<ProductCompact product={product} rank={i + 1} country={country} />
				{/each}
			</div>
		{/if}
		</div>
	{/if}
</div>
