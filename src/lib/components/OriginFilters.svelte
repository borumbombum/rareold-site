<script lang="ts">
	import { Pin } from '@lucide/svelte';
	import { originLabel, sortOriginsForDisplay } from '$lib/utils/origins';
	import { isPinnedOrigin, togglePinnedOrigin } from '$lib/stores/pinned-origins.svelte';
	import { ui } from '$lib/stores/ui.svelte';
	import { m } from '$lib/paraglide/messages';

	let {
		selected = 'all',
		counts = {},
		regions = [],
		selectedRegion = null,
		activeOrigin = undefined,
		onSelect,
		onSelectRegion
	}: {
		selected?: string;
		counts?: Record<string, number>;
		regions?: string[];
		selectedRegion?: string | null;
		activeOrigin?: string;
		onSelect: (key: string) => void;
		onSelectRegion?: (region: string | null) => void;
	} = $props();

	const sorted = $derived(sortOriginsForDisplay(counts, activeOrigin));

	function countChip(key: string, isActive: boolean): string {
		if (counts[key] == null) return '';
		return isActive
			? 'rounded-full bg-white/25 px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-white'
			: 'rounded-full bg-zinc-100 px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400';
	}

	function pick(key: string): void {
		onSelect(key);
	}

	function togglePin(key: string, event: MouseEvent): void {
		event.stopPropagation();
		const pinned = togglePinnedOrigin(key);
		ui.showToast(pinned ? m.origin_pinned() : m.origin_unpinned());
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
			<div class="relative shrink-0 snap-start">
				<button
					onclick={() => pick(origin.key)}
					class="w-32 rounded-2xl border px-5 py-3.5 text-left transition {activeOrigin === origin.key
						? 'border-accent bg-accent/10 ring-2 ring-accent/50 dark:border-accent dark:bg-accent/10'
						: selected === origin.key
							? 'border-zinc-900 bg-zinc-900 text-white shadow-sm dark:border-white dark:bg-white dark:text-zinc-900'
							: 'border-zinc-200 bg-white text-zinc-800 hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-zinc-600'}"
				>
					<span class="block text-xl">{origin.flag}</span>
					<span class="mt-1 flex items-center justify-center gap-1.5 text-sm font-semibold">
						{originLabel(origin.key)}
						{#if counts[origin.key] != null}
							<span class={countChip(origin.key, selected === origin.key || activeOrigin === origin.key)}>{counts[origin.key]}</span>
						{/if}
					</span>
				</button>
				<button
					onclick={(e) => togglePin(origin.key, e)}
					class="absolute -right-1 -top-1 grid h-6 w-6 place-items-center rounded-full border border-zinc-200 bg-white text-zinc-400 shadow-sm transition hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:text-white"
					aria-pressed={isPinnedOrigin(origin.key)}
					aria-label={`${isPinnedOrigin(origin.key) ? m.origin_unpinned() : m.origin_pinned()} ${originLabel(origin.key)}`}
				>
					<Pin
						size={14}
						class={isPinnedOrigin(origin.key) ? 'text-accent' : ''}
						fill={isPinnedOrigin(origin.key) ? 'currentColor' : 'none'}
					/>
				</button>
			</div>
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
