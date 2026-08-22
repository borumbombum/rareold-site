<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { getLocale, localizeHref } from '$lib/paraglide/runtime';
	import { m } from '$lib/paraglide/messages';
	import { ui } from '$lib/stores/ui.svelte';
	import { originSlug } from '$lib/utils/origins';
	import { Globe, Plus, Pencil, Trash2, X, Loader2, ExternalLink, ArrowUpDown } from '@lucide/svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const inputClass =
		'w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white';

	const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

	const LOCALE_FIELDS = [
		{ label: 'ES', field: 'name_es' },
		{ label: 'PT', field: 'name_pt' },
		{ label: 'EN', field: 'name_en' },
		{ label: 'JA', field: 'name_ja' },
		{ label: 'FR', field: 'name_fr' }
	] as const;

	type Origin = (typeof data.origins)[number];

	type Editing = {
		id: string;
		name: string;
		flag: string;
		sort_order: number;
		name_es: string;
		name_pt: string;
		name_en: string;
		name_ja: string;
		name_fr: string;
	};

	let editing = $state<Editing | null>(null);
	let isNew = $state(false);
	let busy = $state(false);
	let error = $state('');
	let sortKey = $state<'name' | 'sort_order' | 'product_count'>('sort_order');
	let sortAsc = $state(true);

	const origins = $derived(data.origins);

	const sorted = $derived.by(() => {
		const dir = sortAsc ? 1 : -1;
		return [...origins].sort((a, b) => {
			if (sortKey === 'name') return a.name.localeCompare(b.name) * dir;
			return ((a[sortKey] ?? 0) - (b[sortKey] ?? 0)) * dir;
		});
	});

	function toggleSort(key: 'name' | 'sort_order' | 'product_count') {
		if (sortKey === key) sortAsc = !sortAsc;
		else {
			sortKey = key;
			sortAsc = true;
		}
	}

	function emptyOrigin(): Editing {
		return { id: '', name: '', flag: '🌍', sort_order: 99, name_es: '', name_pt: '', name_en: '', name_ja: '', name_fr: '' };
	}

	function newOrigin() {
		isNew = true;
		error = '';
		editing = emptyOrigin();
	}

	function edit(o: Origin) {
		isNew = false;
		error = '';
		editing = {
			id: o.id,
			name: o.name,
			flag: o.flag || '',
			sort_order: o.sort_order,
			name_es: o.name_es ?? '',
			name_pt: o.name_pt ?? '',
			name_en: o.name_en ?? '',
			name_ja: o.name_ja ?? '',
			name_fr: o.name_fr ?? ''
		};
	}

	function close() {
		editing = null;
	}

	const canSave = $derived(
		Boolean(editing && SLUG_RE.test(editing.id) && editing.name.trim())
	);

	async function save() {
		if (!editing || !canSave) return;
		busy = true;
		error = '';
		try {
			const res = await fetch('/api/admin/origins', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(editing)
			});
			if (res.ok) {
				close();
				ui.showToast(m.admin_origins_saved());
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
		if (!confirm(m.admin_origins_delete_confirm())) return;
		const res = await fetch(`/api/admin/origins?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
		if (res.ok) {
			ui.showToast(m.admin_origins_deleted());
			await invalidateAll();
		} else if (res.status === 409) {
			const msg = await res.text();
			ui.showToast(msg.includes('products') ? m.admin_origins_in_use_products() : m.admin_origins_in_use(), true);
		} else {
			ui.showToast(m.error_generic(), true);
		}
	}

	function thClass(active: boolean): string {
		return `px-4 py-3 font-medium ${active ? 'text-zinc-900 dark:text-white' : ''}`;
	}
</script>

<svelte:head>
	<title>{m.admin_title()} — {m.admin_nav_origins()}</title>
</svelte:head>

<div class="flex flex-wrap items-center justify-between gap-3">
	<div>
		<h1 class="font-display text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">{m.admin_nav_origins()}</h1>
		<p class="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{m.admin_origins_count({ count: origins.length })}</p>
	</div>
	<button
		onclick={newOrigin}
		class="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
	>
		<Plus size={15} />
		{m.admin_origins_new()}
	</button>
</div>

{#if editing}
	<div class="mt-5 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
		<div class="flex items-center justify-between">
			<h2 class="font-display text-base font-semibold text-zinc-900 dark:text-white">
				{isNew ? m.admin_origins_new() : m.admin_origins_edit()}
			</h2>
			<button
				onclick={close}
				class="grid h-8 w-8 place-items-center rounded-full text-zinc-500 transition hover:bg-zinc-100 dark:hover:bg-zinc-800"
				aria-label={m.drawer_close()}
			>
				<X size={16} />
			</button>
		</div>

		<div class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-4">
			<label class="block text-sm">
				<span class="mb-1 block font-medium text-zinc-600 dark:text-zinc-300">ID</span>
				<input
					bind:value={editing.id}
					disabled={!isNew}
					placeholder="scotland"
					class="{inputClass} {SLUG_RE.test(editing.id) || !editing.id ? '' : 'border-red-400'}"
				/>
			</label>
			<label class="block text-sm md:col-span-2">
				<span class="mb-1 block font-medium text-zinc-600 dark:text-zinc-300">{m.admin_origins_name()}</span>
				<input bind:value={editing.name} placeholder="Scotland" class={inputClass} />
			</label>
			<label class="block text-sm">
				<span class="mb-1 block font-medium text-zinc-600 dark:text-zinc-300">{m.admin_origins_sort_order()}</span>
				<input type="number" bind:value={editing.sort_order} min="0" class={inputClass} />
			</label>
			<label class="block text-sm">
				<span class="mb-1 block font-medium text-zinc-600 dark:text-zinc-300">{m.admin_origins_flag()}</span>
				<span class="flex items-center gap-2">
					<input bind:value={editing.flag} maxlength="16" class={inputClass} />
					<span class="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-zinc-200 text-xl dark:border-zinc-700">
						{editing.flag || '🌍'}
					</span>
				</span>
			</label>
			{#each LOCALE_FIELDS as f (f.field)}
				<label class="block text-sm">
					<span class="mb-1 block font-medium text-zinc-600 dark:text-zinc-300">{m.admin_origins_name()} ({f.label})</span>
					<input bind:value={editing[f.field]} class={inputClass} placeholder={editing.name} />
				</label>
			{/each}
		</div>
		<p class="mt-3 text-xs text-zinc-400">{m.admin_origins_localized_hint()}</p>

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
	<table class="w-full min-w-[760px] text-left text-sm">
		<thead class="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
			<tr>
				<th class="px-4 py-3 font-medium">{m.admin_origins_flag()}</th>
				<th class="px-4 py-3 font-medium">ID</th>
				<th class={thClass(sortKey === 'name')}>
					<button onclick={() => toggleSort('name')} class="inline-flex items-center gap-1 uppercase tracking-wide hover:text-zinc-900 dark:hover:text-white">
						{m.admin_table_name()}
						<ArrowUpDown size={12} />
					</button>
				</th>
				<th class="px-4 py-3 font-medium">{m.admin_origins_translations()}</th>
				<th class={thClass(sortKey === 'sort_order')}>
					<button onclick={() => toggleSort('sort_order')} class="inline-flex items-center gap-1 uppercase tracking-wide hover:text-zinc-900 dark:hover:text-white">
						{m.admin_origins_sort_order()}
						<ArrowUpDown size={12} />
					</button>
				</th>
				<th class={thClass(sortKey === 'product_count')}>
					<button onclick={() => toggleSort('product_count')} class="inline-flex items-center gap-1 uppercase tracking-wide hover:text-zinc-900 dark:hover:text-white">
						<Globe size={12} />
						{m.admin_table_products()}
						<ArrowUpDown size={12} />
					</button>
				</th>
				<th class="px-4 py-3 text-right font-medium">{m.admin_table_actions()}</th>
			</tr>
		</thead>
		<tbody class="divide-y divide-zinc-100 dark:divide-zinc-800">
			{#each sorted as origin (origin.id)}
				<tr class="text-zinc-800 dark:text-zinc-200">
					<td class="px-4 py-2.5 text-xl">{origin.flag}</td>
					<td class="whitespace-nowrap px-4 py-2.5 font-mono text-xs">{origin.id}</td>
					<td class="max-w-[220px] truncate px-4 py-2.5 font-medium">{origin.name}</td>
					<td class="px-4 py-2.5">
						<div class="flex flex-wrap gap-1">
							{#each LOCALE_FIELDS as f (f.field)}
								{@const done = Boolean(origin[f.field]?.trim())}
								<span
									title={origin[f.field] ?? ''}
									class="rounded px-1 py-0.5 text-[10px] font-semibold {done
										? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
										: 'bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500'}"
								>
									{f.label}
								</span>
							{/each}
						</div>
					</td>
					<td class="px-4 py-2.5 tabular-nums">{origin.sort_order}</td>
					<td class="px-4 py-2.5 tabular-nums">{origin.product_count}</td>
					<td class="px-4 py-2.5">
						<div class="flex justify-end gap-1">
							<a
								href={localizeHref(`/origen/${originSlug(origin.id, getLocale())}`, { locale: getLocale() })}
								target="_blank"
								rel="noopener noreferrer"
								title={m.admin_pages_preview()}
								class="grid h-8 w-8 place-items-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white"
							>
								<ExternalLink size={15} />
							</a>
							<button
								onclick={() => edit(origin)}
								title={m.admin_pages_edit()}
								class="grid h-8 w-8 place-items-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white"
							>
								<Pencil size={15} />
							</button>
							<button
								onclick={() => remove(origin.id)}
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
