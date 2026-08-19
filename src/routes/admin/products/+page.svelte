<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { Plus, Pencil, Trash2, X } from '@lucide/svelte';
	import originData from '$lib/data/origins.json';
	import regionData from '$lib/data/regions.json';
	import TiptapEditor from './TiptapEditor.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	interface OriginRow {
		id: string;
		name: string;
		flag: string;
	}
	interface RegionRow {
		id: string;
		origin_id: string;
		name: string;
	}

	const ORIGINS = originData as OriginRow[];
	const REGIONS = regionData as RegionRow[];

	const inputClass =
		'w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white';

	const LOCALE_DESCRIPTIONS = [
		{ label: 'Descripción (ES)', field: 'description' },
		{ label: 'Descrição (PT)', field: 'description_pt' }
	] as const;

	let query = $state('');
	let form = $state<Partial<ProductForm> | null>(null);
	let busy = $state(false);
	let error = $state('');

	interface ProductForm {
		id: string;
		name: string;
		brand: string;
		description: string | null;
		image: string | null;
		video: string | null;
		origin_id: string | null;
		region_id: string | null;
		age: number | null;
		volume: string | null;
		abv: number | null;
		cask: string | null;
		name_pt: string | null;
		description_pt: string | null;
	}

	const filtered = $derived(
		data.products.filter((p) =>
			`${p.name} ${p.brand}`.toLowerCase().includes(query.trim().toLowerCase())
		)
	);

	const isNew = $derived(form && !form.id);
	const editingId = $derived((form?.id as string) ?? null);

	const regionsFor = (originId: string | null | undefined) =>
		REGIONS.filter((r) => r.origin_id === originId).sort((a, b) => a.name.localeCompare(b.name));

	function openNew() {
		error = '';
		form = {
			id: '',
			name: '',
			brand: '',
			description: null,
			image: null,
			video: null,
			origin_id: null,
			region_id: null,
			age: null,
			volume: null,
			abv: null,
			cask: null,
			name_pt: null,
			description_pt: null
		};
	}

	function openEdit(id: string) {
		error = '';
		const p = data.products.find((x) => x.id === id);
		if (!p) return;
		form = {
			id: p.id,
			name: p.name,
			brand: p.brand,
			description: p.description,
			image: p.image,
			video: p.video,
			origin_id: p.origin_id,
			region_id: p.region_id,
			age: p.age,
			volume: p.volume,
			abv: p.abv,
			cask: p.cask,
			name_pt: p.name_pt,
			description_pt: p.description_pt
		};
	}

	async function save() {
		if (busy || !form) return;
		error = '';
		if (!form.name?.trim()) {
			error = 'Name is required.';
			return;
		}
		busy = true;
		try {
			const res = await fetch(
				isNew ? '/api/admin/products' : `/api/admin/products?id=${editingId}`,
				{
					method: isNew ? 'POST' : 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						...form,
						id: (form.id ?? '').trim() || undefined,
						name: form.name.trim()
					})
				}
			);
			if (!res.ok) {
				const body = await res.json().catch(() => ({}));
				error = (body as { error?: string }).error ?? 'Save failed.';
				return;
			}
			form = null;
			await invalidateAll();
		} catch {
			error = 'Network error.';
		} finally {
			busy = false;
		}
	}

	async function remove(id: string) {
		if (!confirm('Delete this product?')) return;
		const res = await fetch(`/api/admin/products?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
		if (res.ok) await invalidateAll();
	}
</script>

<svelte:head>
	<title>Admin — Products</title>
</svelte:head>

<div class="flex flex-wrap items-center justify-between gap-3">
	<div>
		<h1 class="font-display text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">Products</h1>
		<p class="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{data.products.length} in catalog</p>
	</div>
	<div class="flex items-center gap-2">
		<input
			type="search"
			placeholder="Search…"
			bind:value={query}
			class="{inputClass} w-44 sm:w-56"
		/>
		<button
			onclick={openNew}
			class="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
		>
			<Plus size={15} />
			New
		</button>
	</div>
</div>

{#if form}
	<div class="mt-5 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
		<div class="flex items-center justify-between">
			<h2 class="font-display text-base font-semibold text-zinc-900 dark:text-white">
				{isNew ? 'New product' : `Edit: ${form.name ?? ''}`}
			</h2>
			<button
				onclick={() => (form = null)}
				class="grid h-8 w-8 place-items-center rounded-full text-zinc-500 transition hover:bg-zinc-100 dark:hover:bg-zinc-800"
				aria-label="Close"
			>
				<X size={16} />
			</button>
		</div>

		<div class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
			<label class="block text-sm">
				<span class="mb-1 block font-medium text-zinc-600 dark:text-zinc-300">Slug (id)</span>
				<input bind:value={form.id} disabled={!isNew} placeholder="slug" class="{inputClass} disabled:opacity-50" />
			</label>
			<label class="block text-sm">
				<span class="mb-1 block font-medium text-zinc-600 dark:text-zinc-300">Name *</span>
				<input bind:value={form.name} placeholder="Name" class={inputClass} />
			</label>
			<label class="block text-sm">
				<span class="mb-1 block font-medium text-zinc-600 dark:text-zinc-300">Brand</span>
				<input bind:value={form.brand} placeholder="Brand" class={inputClass} />
			</label>
			<label class="block text-sm">
				<span class="mb-1 block font-medium text-zinc-600 dark:text-zinc-300">Image URL</span>
				<input bind:value={form.image} placeholder="https://…" class={inputClass} />
			</label>
			<label class="block text-sm">
				<span class="mb-1 block font-medium text-zinc-600 dark:text-zinc-300">Video URL</span>
				<input bind:value={form.video} placeholder="https://…" class={inputClass} />
			</label>
			<label class="block text-sm">
				<span class="mb-1 block font-medium text-zinc-600 dark:text-zinc-300">Origin</span>
				<select bind:value={form.origin_id} class={inputClass}>
					<option value={null}>—</option>
					{#each ORIGINS as o (o.id)}
						<option value={o.id}>{o.flag} {o.name}</option>
					{/each}
				</select>
			</label>
			<label class="block text-sm">
				<span class="mb-1 block font-medium text-zinc-600 dark:text-zinc-300">Region</span>
				<select bind:value={form.region_id} class={inputClass}>
					<option value={null}>—</option>
					{#each regionsFor(form.origin_id) as r (r.id)}
						<option value={r.id}>{r.name}</option>
					{/each}
				</select>
			</label>
			<label class="block text-sm">
				<span class="mb-1 block font-medium text-zinc-600 dark:text-zinc-300">Age</span>
				<input type="number" bind:value={form.age} placeholder="12" class={inputClass} />
			</label>
			<label class="block text-sm">
				<span class="mb-1 block font-medium text-zinc-600 dark:text-zinc-300">Volume</span>
				<input bind:value={form.volume} placeholder="700 ml" class={inputClass} />
			</label>
			<label class="block text-sm">
				<span class="mb-1 block font-medium text-zinc-600 dark:text-zinc-300">ABV</span>
				<input type="number" step="0.1" bind:value={form.abv} placeholder="43" class={inputClass} />
			</label>
			<label class="block text-sm">
				<span class="mb-1 block font-medium text-zinc-600 dark:text-zinc-300">Cask</span>
				<input bind:value={form.cask} placeholder="Ex-Bourbon" class={inputClass} />
			</label>
			<label class="block text-sm">
				<span class="mb-1 block font-medium text-zinc-600 dark:text-zinc-300">Name (PT)</span>
				<input bind:value={form.name_pt} placeholder="Nome" class={inputClass} />
			</label>
		</div>

		<div class="mt-4 flex flex-col gap-5">
			{#each LOCALE_DESCRIPTIONS as d (d.field)}
				<div>
					<span class="mb-1 block text-sm font-medium text-zinc-600 dark:text-zinc-300">{d.label}</span>
					<TiptapEditor
						value={form[d.field] ?? null}
						placeholder="Write the description…"
						onchange={(html) => {
							if (form) form[d.field] = html;
						}}
					/>
				</div>
			{/each}
		</div>

		{#if error}
			<p class="mt-4 text-sm font-medium text-red-600 dark:text-red-400">{error}</p>
		{/if}

		<div class="mt-5 flex items-center gap-2">
			<button
				onclick={save}
				disabled={busy}
				class="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-60 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
			>
				{busy ? 'Saving…' : 'Save'}
			</button>
			<button
				onclick={() => (form = null)}
				class="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
			>
				Cancel
			</button>
		</div>
	</div>
{/if}

<div class="mt-5 overflow-x-auto rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
	<table class="w-full min-w-[640px] text-left text-sm">
		<thead class="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
			<tr>
				<th class="px-4 py-3 font-medium">Name</th>
				<th class="px-4 py-3 font-medium">Brand</th>
				<th class="px-4 py-3 font-medium">Origin</th>
				<th class="px-4 py-3 text-right font-medium">Karma</th>
				<th class="px-4 py-3 text-right font-medium">Votes</th>
				<th class="px-4 py-3 text-right font-medium">Actions</th>
			</tr>
		</thead>
		<tbody class="divide-y divide-zinc-100 dark:divide-zinc-800">
			{#each filtered as p (p.id)}
				<tr class="text-zinc-800 dark:text-zinc-200">
					<td class="max-w-[220px] truncate px-4 py-2.5 font-medium">{p.name}</td>
					<td class="max-w-[160px] truncate px-4 py-2.5 text-zinc-500 dark:text-zinc-400">{p.brand}</td>
					<td class="px-4 py-2.5 text-zinc-500 dark:text-zinc-400">{p.origin_id ?? '—'}</td>
					<td class="px-4 py-2.5 text-right tabular-nums">{p.karma}</td>
					<td class="px-4 py-2.5 text-right tabular-nums">{p.vote_count}</td>
					<td class="px-4 py-2.5">
						<div class="flex justify-end gap-1">
							<button
								onclick={() => openEdit(p.id)}
								title="Edit"
								class="grid h-8 w-8 place-items-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white"
							>
								<Pencil size={15} />
							</button>
							<button
								onclick={() => remove(p.id)}
								title="Delete"
								class="grid h-8 w-8 place-items-center rounded-lg text-zinc-500 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
							>
								<Trash2 size={15} />
							</button>
						</div>
					</td>
				</tr>
			{:else}
				<tr>
					<td colspan="6" class="px-4 py-8 text-center text-zinc-500 dark:text-zinc-400">No products found.</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
