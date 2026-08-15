<script lang="ts">
	import { goto } from '$app/navigation';
	import { getLocale, localizeHref } from '$lib/paraglide/runtime';
	import { m } from '$lib/paraglide/messages';
	import { WHISKIES } from '$lib/data/whiskies';
	import { ORIGINS, originLabel } from '$lib/utils/origins';
	import { l10n } from '$lib/utils/l10n';
	import { Search } from 'lucide-svelte';
	import type { Whisky } from '$lib/types';

	const flagMap = new Map(ORIGINS.map((o) => [o.key, o.flag]));

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

	const locale = $derived(getLocale());

	const results = $derived.by(() => {
		const q = normalize(query.trim());
		if (!q) return [];
		const out: Whisky[] = [];
		for (const w of WHISKIES) {
			const region = w.region ?? '';
			const originLabelText = originLabel(w.origin);
			const localizedName = l10n(w, 'name') ?? w.name;
			const haystack = `${w.name} ${localizedName} ${w.brand} ${w.origin} ${originLabelText} ${region}`;
			if (normalize(haystack).includes(q)) {
				out.push(w);
				if (out.length === 8) break;
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

	function go(whisky: Whisky) {
		query = '';
		focused = false;
		goto(localizeHref(`/whisky/${whisky.slug}`, { locale }));
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
			size={16}
			class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
		/>
		<input
			type="search"
			bind:value={query}
			onfocus={() => (focused = true)}
			onkeydown={onKeydown}
			placeholder={m.search_placeholder()}
			aria-label={m.search_label()}
			role="combobox"
			aria-expanded={focused && results.length > 0}
			aria-controls="search-results"
			autocomplete="off"
			class="h-9 w-full appearance-none rounded-full border border-zinc-200 bg-white pl-9 pr-4 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-600"
		/>
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
				{#each results as whisky, i (whisky.id)}
					<button
						bind:this={itemEls[i]}
						role="option"
						aria-selected={i === activeIndex}
						onmousedown={(e) => e.preventDefault()}
						onclick={() => go(whisky)}
						onmouseenter={() => (activeIndex = i)}
						class="flex w-full items-center gap-3 px-3 py-2.5 text-left transition {i === activeIndex
							? 'bg-zinc-100 dark:bg-zinc-800'
							: 'bg-transparent'}"
					>
						<img
							src={whisky.image}
							alt={l10n(whisky, 'name') ?? whisky.name}
							class="h-10 w-10 shrink-0 rounded-lg bg-zinc-100 object-cover dark:bg-white"
						/>
						<span class="min-w-0 flex-1">
							<span class="block truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
								{l10n(whisky, 'name') ?? whisky.name}
							</span>
							<span class="block truncate text-xs text-zinc-500 dark:text-zinc-400">
								{whisky.brand}
							</span>
						</span>
						<span class="flex shrink-0 items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
							<span>{flagMap.get(whisky.origin) ?? '🌍'}</span>
							<span>{originLabel(whisky.origin)}</span>
						</span>
					</button>
				{/each}
			{/if}
		</div>
	{/if}
</div>
