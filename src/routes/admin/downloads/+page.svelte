<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { m } from '$lib/paraglide/messages';
	import { ui } from '$lib/stores/ui.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let busy = $state<string | null>(null);
	let lastUrl = $state('');

	const requests = $derived(data.requests);

	function state(r: (typeof requests)[number]): 'pending' | 'granted' | 'expired' | 'downloaded' {
		if (r.status === 'granted') {
			if (r.expires_at && new Date(r.expires_at).getTime() < Date.now()) return 'expired';
			return 'granted';
		}
		return r.status;
	}

	async function grant(id: string) {
		busy = id;
		try {
			const res = await fetch('/api/admin/downloads', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id })
			});
			if (res.ok) {
				const data = (await res.json()) as { url: string };
				lastUrl = data.url;
				await navigator.clipboard.writeText(data.url).catch(() => {});
				ui.showToast(m.admin_downloads_copied());
				await invalidateAll();
			} else {
				ui.showToast(m.error_generic(), true);
			}
		} finally {
			busy = null;
		}
	}

	const badge: Record<string, string> = {
		pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
		granted: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
		expired: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400',
		downloaded: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400'
	};
</script>

<svelte:head>
	<title>{m.admin_title()} — {m.admin_nav_downloads()}</title>
</svelte:head>

<div class="flex flex-wrap items-center justify-between gap-3">
	<div>
		<h1 class="font-display text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">{m.admin_nav_downloads()}</h1>
		<p class="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{m.admin_downloads_count({ count: requests.length })}</p>
	</div>
</div>

{#if lastUrl}
	<div class="mt-5 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
		<p class="text-xs font-semibold uppercase tracking-wide text-zinc-400">{m.admin_downloads_last_link()}</p>
		<div class="mt-2 flex gap-2">
			<input readonly value={lastUrl} onclick={(e) => (e.currentTarget as HTMLInputElement).select()} class="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300" />
			<button
				onclick={() => {
					navigator.clipboard.writeText(lastUrl);
					ui.showToast(m.admin_downloads_copied());
				}}
				class="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900"
			>
				Copy
			</button>
		</div>
	</div>
{/if}

<div class="mt-5 overflow-x-auto rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
	<table class="w-full min-w-[640px] text-left text-sm">
		<thead class="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
			<tr>
				<th class="px-4 py-3 font-medium">{m.admin_table_email()}</th>
				<th class="px-4 py-3 font-medium">{m.admin_table_status()}</th>
				<th class="px-4 py-3 font-medium">{m.admin_table_date()}</th>
				<th class="px-4 py-3 font-medium">{m.admin_table_updated()}</th>
				<th class="px-4 py-3 text-right font-medium">{m.admin_table_actions()}</th>
			</tr>
		</thead>
		<tbody class="divide-y divide-zinc-100 dark:divide-zinc-800">
			{#each requests as r (r.id)}
				{@const st = state(r)}
				<tr class="text-zinc-800 dark:text-zinc-200">
					<td class="max-w-[220px] truncate px-4 py-2.5 font-medium">{r.email}</td>
					<td class="px-4 py-2.5">
						<span class="rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase {badge[st]}">{st}</span>
					</td>
					<td class="whitespace-nowrap px-4 py-2.5 text-zinc-500 dark:text-zinc-400">{r.created_at.slice(0, 10)}</td>
					<td class="whitespace-nowrap px-4 py-2.5 text-zinc-500 dark:text-zinc-400">
						{#if r.expires_at}
							{r.expires_at.slice(0, 16).replace('T', ' ')}
						{:else}
							—
						{/if}
					</td>
					<td class="px-4 py-2.5">
						<div class="flex justify-end">
							<button
								onclick={() => grant(r.id)}
								disabled={busy === r.id}
								class="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-zinc-700 disabled:opacity-50 dark:bg-white dark:text-zinc-900"
							>
								{busy === r.id ? '…' : m.admin_downloads_grant()}
							</button>
						</div>
					</td>
				</tr>
			{:else}
				<tr>
					<td colspan="5" class="px-4 py-8 text-center text-zinc-500 dark:text-zinc-400">{m.admin_downloads_empty()}</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
