<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { m } from '$lib/paraglide/messages';
	import { ui } from '$lib/stores/ui.svelte';
	import { Plus, Pencil, Trash2, X, Loader2 } from '@lucide/svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const inputClass =
		'w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white';

	const ID_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

	type Store = (typeof data.stores)[number];

	type Editing = {
		id: string;
		store_country_code: string;
		name: string;
		url: string;
		logo_url: string;
		sort_order: number;
	};

	let editing = $state<Editing | null>(null);
	let isNew = $state(false);
	let busy = $state(false);
	let error = $state('');
	let filterCountry = $state(data.activeCountry ?? (data.countries.length ? data.countries[0].code : ''));

	const countries = $derived(data.countries);
	const stores = $derived(data.stores);

	function onFilterChange() {
		gotoAdmin(filterCountry);
	}

	function gotoAdmin(country: string) {
		window.location.search = country ? `?country=${encodeURIComponent(country)}` : '';
	}

	function emptyStore(): Editing {
		return {
			id: '',
			store_country_code: filterCountry || countries[0]?.code || '',
			name: '',
			url: '',
			logo_url: '',
			sort_order: 99
		};
	}

	function newStore() {
		isNew = true;
		error = '';
		editing = emptyStore();
	}

	function edit(s: Store) {
		isNew = false;
		error = '';
		editing = {
			id: s.id,
			store_country_code: s.store_country_code,
			name: s.name,
			url: s.url,
			logo_url: s.logo_url ?? '',
			sort_order: s.sort_order
		};
	}

	function close() {
		editing = null;
	}

	const canSave = $derived(
		Boolean(
			editing &&
				ID_RE.test(editing.id) &&
				editing.store_country_code &&
				editing.name.trim() &&
				/^https?:\/\/.+/i.test(editing.url)
		)
	);

	async function save() {
		if (!editing || !canSave) return;
		busy = true;
		error = '';
		try {
			const res = await fetch('/api/admin/stores', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(editing)
			});
			if (res.ok) {
				close();
				ui.showToast(m.admin_stores_saved());
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

	async function remove(id: string) {
		if (!confirm(m.admin_stores_delete_confirm())) return;
		const res = await fetch(`/api/admin/stores?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
		if (res.ok) {
			ui.showToast(m.admin_stores_deleted());
			await invalidateAll();
		} else if (res.status === 409) {
			ui.showToast(m.admin_stores_in_use(), true);
		} else {
			ui.showToast(m.error_generic(), true);
		}
	}
</script>

<svelte:head>
	<title>{m.admin_title()} — {m.admin_nav_stores()}</title>
</svelte:head>

<div class="flex flex-wrap items-center justify-between gap-3">
	<div>
		<h1 class="font-display text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">{m.admin_nav_stores()}</h1>
		<p class="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{m.admin_stores_count({ count: stores.length })}</p>
	</div>
	<div class="flex items-center gap-2">
		<select
			bind:value={filterCountry}
			onchange={onFilterChange}
			class="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
		>
			<option value="">{m.admin_stores_filter_country()}</option>
			{#each countries as c (c.code)}
				<option value={c.code}>{c.code} — {c.name}</option>
			{/each}
		</select>
		<button
			onclick={newStore}
			class="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
		>
			<Plus size={15} />
			{m.admin_stores_new()}
		</button>
	</div>
</div>

{#if editing}
	<div class="mt-5 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
		<div class="flex items-center justify-between">
			<h2 class="font-display text-base font-semibold text-zinc-900 dark:text-white">
				{isNew ? m.admin_stores_new() : m.admin_stores_edit()}
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
				<span class="mb-1 block font-medium text-zinc-600 dark:text-zinc-300">ID</span>
				<input
					bind:value={editing.id}
					disabled={!isNew}
					placeholder="amazon"
					class="{inputClass} {ID_RE.test(editing.id) || !editing.id ? '' : 'border-red-400'}"
				/>
			</label>
			<label class="block text-sm">
				<span class="mb-1 block font-medium text-zinc-600 dark:text-zinc-300">{m.admin_table_country()}</span>
				<select bind:value={editing.store_country_code} class={inputClass}>
					<option value="">—</option>
					{#each countries as c (c.code)}
						<option value={c.code}>{c.code} — {c.name}</option>
					{/each}
				</select>
			</label>
			<label class="block text-sm">
				<span class="mb-1 block font-medium text-zinc-600 dark:text-zinc-300">{m.admin_table_name()}</span>
				<input bind:value={editing.name} placeholder="Amazon" class={inputClass} />
			</label>
			<label class="block text-sm md:col-span-2">
				<span class="mb-1 block font-medium text-zinc-600 dark:text-zinc-300">{m.admin_stores_url()}</span>
				<input bind:value={editing.url} placeholder="https://" class={inputClass} />
			</label>
			<label class="block text-sm">
				<span class="mb-1 block font-medium text-zinc-600 dark:text-zinc-300">{m.admin_table_sort_order()}</span>
				<input type="number" bind:value={editing.sort_order} min="0" class={inputClass} />
			</label>
			<label class="block text-sm md:col-span-2">
				<span class="mb-1 block font-medium text-zinc-600 dark:text-zinc-300">{m.admin_stores_logo_url()}</span>
				<div class="flex items-center gap-2">
					<input bind:value={editing.logo_url} placeholder="https://" class={inputClass} />
					{#if editing.logo_url}
						<img
							src={editing.logo_url}
							alt=""
							class="h-10 w-10 shrink-0 rounded-lg border border-zinc-200 object-contain dark:border-zinc-700"
						/>
					{/if}
				</div>
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
	{#if stores.length === 0}
		<p class="px-4 py-10 text-center text-sm text-zinc-500 dark:text-zinc-400">{m.admin_stores_empty()}</p>
	{:else}
		<table class="w-full min-w-[720px] text-left text-sm">
			<thead class="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
				<tr>
					<th class="px-4 py-3 font-medium"></th>
					<th class="px-4 py-3 font-medium">{m.admin_table_name()}</th>
					<th class="px-4 py-3 font-medium">{m.admin_stores_url()}</th>
					<th class="px-4 py-3 font-medium">{m.admin_table_sort_order()}</th>
					<th class="px-4 py-3 text-right font-medium">{m.admin_table_actions()}</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-zinc-100 dark:divide-zinc-800">
				{#each stores as store (store.id)}
					<tr class="text-zinc-800 dark:text-zinc-200">
						<td class="px-4 py-2.5">
							{#if store.logo_url}
								<img
									src={store.logo_url}
									alt=""
									loading="lazy"
									class="h-9 w-9 rounded-lg border border-zinc-200 object-contain dark:border-zinc-700"
								/>
							{:else}
								<span class="grid h-9 w-9 place-items-center rounded-lg bg-zinc-100 text-zinc-400 dark:bg-zinc-800">—</span>
							{/if}
						</td>
						<td class="max-w-[220px] truncate px-4 py-2.5 font-medium">{store.name}</td>
						<td class="max-w-[240px] truncate px-4 py-2.5 text-xs text-zinc-500 dark:text-zinc-400">{store.url}</td>
						<td class="px-4 py-2.5 tabular-nums">{store.sort_order}</td>
						<td class="px-4 py-2.5">
							<div class="flex justify-end gap-1">
								<button
									onclick={() => edit(store)}
									title={m.admin_pages_edit()}
									class="grid h-8 w-8 place-items-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white"
								>
									<Pencil size={15} />
								</button>
								<button
									onclick={() => remove(store.id)}
									title={m.admin_products_delete()}
									class="grid h-8 w-8 place-items-center rounded-lg text-zinc-500 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
								>
									<Trash2 size={15} />
								</button>
							</div>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}
</div>