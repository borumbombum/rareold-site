<script lang="ts">
	import { Trophy } from 'lucide-svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const counts = $derived([
		{ label: 'Products', value: data.stats.counts.products },
		{ label: 'Users', value: data.stats.counts.users },
		{ label: 'Reviews', value: data.stats.counts.reviews },
		{ label: 'Votes', value: data.stats.counts.votes }
	]);
</script>

<svelte:head>
	<title>Admin — Dashboard</title>
</svelte:head>

<h1 class="font-display text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">Dashboard</h1>

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
	Top whiskies by karma
</h2>

<div class="mt-3 overflow-x-auto rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
	{#if data.stats.top.length === 0}
		<p class="px-5 py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">No votes yet.</p>
	{:else}
		<table class="w-full min-w-[480px] text-left text-sm">
			<thead class="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
				<tr>
					<th class="px-5 py-3 font-medium">#</th>
					<th class="px-5 py-3 font-medium">Whisky</th>
					<th class="px-5 py-3 text-right font-medium">Karma</th>
					<th class="px-5 py-3 text-right font-medium">Votes</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-zinc-100 dark:divide-zinc-800">
				{#each data.stats.top as row, i (row.slug)}
					<tr class="text-zinc-800 dark:text-zinc-200">
						<td class="px-5 py-2.5 tabular-nums text-zinc-500 dark:text-zinc-400">{i + 1}</td>
						<td class="px-5 py-2.5 font-medium">{row.name}</td>
						<td class="px-5 py-2.5 text-right tabular-nums">{row.karma}</td>
						<td class="px-5 py-2.5 text-right tabular-nums">{row.vote_count}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}
</div>
