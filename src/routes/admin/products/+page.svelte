<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { Plus, Pencil, Trash2, X } from '@lucide/svelte';
	import { m } from '$lib/paraglide/messages';
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

	const LOCALE_DESCRIPTIONS = $derived([
		{ label: m.admin_products_desc_es(), field: 'description' as const },
		{ label: m.admin_products_desc_pt(), field: 'description_pt' as const },
		{ label: m.admin_products_desc_en(), field: 'description_en' as const },
		{ label: m.admin_products_desc_ja(), field: 'description_ja' as const }
	]);

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
		name_en: string | null;
		description_en: string | null;
		name_ja: string | null;
		description_ja: string | null;
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
			description_pt: null,
			name_en: null,
			description_en: null,
			name_ja: null,
			description_ja: null
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
			description_pt: p.description_pt,
			name_en: p.name_en,
			description_en: p.description_en,
			name_ja: p.name_ja,
			description_ja: p.description_ja
		};
	}

	async function save() {
		if (busy || !form) return;
		error = '';
		if (!form.name?.trim()) {
			error = m.admin_products_name_required();
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
				error = (body as { error?: string }).error ?? m.admin_products_save_failed();
				return;
			}
			form = null;
			await invalidateAll();
		} catch {
			error = m.admin_products_network_error();
		} finally {
			busy = false;
		}
	}

	async function remove(id: string) {
		if (!confirm(m.admin_products_confirm_delete())) return;
		const res = await fetch(`/api/admin/products?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
		if (res.ok) await invalidateAll();
	}
</script>

<svelte:head>
	<title>{m.admin_title()} — {m.admin_products_title()}</title>
</svelte:head>

<div class="flex flex-wrap items-center justify-between gap-3">
	<div>
		<h1 class="font-display text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">{m.admin_products_title()}</h1>
		<p class="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{m.admin_products_count({ count: data.products.length })}</p>
	</div>
	<div class="flex items-center gap-2">
		<input
			type="search"
			placeholder={m.admin_products_search()}
			bind:value={query}
			class="{inputClass} w-44 sm:w-56"
		/>
		<button
			onclick={openNew}
			class="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
		>
			<Plus size={15} />
			{m.admin_products_new()}
		</button>
	</div>
</div>

{#if form}
	<div class="mt-5 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
		<div class="flex items-center justify-between">
			<h2 class="font-display text-base font-semibold text-zinc-900 dark:text-white">
				{isNew ? m.admin_products_new_title() : `${m.admin_products_edit_title()} ${form.name ?? ''}`}
			</h2>
			<button
				onclick={() => (form = null)}
				class="grid h-8 w-8 place-items-center rounded-full text-zinc-500 transition hover:bg-zinc-100 dark:hover:bg-zinc-800"
				aria-label={m.drawer_close()}
			>
				<X size={16} />
			</button>
		</div>

		<div class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
			<label class="block text-sm">
				<span class="mb-1 block font-medium text-zinc-600 dark:text-zinc-300">{m.admin_products_slug()}</span>
				<input bind:value={form.id} disabled={!isNew} placeholder="slug" class="{inputClass} disabled:opacity-50" />
			</label>
			<label class="block text-sm">
				<span class="mb-1 block font-medium text-zinc-600 dark:text-zinc-300">{m.admin_products_name()}</span>
				<input bind:value={form.name} placeholder={m.admin_products_name()} class={inputClass} />
			</label>
			<label class="block text-sm">
				<span class="mb-1 block font-medium text-zinc-600 dark:text-zinc-300">{m.admin_products_brand()}</span>
				<input bind:value={form.brand} placeholder={m.admin_products_brand()} class={inputClass} />
			</label>
			<label class="block text-sm">
				<span class="mb-1 block font-medium text-zinc-600 dark:text-zinc-300">{m.admin_products_image_url()}</span>
				<input bind:value={form.image} placeholder="https://…" class={inputClass} />
			</label>
			<label class="block text-sm">
				<span class="mb-1 block font-medium text-zinc-600 dark:text-zinc-300">{m.admin_products_video_url()}</span>
				<input bind:value={form.video} placeholder="https://…" class={inputClass} />
			</label>
			<label class="block text-sm">
				<span class="mb-1 block font-medium text-zinc-600 dark:text-zinc-300">{m.admin_products_origin()}</span>
				<select bind:value={form.origin_id} class={inputClass}>
					<option value={null}>—</option>
					{#each ORIGINS as o (o.id)}
						<option value={o.id}>{o.flag} {o.name}</option>
					{/each}
				</select>
			</label>
			<label class="block text-sm">
				<span class="mb-1 block font-medium text-zinc-600 dark:text-zinc-300">{m.admin_products_region()}</span>
				<select bind:value={form.region_id} class={inputClass}>
					<option value={null}>—</option>
					{#each regionsFor(form.origin_id) as r (r.id)}
						<option value={r.id}>{r.name}</option>
					{/each}
				</select>
			</label>
			<label class="block text-sm">
				<span class="mb-1 block font-medium text-zinc-600 dark:text-zinc-300">{m.admin_products_age()}</span>
				<input type="number" bind:value={form.age} placeholder="12" class={inputClass} />
			</label>
			<label class="block text-sm">
				<span class="mb-1 block font-medium text-zinc-600 dark:text-zinc-300">{m.admin_products_volume()}</span>
				<input bind:value={form.volume} placeholder="700 ml" class={inputClass} />
			</label>
			<label class="block text-sm">
				<span class="mb-1 block font-medium text-zinc-600 dark:text-zinc-300">{m.admin_products_abv()}</span>
				<input type="number" step="0.1" bind:value={form.abv} placeholder="43" class={inputClass} />
			</label>
			<label class="block text-sm">
				<span class="mb-1 block font-medium text-zinc-600 dark:text-zinc-300">{m.admin_products_cask()}</span>
				<input bind:value={form.cask} placeholder="Ex-Bourbon" class={inputClass} />
			</label>
			<label class="block text-sm">
				<span class="mb-1 block font-medium text-zinc-600 dark:text-zinc-300">{m.admin_products_name_en()}</span>
				<input bind:value={form.name_en} placeholder="Name" class={inputClass} />
			</label>
			<label class="block text-sm">
				<span class="mb-1 block font-medium text-zinc-600 dark:text-zinc-300">{m.admin_products_name_pt()}</span>
				<input bind:value={form.name_pt} placeholder="Nome" class={inputClass} />
			</label>
			<label class="block text-sm">
				<span class="mb-1 block font-medium text-zinc-600 dark:text-zinc-300">{m.admin_products_name_ja()}</span>
				<input bind:value={form.name_ja} placeholder="名前" class={inputClass} />
			</label>
		</div>

		<div class="mt-4 flex flex-col gap-5">
			{#each LOCALE_DESCRIPTIONS as d (d.field)}
				<div>
					<span class="mb-1 block text-sm font-medium text-zinc-600 dark:text-zinc-300">{d.label}</span>
					<TiptapEditor
						value={form[d.field] ?? null}
						placeholder={m.admin_products_desc_placeholder()}
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
				{busy ? m.admin_products_saving() : m.admin_products_save()}
			</button>
			<button
				onclick={() => (form = null)}
				class="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
			>
				{m.admin_products_cancel()}
			</button>
		</div>
	</div>
{/if}

<div class="mt-5 overflow-x-auto rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
	<table class="w-full min-w-[640px] text-left text-sm">
		<thead class="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
			<tr>
				<th class="px-4 py-3 font-medium">{m.admin_table_name()}</th>
				<th class="px-4 py-3 font-medium">{m.admin_table_brand()}</th>
				<th class="px-4 py-3 font-medium">{m.admin_table_origin()}</th>
				<th class="px-4 py-3 text-right font-medium">{m.admin_table_karma()}</th>
				<th class="px-4 py-3 text-right font-medium">{m.admin_table_votes()}</th>
				<th class="px-4 py-3 text-right font-medium">{m.admin_table_actions()}</th>
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
								title={m.admin_products_edit()}
								class="grid h-8 w-8 place-items-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white"
							>
								<Pencil size={15} />
							</button>
							<button
								onclick={() => remove(p.id)}
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
					<td colspan="6" class="px-4 py-8 text-center text-zinc-500 dark:text-zinc-400">{m.admin_products_empty()}</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
