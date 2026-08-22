<script lang="ts">
	import { originLabel, sortOriginsByCount } from '$lib/utils/origins';
	import { m } from '$lib/paraglide/messages';

	let {
		selected = 'all',
		counts = {},
		regions = [],
		selectedRegion = null,
		onSelect,
		onSelectRegion
	}: {
		selected?: string;
		counts?: Record<string, number>;
		regions?: string[];
		selectedRegion?: string | null;
		onSelect: (key: string) => void;
		onSelectRegion?: (region: string | null) => void;
	} = $props();

	const sorted = $derived(sortOriginsByCount(counts));

	function countChip(key: string, isActive: boolean): string {
		if (counts[key] == null) return '';
		return isActive
			? 'rounded-full bg-white/25 px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-white'
			: 'rounded-full bg-zinc-100 px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400';
	}

	function pick(key: string): void {
		onSelect(key);
	}
</script>

<div class="relative">
	<div
		class="no-scrollbar -mx-4 flex flex-nowrap items-start gap-2 overflow-x-auto overscroll-x-contain px-4 pb-1 sm:-mx-6 sm:px-6"
	>
		<button
			onclick={() => pick('all')}
			class="shrink-0 snap-start rounded-2xl border px-5 py-3.5 text-center transition {selected === 'all'
				? 'border-zinc-900 bg-zinc-900 text-white shadow-sm dark:border-white dark:bg-white dark:text-zinc-900'
				: 'border-zinc-200 bg-white text-zinc-800 hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-zinc-600'}"
		>
			<span class="block text-xl">🌍</span>
			<span class="mt-1 flex items-center justify-center gap-1.5 text-sm font-semibold">
				{m.origin_all()}
				{#if counts['all'] != null}
					<span class={countChip('all', selected === 'all')}>{counts['all']}</span>
				{/if}
			</span>
		</button>
		{#each sorted as origin (origin.key)}
			<button
				onclick={() => pick(origin.key)}
				class="w-32 shrink-0 snap-start rounded-2xl border px-5 py-3.5 text-left transition {selected === origin.key
					? 'border-zinc-900 bg-zinc-900 text-white shadow-sm dark:border-white dark:bg-white dark:text-zinc-900'
					: 'border-zinc-200 bg-white text-zinc-800 hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-zinc-600'}"
			>
				<span class="block text-xl">{origin.flag}</span>
				<span class="mt-1 flex items-center justify-center gap-1.5 text-sm font-semibold">
					{originLabel(origin.key)}
					{#if counts[origin.key] != null}
						<span class={countChip(origin.key, selected === origin.key)}>{counts[origin.key]}</span>
					{/if}
				</span>
			</button>
		{/each}
	</div>

{#if regions.length > 0}
	<div
		class="no-scrollbar -mx-4 flex flex-nowrap items-start gap-2 overflow-x-auto overscroll-x-contain px-4 pb-1 sm:-mx-6 sm:px-6"
	>
		<button
			onclick={() => onSelectRegion?.(null)}
			class="shrink-0 snap-start rounded-full border px-4 py-2 text-sm font-medium transition {selectedRegion === null
				? 'border-accent bg-accent/10 text-accent'
				: 'border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-white'}"
		>
			{m.origin_all()}
		</button>
		{#each regions as region (region)}
			<button
				onclick={() => onSelectRegion?.(region)}
				class="shrink-0 snap-start rounded-full border px-4 py-2 text-sm font-medium transition {selectedRegion === region
					? 'border-accent bg-accent/10 text-accent'
					: 'border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-white'}"
			>
				{region}
			</button>
		{/each}
	</div>
{/if}
</div>
