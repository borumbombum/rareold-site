<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { m } from '$lib/paraglide/messages';
	import { ui } from '$lib/stores/ui.svelte';
	import { Plus, Pencil, Trash2, X, Loader2, ArrowUpDown } from '@lucide/svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const inputClass =
		'w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white';

	const CODE_RE = /^[A-Z]{2}$/;

	type Country = (typeof data.countries)[number];

	type Editing = {
		code: string;
		name: string;
		currency: string;
		sort_order: number;
		active: boolean;
	};

	let editing = $state<Editing | null>(null);
	let isNew = $state(false);
	let busy = $state(false);
	let error = $state('');
	let sortKey = $state<'name' | 'sort_order' | 'store_count'>('sort_order');
	let sortAsc = $state(true);

	const countries = $derived(data.countries);

	const sorted = $derived.by(() => {
		const dir = sortAsc ? 1 : -1;
		return [...countries].sort((a, b) => {
			if (sortKey === 'name') return a.name.localeCompare(b.name) * dir;
			return ((a[sortKey] ?? 0) - (b[sortKey] ?? 0)) * dir;
		});
	});

	function toggleSort(key: 'name' | 'sort_order' | 'store_count') {
		if (sortKey === key) sortAsc = !sortAsc;
		else {
			sortKey = key;
			sortAsc = true;
		}
	}

	function emptyCountry(): Editing {
		return { code: '', name: '', currency: '', sort_order: 99, active: true };
	}

	function newCountry() {
		isNew = true;
		error = '';
		editing = emptyCountry();
	}

	function edit(c: Country) {
		isNew = false;
		error = '';
		editing = {
			code: c.code,
			name: c.name,
			currency: c.currency,
			sort_order: c.sort_order,
			active: c.active
		};
	}

	function close() {
		editing = null;
	}

	const canSave = $derived(
		Boolean(editing && CODE_RE.test(editing.code) && editing.name.trim() && editing.currency.trim())
	);

	async function save() {
		if (!editing || !canSave) return;
		busy = true;
		error = '';
		try {
			const res = await fetch('/api/admin/store-countries', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(editing)
			});
			if (res.ok) {
				close();
				ui.showToast(m.admin_store_countries_saved());
				await invalidateAll();
			} else {
				const msg = await res.text();
				error = msg.replace(/["{}]/g, '') || m.error_generic();
				ui.showToast(m.error_generic(), true);
			}
		} finally {
			busy = false;
		}
	}

	async function remove(code: string) {
		if (!confirm(m.admin_store_countries_delete_confirm())) return;
		const res = await fetch(`/api/admin/store-countries?id=${encodeURIComponent(code)}`, {
			method: 'DELETE'
		});
		if (res.ok) {
			ui.showToast(m.admin_store_countries_deleted());
			await invalidateAll();
		} else if (res.status === 409) {
			ui.showToast(m.admin_store_countries_in_use(), true);
		} else {
			ui.showToast(m.error_generic(), true);
		}
	}

	function thClass(active: boolean): string {
		return `px-4 py-3 font-medium ${active ? 'text-zinc-900 dark:text-white' : ''}`;
	}
</script>

<svelte:head>
	<title>{m.admin_title()} — {m.admin_nav_store_countries()}</title>
</svelte:head>

<div class="flex flex-wrap items-center justify-between gap-3">
	<div>
		<h1 class="font-display text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">{m.admin_nav_store_countries()}</h1>
		<p class="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{m.admin_store_countries_count({ count: countries.length })}</p>
	</div>
	<button
		onclick={newCountry}
		class="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
	>
		<Plus size={15} />
		{m.admin_store_countries_new()}
	</button>
</div>

{#if editing}
	<div class="mt-5 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
		<div class="flex items-center justify-between">
			<h2 class="font-display text-base font-semibold text-zinc-900 dark:text-white">
				{isNew ? m.admin_store_countries_new() : m.admin_store_countries_edit()}
			</h2>
			<button
				onclick={close}
				class="grid h-8 w-8 place-items-center rounded-full text-zinc-500 transition hover:bg-zinc-100 dark:hover:bg-zinc-800"
				aria-label={m.drawer_close()}
			>
				<X size={16} />
			</button>
		</div>

		<div class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
			<label class="block text-sm">
				<span class="mb-1 block font-medium text-zinc-600 dark:text-zinc-300">{m.admin_store_countries_code()}</span>
				<input
					bind:value={editing.code}
					disabled={!isNew}
					placeholder="BR"
					class="{inputClass} {CODE_RE.test(editing.code) || !editing.code ? '' : 'border-red-400'}"
				/>
			</label>
			<label class="block text-sm">
				<span class="mb-1 block font-medium text-zinc-600 dark:text-zinc-300">{m.admin_table_name()}</span>
				<input bind:value={editing.name} placeholder="Brazil" class={inputClass} />
			</label>
			<label class="block text-sm">
				<span class="mb-1 block font-medium text-zinc-600 dark:text-zinc-300">{m.admin_store_countries_currency()}</span>
				<input bind:value={editing.currency} placeholder="BRL" class={inputClass} />
			</label>
			<label class="block text-sm">
				<span class="mb-1 block font-medium text-zinc-600 dark:text-zinc-300">{m.admin_table_sort_order()}</span>
				<input type="number" bind:value={editing.sort_order} min="0" class={inputClass} />
			</label>
			<label class="flex items-center gap-2 text-sm md:col-span-2">
				<input type="checkbox" bind:checked={editing.active} class="h-4 w-4" />
				<span class="font-medium text-zinc-600 dark:text-zinc-300">{m.admin_store_countries_active()}</span>
			</label>
		</div>

		{#if error}
			<p class="mt-4 text-sm font-medium text-red-600 dark:text-red-400">{error}</p>
		{/if}

		<div class="mt-5 flex items-center gap-2">
			<button
				onclick={save}
				disabled={busy || !canSave}
				class="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-60 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
			>
				{#if busy}
					<Loader2 size={14} class="animate-spin" />
				{/if}
				{busy ? m.admin_pages_saving() : m.admin_pages_save()}
			</button>
			<button
				onclick={close}
				class="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
			>
				{m.admin_pages_cancel()}
			</button>
		</div>
	</div>
{/if}

<div class="mt-5 overflow-x-auto rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
	<table class="w-full min-w-[640px] text-left text-sm">
		<thead class="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
			<tr>
				<th class="px-4 py-3 font-medium">{m.admin_store_countries_code()}</th>
				<th class={thClass(sortKey === 'name')}>
					<button onclick={() => toggleSort('name')} class="inline-flex items-center gap-1 uppercase tracking-wide hover:text-zinc-900 dark:hover:text-white">
						{m.admin_table_name()}
						<ArrowUpDown size={12} />
					</button>
				</th>
				<th class="px-4 py-3 font-medium">{m.admin_store_countries_currency()}</th>
				<th class={thClass(sortKey === 'sort_order')}>
					<button onclick={() => toggleSort('sort_order')} class="inline-flex items-center gap-1 uppercase tracking-wide hover:text-zinc-900 dark:hover:text-white">
						{m.admin_table_sort_order()}
						<ArrowUpDown size={12} />
					</button>
				</th>
				<th class={thClass(sortKey === 'store_count')}>
					<button onclick={() => toggleSort('store_count')} class="inline-flex items-center gap-1 uppercase tracking-wide hover:text-zinc-900 dark:hover:text-white">
						{m.admin_table_store_count()}
						<ArrowUpDown size={12} />
					</button>
				</th>
				<th class="px-4 py-3 font-medium">{m.admin_store_countries_active()}</th>
				<th class="px-4 py-3 text-right font-medium">{m.admin_table_actions()}</th>
			</tr>
		</thead>
		<tbody class="divide-y divide-zinc-100 dark:divide-zinc-800">
			{#each sorted as country (country.code)}
				<tr class="text-zinc-800 dark:text-zinc-200">
					<td class="whitespace-nowrap px-4 py-2.5 font-mono text-xs">{country.code}</td>
					<td class="max-w-[220px] truncate px-4 py-2.5 font-medium">{country.name}</td>
					<td class="px-4 py-2.5 tabular-nums">{country.currency}</td>
					<td class="px-4 py-2.5 tabular-nums">{country.sort_order}</td>
					<td class="px-4 py-2.5 tabular-nums">{country.store_count}</td>
					<td class="px-4 py-2.5">
						<span
							class="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold {country.active
								? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
								: 'bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500'}"
						>
							{country.active ? m.yes() : m.no()}
						</span>
					</td>
					<td class="px-4 py-2.5">
						<div class="flex justify-end gap-1">
							<button
								onclick={() => edit(country)}
								title={m.admin_pages_edit()}
								class="grid h-8 w-8 place-items-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white"
							>
								<Pencil size={15} />
							</button>
							<button
								onclick={() => remove(country.code)}
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
					<td colspan="7" class="px-4 py-8 text-center text-zinc-500 dark:text-zinc-400">—</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>