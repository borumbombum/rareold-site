<script lang="ts">
	import { Trophy, Star } from '@lucide/svelte';
	import { m } from '$lib/paraglide/messages';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const counts = $derived([
		{ label: m.admin_stat_products(), value: data.stats.counts.products },
		{ label: m.admin_stat_users(), value: data.stats.counts.users },
		{ label: m.admin_stat_reviews(), value: data.stats.counts.reviews },
		{ label: m.admin_stat_votes(), value: data.stats.counts.votes }
	]);
</script>

<svelte:head>
	<title>{m.admin_title()} — {m.admin_dashboard_title()}</title>
</svelte:head>

<h1 class="font-display text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">{m.admin_dashboard_title()}</h1>

<div class="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
	{#each counts as c (c.label)}
		<div class="rounded-2xl border border-zinc-200 bg-white px-4 py-4 dark:border-zinc-800 dark:bg-zinc-900">
			<p class="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{c.label}</p>
			<p class="mt-1 text-2xl font-semibold tabular-nums text-zinc-900 dark:text-white">{c.value}</p>
		</div>
	{/each}
</div>

<h2 class="mt-8 flex items-center gap-2 font-display text-base font-semibold text-zinc-900 dark:text-white">
	<Trophy size={18} class="text-amber-500" />
	Top whiskies by score
</h2>

<div class="mt-3 overflow-x-auto rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
	{#if data.stats.top.length === 0}
		<p class="px-5 py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">No reviews yet.</p>
	{:else}
		<table class="w-full min-w-[480px] text-left text-sm">
			<thead class="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
				<tr>
					<th class="px-5 py-3 font-medium">#</th>
					<th class="px-5 py-3 font-medium">{m.admin_table_whisky()}</th>
					<th class="px-5 py-3 text-right font-medium">{m.admin_table_score()}</th>
					<th class="px-5 py-3 text-right font-medium">{m.admin_table_reviews()}</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-zinc-100 dark:divide-zinc-800">
				{#each data.stats.top as row, i (row.slug)}
					<tr class="text-zinc-800 dark:text-zinc-200">
						<td class="px-5 py-2.5 tabular-nums text-zinc-500 dark:text-zinc-400">{i + 1}</td>
						<td class="px-5 py-2.5 font-medium">{row.name}</td>
						<td class="px-5 py-2.5 text-right tabular-nums">
							{#if row.avg_rating > 0}
								<span class="inline-flex items-center gap-1"><Star size={13} class="fill-amber-400 text-amber-400" />{row.avg_rating.toFixed(1)}</span>
							{:else}
								—
							{/if}
						</td>
						<td class="px-5 py-2.5 text-right tabular-nums">{row.review_count || '—'}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}
</div>
