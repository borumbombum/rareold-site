<script lang="ts">
	import { goto } from '$app/navigation';
	import { getLocale, localizeHref } from '$lib/paraglide/runtime';
	import { m } from '$lib/paraglide/messages';
	import { WHISKIES } from '$lib/data/whiskies';
	import { ORIGINS, originLabel, originSlug } from '$lib/utils/origins';
	import { l10n } from '$lib/utils/l10n';
	import { setRegion } from '$lib/stores/filters.svelte';
	import { Search } from '@lucide/svelte';
	import type { Whisky } from '$lib/types';

	let {
		large = false
	}: {
		large?: boolean;
	} = $props();

	type OriginResult = { type: 'origin'; key: string; flag: string; label: string };
	type RegionResult = { type: 'region'; originKey: string; originFlag: string; region: string; originLabel: string };
	type ProductResult = { type: 'product'; whisky: Whisky };
	type SearchResult = OriginResult | RegionResult | ProductResult;

	const flagMap = new Map(ORIGINS.map((o) => [o.key, o.flag]));

	const uniqueRegions = $derived.by(() => {
		const seen = new Map<string, { originKey: string; region: string }>();
		for (const w of WHISKIES) {
			if (!w.region) continue;
			const key = `${w.origin}→${w.region}`;
			if (!seen.has(key)) {
				seen.set(key, { originKey: w.origin, region: w.region });
			}
		}
		return [...seen.values()];
	});

	function normalize(s: string): string {
		return s
			.toLowerCase()
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '');
	}

	let query = $state('');
	let focused = $state(false);
	let activeIndex = $state(0);
	let itemEls: (HTMLElement | undefined)[] = [];
	let inputEl: HTMLInputElement | undefined = $state(undefined);

	const locale = $derived(getLocale());

	const isMac = $derived(
		typeof navigator !== 'undefined' &&
			/navigator\.platform|MacIntel|iPhone|iPad|iPod/i.test(navigator.platform ?? navigator.userAgent ?? '')
	);

	const results = $derived.by(() => {
		const q = normalize(query.trim());
		if (!q) return [];
		const out: SearchResult[] = [];

		for (const o of ORIGINS) {
			const label = originLabel(o.key);
			const haystack = `${o.key} ${label}`;
			if (normalize(haystack).includes(q)) {
				out.push({ type: 'origin', key: o.key, flag: o.flag, label });
				if (out.length >= 3) break;
			}
		}

		const originCount = out.length;
		for (const r of uniqueRegions) {
			const oLabel = originLabel(r.originKey);
			const haystack = `${r.region} ${oLabel}`;
			if (normalize(haystack).includes(q)) {
				out.push({ type: 'region', originKey: r.originKey, originFlag: flagMap.get(r.originKey) ?? '🌍', region: r.region, originLabel: oLabel });
				if (out.length >= originCount + 2) break;
			}
		}

		for (const w of WHISKIES) {
			const region = w.region ?? '';
			const originLabelText = originLabel(w.origin);
			const localizedName = l10n(w, 'name') ?? w.name;
			const haystack = `${w.name} ${localizedName} ${w.brand} ${w.origin} ${originLabelText} ${region}`;
			if (normalize(haystack).includes(q)) {
				out.push({ type: 'product', whisky: w });
				if (out.length >= 8) break;
			}
		}

		return out;
	});

	$effect(() => {
		query;
		activeIndex = 0;
	});

	$effect(() => {
		itemEls[activeIndex]?.scrollIntoView({ block: 'nearest' });
	});

	$effect(() => {
		function onGlobalKeydown(e: KeyboardEvent) {
			if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
				e.preventDefault();
				inputEl?.focus();
			}
		}
		window.addEventListener('keydown', onGlobalKeydown);
		return () => window.removeEventListener('keydown', onGlobalKeydown);
	});

	function go(result: SearchResult) {
		query = '';
		focused = false;
		if (result.type === 'origin') {
			goto(localizeHref(`/origen/${originSlug(result.key, locale)}`, { locale }));
		} else if (result.type === 'region') {
			setRegion(result.region);
			goto(localizeHref(`/origen/${originSlug(result.originKey, locale)}`, { locale }));
		} else {
			goto(localizeHref(`/whisky/${result.whisky.slug}`, { locale }));
		}
	}

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			if (results.length) activeIndex = (activeIndex + 1) % results.length;
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			if (results.length) activeIndex = (activeIndex - 1 + results.length) % results.length;
		} else if (e.key === 'Enter') {
			const hit = results[activeIndex];
			if (hit) {
				e.preventDefault();
				go(hit);
			}
		} else if (e.key === 'Escape') {
			query = '';
			focused = false;
		}
	}
</script>

<div
	class="relative w-full"
	onfocusout={(e) => {
		if (!e.currentTarget.contains(e.relatedTarget as Node | null)) focused = false;
	}}
>
	<div class="relative">
		<Search
			size={large ? 18 : 16}
			class="pointer-events-none absolute {large ? 'left-4' : 'left-3.5'} top-1/2 -translate-y-1/2 text-zinc-400"
		/>
		<input
			bind:this={inputEl}
			type="search"
			bind:value={query}
			onfocus={() => (focused = true)}
			onkeydown={onKeydown}
			placeholder={m.search_placeholder({ count: WHISKIES.length })}
			aria-label={m.search_label()}
			role="combobox"
			aria-expanded={focused && results.length > 0}
			aria-controls="search-results"
			autocomplete="off"
			class="{large ? 'h-12 pl-11 pr-16 text-base' : 'h-9 pl-9 pr-14 text-sm'} w-full appearance-none rounded-full border border-zinc-200 bg-white text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-600"
		/>
		{#if !focused}
			<kbd class="pointer-events-none absolute {large ? 'right-4' : 'right-3'} top-1/2 -translate-y-1/2 text-[11px] font-medium text-zinc-400 bg-zinc-100 border border-zinc-200 rounded px-1.5 py-0.5 dark:text-zinc-500 dark:bg-zinc-800 dark:border-zinc-700">
				{isMac ? '⌘K' : 'Ctrl K'}
			</kbd>
		{/if}
	</div>

	{#if focused && query.trim()}
		<div
			id="search-results"
			role="listbox"
			class="no-scrollbar absolute left-0 right-0 top-full z-50 mt-2 max-h-80 overflow-y-auto rounded-2xl border border-zinc-200 bg-white py-1.5 shadow-xl dark:border-zinc-800 dark:bg-zinc-950"
		>
			{#if results.length === 0}
				<p class="px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400">{m.search_empty()}</p>
			{:else}
				{#each results as result, i (result.type === 'origin' ? `o-${result.key}` : result.type === 'region' ? `r-${result.originKey}-${result.region}` : result.whisky.id)}
					<button
						bind:this={itemEls[i]}
						role="option"
						aria-selected={i === activeIndex}
						onmousedown={(e) => e.preventDefault()}
						onclick={() => go(result)}
						onmouseenter={() => (activeIndex = i)}
						class="flex w-full items-center gap-3 px-3 py-2.5 text-left transition {i === activeIndex
							? 'bg-zinc-200 dark:bg-zinc-700'
							: 'bg-transparent'}"
					>
						{#if result.type === 'origin'}
							<span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-2xl dark:bg-zinc-800">
								{result.flag}
							</span>
							<span class="min-w-0 flex-1">
								<span class="block truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
									{result.label}
								</span>
							</span>
							<span class="flex shrink-0 items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
								{m.search_origin()}
							</span>
						{:else if result.type === 'region'}
							<span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-2xl dark:bg-zinc-800">
								{result.originFlag}
							</span>
							<span class="min-w-0 flex-1">
								<span class="block truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
									{result.region}
								</span>
								<span class="block truncate text-xs text-zinc-500 dark:text-zinc-400">
									{result.originLabel}
								</span>
							</span>
							<span class="flex shrink-0 items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
								{m.search_region()}
							</span>
						{:else}
							<img
								src={result.whisky.image}
								alt={l10n(result.whisky, 'name') ?? result.whisky.name}
								class="h-10 w-10 shrink-0 rounded-lg bg-zinc-100 object-cover dark:bg-white"
							/>
							<span class="min-w-0 flex-1">
								<span class="block truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
									{l10n(result.whisky, 'name') ?? result.whisky.name}
								</span>
								<span class="block truncate text-xs text-zinc-500 dark:text-zinc-400">
									{result.whisky.brand}
								</span>
							</span>
							<span class="flex shrink-0 items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
								<span>{flagMap.get(result.whisky.origin) ?? '🌍'}</span>
								<span>{originLabel(result.whisky.origin)}</span>
							</span>
						{/if}
					</button>
				{/each}
			{/if}
		</div>
	{/if}
</div>
