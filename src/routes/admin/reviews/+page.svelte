<script lang="ts">
	import { Trash2 } from '@lucide/svelte';
	import { m } from '$lib/paraglide/messages';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let q = $state('');
	let country = $state('');
	let busy = $state(false);
	let rows = $state([...data.reviews]);

	const countries = ['UY', 'BR', 'US'];

	async function refresh() {
		busy = true;
		try {
			const params = new URLSearchParams();
			if (q.trim()) params.set('q', q.trim());
			if (country) params.set('country', country);
			const res = await fetch(`/api/admin/reviews?${params.toString()}`);
			if (res.ok) rows = (await res.json()).reviews;
		} finally {
			busy = false;
		}
	}

	async function remove(id: string) {
		if (!confirm(m.admin_reviews_confirm_delete())) return;
		const res = await fetch(`/api/admin/reviews?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
		if (res.ok) await refresh();
	}
</script>

<svelte:head>
	<title>{m.admin_title()} — {m.admin_reviews_title()}</title>
</svelte:head>

<div class="flex flex-wrap items-center justify-between gap-3">
	<div>
		<h1 class="font-display text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">{m.admin_reviews_title()}</h1>
		<p class="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{m.admin_reviews_count({ count: rows.length })}</p>
	</div>
	<div class="flex items-center gap-2">
		<input
			type="search"
			placeholder={m.admin_reviews_search()}
			bind:value={q}
			oninput={refresh}
			class="w-56 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
		/>
		<select
			bind:value={country}
			onchange={refresh}
			class="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
		>
			<option value="">{m.admin_reviews_all_countries()}</option>
			{#each countries as c (c)}
				<option value={c}>{c}</option>
			{/each}
		</select>
	</div>
</div>

<div class="mt-5 overflow-x-auto rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
	<table class="w-full min-w-[720px] text-left text-sm">
		<thead class="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
			<tr>
				<th class="px-4 py-3 font-medium">{m.admin_table_product()}</th>
				<th class="px-4 py-3 font-medium">{m.admin_table_user()}</th>
				<th class="px-4 py-3 text-right font-medium">{m.admin_table_score()}</th>
				<th class="px-4 py-3 font-medium">{m.admin_table_comment()}</th>
				<th class="px-4 py-3 font-medium">{m.admin_table_country()}</th>
				<th class="px-4 py-3 font-medium">{m.admin_table_date()}</th>
				<th class="px-4 py-3 text-right font-medium">{m.admin_table_actions()}</th>
			</tr>
		</thead>
		<tbody class="divide-y divide-zinc-100 dark:divide-zinc-800">
			{#each rows as r (r.id)}
				<tr class="text-zinc-800 dark:text-zinc-200">
					<td class="max-w-[160px] truncate px-4 py-2.5 font-medium">{r.product_name}</td>
					<td class="max-w-[140px] truncate px-4 py-2.5 text-zinc-500 dark:text-zinc-400">{r.user_name || '—'}</td>
					<td class="px-4 py-2.5 text-right tabular-nums">{r.score}</td>
					<td class="max-w-[260px] truncate px-4 py-2.5 text-zinc-500 dark:text-zinc-400">{r.comment ?? '—'}</td>
					<td class="px-4 py-2.5">{r.country ?? '—'}</td>
					<td class="whitespace-nowrap px-4 py-2.5 text-zinc-500 dark:text-zinc-400">
						{r.created_at.slice(0, 10)}
					</td>
					<td class="px-4 py-2.5">
						<div class="flex justify-end">
							<button
								onclick={() => remove(r.id)}
								disabled={busy}
								title={m.admin_products_delete()}
								class="grid h-8 w-8 place-items-center rounded-lg text-zinc-500 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
							>
								<Trash2 size={15} />
							</button>
						</div>
					</td>
				</tr>
			{:else}
				<tr>
					<td colspan="7" class="px-4 py-8 text-center text-zinc-500 dark:text-zinc-400">{m.admin_reviews_empty()}</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
