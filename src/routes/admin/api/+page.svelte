<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { m } from '$lib/paraglide/messages';
	import { ui } from '$lib/stores/ui.svelte';
	import { Plus, Trash2, Loader2, ShieldOff, Activity } from '@lucide/svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const inputClass =
		'w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white';

	const IP_RE = /^[0-9a-fA-F:.]+$/;

	type Control = (typeof data.controls)[number];

	let ip = $state('');
	let reason = $state('');
	let blocked = $state(true);
	let limit = $state('');
	let busy = $state(false);
	let error = $state('');

	const canSave = $derived(ip.trim().length > 0 && ip.trim().length <= 45 && IP_RE.test(ip.trim()));

	async function save() {
		if (!canSave) return;
		busy = true;
		error = '';
		try {
			const res = await fetch('/api/admin/api-ip-controls', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					ip: ip.trim(),
					blocked,
					reason: reason.trim() || null,
					limit_per_min: limit.trim() === '' ? null : Number(limit)
				})
			});
			if (res.ok) {
				ip = '';
				reason = '';
				limit = '';
				blocked = true;
				ui.showToast(m.admin_api_saved());
				await invalidateAll();
			} else {
				const msg = await res.text();
				error = msg.replace(/["{}]/g, '') || m.error_generic();
			}
		} finally {
			busy = false;
		}
	}

	async function remove(c: Control) {
		if (!confirm(m.admin_api_delete_confirm())) return;
		const res = await fetch(`/api/admin/api-ip-controls?ip=${encodeURIComponent(c.ip)}`, {
			method: 'DELETE'
		});
		if (res.ok) {
			ui.showToast(m.admin_api_deleted());
			await invalidateAll();
		} else {
			ui.showToast(m.error_generic(), true);
		}
	}
</script>

<svelte:head>
	<title>{m.admin_title()} — {m.admin_nav_api()}</title>
</svelte:head>

<div class="flex flex-wrap items-center justify-between gap-3">
	<div>
		<h1 class="font-display text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">{m.admin_nav_api()}</h1>
		<p class="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{m.admin_api_subtitle()}</p>
	</div>
</div>

<section class="mt-5 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
	<div class="flex items-center gap-2">
		<Activity size={16} class="text-accent" />
		<h2 class="font-display text-base font-semibold text-zinc-900 dark:text-white">{m.admin_api_usage()}</h2>
	</div>
	<div class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
		<div class="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-950">
			<dt class="text-xs text-zinc-500 dark:text-zinc-400">{m.admin_api_requests()}</dt>
			<dd class="mt-0.5 font-display text-xl font-semibold tabular-nums text-zinc-900 dark:text-white">
				{data.stats.requestsInWindow}
			</dd>
		</div>
		<div class="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-950">
			<dt class="text-xs text-zinc-500 dark:text-zinc-400">{m.admin_api_denied()}</dt>
			<dd class="mt-0.5 font-display text-xl font-semibold tabular-nums text-zinc-900 dark:text-white">
				{data.stats.denied429}
			</dd>
		</div>
	</div>

	{#if data.stats.endpoints.length > 0}
		<div class="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-2">
			<div>
				<h3 class="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{m.admin_api_endpoints()}</h3>
				<ul class="mt-2 space-y-1 text-sm">
					{#each data.stats.endpoints as e (e.path)}
						<li class="flex items-center justify-between gap-3 rounded-lg bg-zinc-50 px-3 py-1.5 dark:bg-zinc-950">
							<span class="font-mono text-xs text-zinc-600 dark:text-zinc-300">{e.path}</span>
							<span class="tabular-nums text-zinc-900 dark:text-white">{e.hits}</span>
						</li>
					{/each}
				</ul>
			</div>
			<div>
				<h3 class="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{m.admin_api_top_ips()}</h3>
				<ul class="mt-2 space-y-1 text-sm">
					{#each data.stats.topIps as e (e.ip)}
						<li class="flex items-center justify-between gap-3 rounded-lg bg-zinc-50 px-3 py-1.5 dark:bg-zinc-950">
							<span class="font-mono text-xs text-zinc-600 dark:text-zinc-300">{e.ip}</span>
							<span class="tabular-nums text-zinc-900 dark:text-white">{e.hits}</span>
						</li>
					{:else}
						<li class="text-sm text-zinc-500 dark:text-zinc-400">—</li>
					{/each}
				</ul>
			</div>
		</div>
	{/if}
</section>

<section class="mt-5 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
	<div class="flex items-center gap-2">
		<ShieldOff size={16} class="text-accent" />
		<h2 class="font-display text-base font-semibold text-zinc-900 dark:text-white">{m.admin_api_controls()}</h2>
	</div>

	<form
		class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-4"
		onsubmit={(e) => {
			e.preventDefault();
			save();
		}}
	>
		<label class="block text-sm">
			<span class="mb-1 block font-medium text-zinc-600 dark:text-zinc-300">{m.admin_api_ip()}</span>
			<input bind:value={ip} placeholder="203.0.113.7" class={inputClass} />
		</label>
		<label class="block text-sm">
			<span class="mb-1 block font-medium text-zinc-600 dark:text-zinc-300">{m.admin_api_reason()}</span>
			<input bind:value={reason} placeholder="Abuse" class={inputClass} />
		</label>
		<label class="block text-sm">
			<span class="mb-1 block font-medium text-zinc-600 dark:text-zinc-300">{m.admin_api_limit()}</span>
			<input bind:value={limit} type="number" min="1" placeholder="60" class={inputClass} />
		</label>
		<div class="flex items-end gap-2">
			<label class="flex items-center gap-2 pb-2 text-sm">
				<input type="checkbox" bind:checked={blocked} class="h-4 w-4" />
				<span class="font-medium text-zinc-600 dark:text-zinc-300">{m.admin_api_blocked()}</span>
			</label>
			<button
				type="submit"
				disabled={busy || !canSave}
				class="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-60 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
			>
				{#if busy}
					<Loader2 size={14} class="animate-spin" />
				{:else}
					<Plus size={14} />
				{/if}
				{m.admin_api_add()}
			</button>
		</div>
	</form>

	{#if error}
		<p class="mt-4 text-sm font-medium text-red-600 dark:text-red-400">{error}</p>
	{/if}

	<div class="mt-5 overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
		<table class="w-full min-w-[560px] text-left text-sm">
			<thead class="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
				<tr>
					<th class="px-4 py-3 font-medium">{m.admin_api_ip()}</th>
					<th class="px-4 py-3 font-medium">{m.admin_api_status()}</th>
					<th class="px-4 py-3 font-medium">{m.admin_api_limit()}</th>
					<th class="px-4 py-3 font-medium">{m.admin_api_reason()}</th>
					<th class="px-4 py-3 text-right font-medium">{m.admin_table_actions()}</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-zinc-100 dark:divide-zinc-800">
				{#each data.controls as c (c.ip)}
					<tr class="text-zinc-800 dark:text-zinc-200">
						<td class="whitespace-nowrap px-4 py-2.5 font-mono text-xs">{c.ip}</td>
						<td class="px-4 py-2.5">
							<span
								class="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold {c.blocked
									? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
									: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'}"
							>
								{c.blocked ? m.admin_api_status_blocked() : m.admin_api_status_tracking()}
							</span>
						</td>
						<td class="px-4 py-2.5 tabular-nums">{c.limit_per_min ?? '—'}</td>
						<td class="max-w-[220px] truncate px-4 py-2.5 text-zinc-500 dark:text-zinc-400">{c.reason ?? '—'}</td>
						<td class="px-4 py-2.5">
							<div class="flex justify-end">
								<button
									onclick={() => remove(c)}
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
						<td colspan="5" class="px-4 py-8 text-center text-zinc-500 dark:text-zinc-400">{m.admin_api_no_controls()}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</section>