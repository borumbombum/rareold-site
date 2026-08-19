<script lang="ts">
	import { ChevronDown, X } from '@lucide/svelte';
	import { goto } from '$app/navigation';
	import { localizeHref, getLocale } from '$lib/paraglide/runtime';
	import { m } from '$lib/paraglide/messages';
	import { ui } from '$lib/stores/ui.svelte';
	import { filters, setRegion } from '$lib/stores/filters.svelte';
	import { ORIGINS, originKey, originLabel, originSlug, regionsByOrigin } from '$lib/utils/origins';
	import { WHISKIES } from '$lib/data/whiskies';
	import LanguageSwitcher from './LanguageSwitcher.svelte';

	const regionsByOriginMap = $derived(regionsByOrigin(WHISKIES));

	const originCounts = $derived.by(() => {
		const counts: Record<string, number> = { all: WHISKIES.length };
		for (const w of WHISKIES) {
			const key = originKey(w);
			counts[key] = (counts[key] ?? 0) + 1;
		}
		return counts;
	});

	function countPill(key: string): string {
		return `rounded-full px-1.5 py-0.5 text-[11px] font-medium tabular-nums ${
			filters.origin === key
				? 'bg-accent/15 text-accent'
				: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
		}`;
	}

	const open = $derived(ui.drawerOpen);

	let expanded = $state<string | null>(null);

	function toggleExpanded(key: string, event: MouseEvent) {
		event.stopPropagation();
		expanded = expanded === key ? null : key;
	}

	function pickOrigin(key: string) {
		if (key === 'all') {
			goto(localizeHref('/'));
		} else {
			goto(localizeHref(`/origen/${originSlug(key, getLocale())}`));
		}
		expanded = null;
		ui.closeDrawer();
	}

	function pickRegion(key: string, region: string | null) {
		setRegion(region);
		goto(localizeHref(`/origen/${originSlug(key, getLocale())}`));
		expanded = null;
		ui.closeDrawer();
	}

	$effect(() => {
		document.body.style.overflow = open ? 'hidden' : '';
		return () => {
			document.body.style.overflow = '';
		};
	});
</script>

<svelte:window onkeydown={(e) => e.key === 'Escape' && open && ui.closeDrawer()} />

<div
	class="fixed inset-0 z-50 {open ? 'pointer-events-auto' : 'pointer-events-none'}"
	inert={!open}
	aria-hidden={!open}
>
	<button
		type="button"
		class="absolute inset-0 w-full bg-zinc-950/40 backdrop-blur-sm transition-opacity duration-300 {open
			? 'opacity-100'
			: 'opacity-0'}"
		onclick={() => ui.closeDrawer()}
		aria-label={m.drawer_close()}
	></button>

	<div
		class="absolute inset-y-0 left-0 flex w-full max-w-xs flex-col bg-white shadow-2xl transition-transform duration-300 ease-out dark:bg-zinc-950 {open
			? 'translate-x-0'
			: '-translate-x-full'}"
		role="dialog"
		aria-modal="true"
		aria-label={m.drawer_title()}
	>
		<div class="flex items-center justify-between border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
			<h2 class="font-display text-lg font-semibold text-zinc-900 dark:text-white">
				{m.drawer_title()}
			</h2>
			<button
				onclick={() => ui.closeDrawer()}
				class="grid h-9 w-9 place-items-center rounded-full text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-white"
				aria-label={m.drawer_close()}
			>
				<X size={18} />
			</button>
		</div>

	{#if filters.origin !== 'all' || filters.region}
		<div class="flex items-center justify-between gap-3 border-b border-zinc-200 px-5 py-3 dark:border-zinc-800">
			<p class="text-sm font-medium text-zinc-700 dark:text-zinc-300">
				{ORIGINS.find((o) => o.key === filters.origin)?.flag ?? '🌍'}
				{originLabel(filters.origin)}
				{#if filters.region}
					<span class="text-zinc-400">· {filters.region}</span>
				{/if}
			</p>
			<button
				onclick={() => { goto(localizeHref('/')); ui.closeDrawer(); }}
				class="shrink-0 text-xs font-medium text-zinc-500 underline-offset-2 hover:underline dark:text-zinc-400"
			>
				{m.drawer_clear()}
			</button>
		</div>
	{/if}

		<nav class="flex-1 overflow-y-auto px-2 py-2">
			<button
				onclick={() => pickOrigin('all')}
				class="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition {filters.origin === 'all' && !filters.region
					? 'bg-zinc-100 font-semibold text-zinc-900 dark:bg-zinc-900 dark:text-white'
					: 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900'}"
			>
				<span class="text-xl">🌍</span>
				<span class="flex-1 text-sm">{m.origin_all()}</span>
				{#if originCounts['all'] != null}
					<span class={countPill('all')}>{originCounts['all']}</span>
				{/if}
			</button>

			{#each ORIGINS as origin (origin.key)}
				{@const regions = regionsByOriginMap[origin.key] ?? []}
				<div class="mt-1">
					<div
						class="flex w-full items-center gap-3 rounded-xl transition {filters.origin === origin.key
							? 'bg-accent/10 font-semibold text-zinc-900 dark:text-white'
							: 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900'}"
					>
						<button
							onclick={(e) => toggleExpanded(origin.key, e)}
							class="flex min-w-0 flex-1 items-center gap-3 px-3 py-3 text-left"
							aria-expanded={expanded === origin.key}
							aria-label={originLabel(origin.key)}
						>
							<span class="text-xl">{origin.flag}</span>
							<span class="min-w-0 flex-1 truncate text-sm">{originLabel(origin.key)}</span>
							{#if originCounts[origin.key] != null}
								<span class={countPill(origin.key)}>{originCounts[origin.key]}</span>
							{/if}
						</button>
						<button
							onclick={(e) => toggleExpanded(origin.key, e)}
							class="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-zinc-400 transition hover:text-zinc-900 dark:hover:text-white"
							aria-expanded={expanded === origin.key}
							aria-label={`${m.drawer_regions()} — ${originLabel(origin.key)}`}
						>
							<ChevronDown
								size={16}
								class="transition-transform duration-200 {expanded === origin.key ? 'rotate-180' : ''}"
							/>
						</button>
					</div>

					<div
						class="grid transition-[grid-template-rows] duration-200 ease-out {expanded === origin.key
							? 'grid-rows-[1fr]'
							: 'grid-rows-[0fr]'}"
						inert={expanded !== origin.key}
						aria-hidden={expanded !== origin.key}
					>
						<div class="min-h-0 overflow-hidden">
							<div class="ml-6 border-l border-zinc-200 py-1 pl-4 dark:border-zinc-800">
								<button
									onclick={() => pickRegion(origin.key, null)}
									class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition {filters.origin === origin.key && !filters.region
										? 'bg-accent/10 font-semibold text-accent'
										: 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900'}"
								>
									{m.origin_all()}
								</button>
								{#each regions as region (region)}
									<button
										onclick={() => pickRegion(origin.key, region)}
										class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition {filters.origin === origin.key && filters.region === region
											? 'bg-accent/10 font-semibold text-accent'
											: 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900'}"
									>
										{region}
									</button>
								{/each}
							</div>
						</div>
					</div>
				</div>
			{/each}
		</nav>

		<div class="shrink-0 border-t border-zinc-200 px-5 py-4 dark:border-zinc-800">
			<LanguageSwitcher />
		</div>
	</div>
</div>
