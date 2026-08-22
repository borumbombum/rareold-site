<script lang="ts">
	import { ChevronDown } from '@lucide/svelte';
	import { m } from '$lib/paraglide/messages';
	import { filters, setSort, type SortKey } from '$lib/stores/filters.svelte';

	const OPTIONS: { key: SortKey; label: () => string }[] = [
		{ key: 'top', label: () => m.sort_top() },
		{ key: 'reviews', label: () => m.sort_reviews() },
		{ key: 'latest', label: () => m.sort_latest() },
		{ key: 'worst', label: () => m.sort_worst() },
		{ key: 'az', label: () => m.sort_az() }
	];
</script>

<label class="relative inline-flex items-center">
	<span class="sr-only">{m.sort_label()}</span>
	<select
		value={filters.sort}
		onchange={(e) => setSort(e.currentTarget.value as SortKey)}
		class="appearance-none rounded-full border border-zinc-200 bg-white py-2 pl-4 pr-9 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-700"
	>
		{#each OPTIONS as opt (opt.key)}
			<option value={opt.key}>{opt.label()}</option>
		{/each}
	</select>
	<ChevronDown size={15} class="pointer-events-none absolute right-3.5 text-zinc-400" />
</label>
