<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { Plus, Pencil, Trash2, X, Loader2 } from '@lucide/svelte';
	import { m } from '$lib/paraglide/messages';
	import { ui } from '$lib/stores/ui.svelte';
	import originData from '$lib/data/origins.json';
	import TiptapEditor from '../products/TiptapEditor.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	interface OriginRow {
		id: string;
		name: string;
		flag: string;
	}

	const ORIGINS = originData as OriginRow[];

	const inputClass =
		'w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white';

	const LOCALE_DESCRIPTIONS = $derived([
		{ label: m.admin_distilleries_desc_es(), field: 'description' as const },
		{ label: m.admin_distilleries_desc_pt(), field: 'description_pt' as const },
		{ label: m.admin_distilleries_desc_en(), field: 'description_en' as const },
		{ label: m.admin_distilleries_desc_ja(), field: 'description_ja' as const },
		{ label: m.admin_distilleries_desc_fr(), field: 'description_fr' as const }
	]);

	let query = $state('');
	let form = $state<Partial<DistilleryForm> | null>(null);
	let editingId = $state<string | null>(null);
	let busy = $state(false);
	let error = $state('');

	interface DistilleryForm {
		id: string;
		slug: string | null;
		name: string;
		name_es: string | null;
		name_pt: string | null;
		name_en: string | null;
		name_ja: string | null;
		name_fr: string | null;
		description: string | null;
		description_es: string | null;
		description_pt: string | null;
		description_en: string | null;
		description_ja: string | null;
		description_fr: string | null;
		country: string | null;
		region: string | null;
		founded: number | null;
		image: string | null;
		website: string | null;
		latitude: number | null;
		longitude: number | null;
	}

	const filtered = $derived(
		data.distilleries.filter((d) =>
			`${d.name} ${d.country ?? ''} ${d.region ?? ''}`.toLowerCase().includes(query.trim().toLowerCase())
		)
	);

	const isNew = $derived(editingId === null);

	const countryOptions = $derived.by(() => {
		const known = new Set(ORIGINS.map((o) => o.id));
		const extra = form?.country && !known.has(form.country) ? [form.country] : [];
		return [...ORIGINS, ...extra.map((id) => ({ id, name: id, flag: '🌍' }))];
	});

	function openNew() {
		error = '';
		editingId = null;
		form = {
			id: '',
			slug: null,
			name: '',
			name_es: null,
			name_pt: null,
			name_en: null,
			name_ja: null,
			name_fr: null,
			description: null,
			description_es: null,
			description_pt: null,
			description_en: null,
			description_ja: null,
			description_fr: null,
			country: null,
			region: null,
			founded: null,
			image: null,
			website: null,
			latitude: null,
			longitude: null
		};
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	function openEdit(id: string) {
		error = '';
		editingId = id;
		const d = data.distilleries.find((x) => x.id === id);
		if (!d) return;
		form = {
			id: d.id,
			slug: d.slug,
			name: d.name,
			name_es: d.name_es,
			name_pt: d.name_pt,
			name_en: d.name_en,
			name_ja: d.name_ja,
			name_fr: d.name_fr,
			description: d.description,
			description_es: d.description_es,
			description_pt: d.description_pt,
			description_en: d.description_en,
			description_ja: d.description_ja,
			description_fr: d.description_fr,
			country: d.country,
			region: d.region,
			founded: d.founded,
			image: d.image,
			website: d.website,
			latitude: d.latitude,
			longitude: d.longitude
		};
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	async function save() {
		if (busy || !form) return;
		error = '';
		if (!form.name?.trim()) {
			error = m.admin_distilleries_name_required();
			return;
		}
		busy = true;
		try {
			const res = await fetch(
				isNew ? '/api/admin/distilleries' : `/api/admin/distilleries?id=${editingId}`,
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
				const msg = (body as { error?: string }).error ?? m.admin_distilleries_save_failed();
				error = msg;
				ui.showToast(msg, true);
				return;
			}
			form = null;
			ui.showToast(m.admin_distilleries_saved());
			await invalidateAll();
		} catch {
			error = m.admin_distilleries_network_error();
			ui.showToast(m.admin_distilleries_network_error(), true);
		} finally {
			busy = false;
		}
	}

	async function remove(id: string) {
		if (!confirm(m.admin_distilleries_confirm_delete())) return;
		const res = await fetch(`/api/admin/distilleries?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
		if (res.ok) {
			ui.showToast(m.admin_distilleries_deleted());
			await invalidateAll();
		} else {
			const body = await res.json().catch(() => ({}));
			ui.showToast(
				(body as { error?: string }).error === 'distillery_has_products'
					? m.admin_distilleries_delete_has_products()
					: m.error_generic(),
				true
			);
		}
	}
</script>

<svelte:head>
	<title>{m.admin_title()} — {m.admin_distilleries_title()}</title>
</svelte:head>

<div class="flex flex-wrap items-center justify-between gap-3">
	<div>
		<h1 class="font-display text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">{m.admin_distilleries_title()}</h1>
		<p class="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{m.admin_distilleries_count({ count: data.distilleries.length })}</p>
	</div>
	<div class="flex items-center gap-2">
		<input
			type="search"
			placeholder={m.admin_distilleries_search()}
			bind:value={query}
			class="{inputClass} w-44 sm:w-56"
		/>
		<button
			onclick={openNew}
			class="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
		>
			<Plus size={15} />
			{m.admin_distilleries_new()}
		</button>
	</div>
</div>

{#if form}
	<div class="mt-5 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
		<div class="flex items-center justify-between">
			<h2 class="font-display text-base font-semibold text-zinc-900 dark:text-white">
				{isNew ? m.admin_distilleries_new_title() : `${m.admin_distilleries_edit_title()} ${form.name ?? ''}`}
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
				<span class="mb-1 block font-medium text-zinc-600 dark:text-zinc-300">{m.admin_distilleries_slug()}</span>
				<input bind:value={form.id} disabled={!isNew} placeholder="slug" class="{inputClass} disabled:opacity-50" />
			</label>
			<label class="block text-sm">
				<span class="mb-1 block font-medium text-zinc-600 dark:text-zinc-300">{m.admin_distilleries_name()}</span>
				<input bind:value={form.name} placeholder={m.admin_distilleries_name()} class={inputClass} />
			</label>
			<label class="block text-sm">
				<span class="mb-1 block font-medium text-zinc-600 dark:text-zinc-300">{m.admin_distilleries_country()}</span>
				<select bind:value={form.country} class={inputClass}>
					<option value={null}>—</option>
					{#each countryOptions as o (o.id)}
						<option value={o.id}>{o.flag} {o.name}</option>
					{/each}
				</select>
			</label>
			<label class="block text-sm">
				<span class="mb-1 block font-medium text-zinc-600 dark:text-zinc-300">{m.admin_distilleries_region()}</span>
				<input bind:value={form.region} placeholder="Speyside" class={inputClass} />
			</label>
			<label class="block text-sm">
				<span class="mb-1 block font-medium text-zinc-600 dark:text-zinc-300">{m.admin_distilleries_founded()}</span>
				<input type="number" bind:value={form.founded} placeholder="1826" class={inputClass} />
			</label>
			<label class="block text-sm">
				<span class="mb-1 block font-medium text-zinc-600 dark:text-zinc-300">{m.admin_distilleries_image_url()}</span>
				<input bind:value={form.image} placeholder="https://…" class={inputClass} />
			</label>
			<label class="block text-sm">
				<span class="mb-1 block font-medium text-zinc-600 dark:text-zinc-300">{m.admin_distilleries_website()}</span>
				<input bind:value={form.website} placeholder="https://…" class={inputClass} />
			</label>
			<label class="block text-sm">
				<span class="mb-1 block font-medium text-zinc-600 dark:text-zinc-300">{m.admin_distilleries_latitude()}</span>
				<input type="number" step="any" bind:value={form.latitude} placeholder="-34.9" class={inputClass} />
			</label>
			<label class="block text-sm">
				<span class="mb-1 block font-medium text-zinc-600 dark:text-zinc-300">{m.admin_distilleries_longitude()}</span>
				<input type="number" step="any" bind:value={form.longitude} placeholder="-56.2" class={inputClass} />
			</label>
			<label class="block text-sm">
				<span class="mb-1 block font-medium text-zinc-600 dark:text-zinc-300">{m.admin_distilleries_name_es()}</span>
				<input bind:value={form.name_es} placeholder="Nombre" class={inputClass} />
			</label>
			<label class="block text-sm">
				<span class="mb-1 block font-medium text-zinc-600 dark:text-zinc-300">{m.admin_distilleries_name_pt()}</span>
				<input bind:value={form.name_pt} placeholder="Nome" class={inputClass} />
			</label>
			<label class="block text-sm">
				<span class="mb-1 block font-medium text-zinc-600 dark:text-zinc-300">{m.admin_distilleries_name_en()}</span>
				<input bind:value={form.name_en} placeholder="Name" class={inputClass} />
			</label>
			<label class="block text-sm">
				<span class="mb-1 block font-medium text-zinc-600 dark:text-zinc-300">{m.admin_distilleries_name_ja()}</span>
				<input bind:value={form.name_ja} placeholder="名前" class={inputClass} />
			</label>
			<label class="block text-sm">
				<span class="mb-1 block font-medium text-zinc-600 dark:text-zinc-300">{m.admin_distilleries_name_fr()}</span>
				<input bind:value={form.name_fr} placeholder="Nom" class={inputClass} />
			</label>
		</div>

		<div class="mt-4 flex flex-col gap-5">
			{#each LOCALE_DESCRIPTIONS as d (d.field)}
				<div>
					<span class="mb-1 block text-sm font-medium text-zinc-600 dark:text-zinc-300">{d.label}</span>
					<TiptapEditor
						value={form[d.field] ?? null}
						placeholder={m.admin_distilleries_desc_placeholder()}
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
				class="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-60 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
			>
				{#if busy}
					<Loader2 size={14} class="animate-spin" />
				{/if}
				{busy ? m.admin_distilleries_saving() : m.admin_distilleries_save()}
			</button>
			<button
				onclick={() => (form = null)}
				class="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
			>
				{m.admin_distilleries_cancel()}
			</button>
		</div>
	</div>
{/if}

<div class="mt-5 overflow-x-auto rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
	<table class="w-full min-w-[640px] text-left text-sm">
		<thead class="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
			<tr>
				<th class="px-4 py-3 font-medium">{m.admin_table_name()}</th>
				<th class="px-4 py-3 font-medium">{m.admin_table_country()}</th>
				<th class="px-4 py-3 font-medium">{m.admin_distilleries_region()}</th>
				<th class="px-4 py-3 text-right font-medium">{m.admin_table_founded()}</th>
				<th class="px-4 py-3 text-right font-medium">{m.admin_table_products()}</th>
				<th class="px-4 py-3 text-right font-medium">{m.admin_table_actions()}</th>
			</tr>
		</thead>
		<tbody class="divide-y divide-zinc-100 dark:divide-zinc-800">
			{#each filtered as d (d.id)}
				<tr class="text-zinc-800 dark:text-zinc-200">
					<td class="max-w-[220px] truncate px-4 py-2.5 font-medium">{d.name}</td>
					<td class="px-4 py-2.5 text-zinc-500 dark:text-zinc-400">{d.country ?? '—'}</td>
					<td class="max-w-[140px] truncate px-4 py-2.5 text-zinc-500 dark:text-zinc-400">{d.region ?? '—'}</td>
					<td class="px-4 py-2.5 text-right tabular-nums">{d.founded ?? '—'}</td>
					<td class="px-4 py-2.5 text-right tabular-nums">{d.product_count}</td>
					<td class="px-4 py-2.5">
						<div class="flex justify-end gap-1">
							<button
								onclick={() => openEdit(d.id)}
								title={m.admin_distilleries_edit()}
								class="grid h-8 w-8 place-items-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white"
							>
								<Pencil size={15} />
							</button>
							<button
								onclick={() => remove(d.id)}
								title={m.admin_distilleries_delete()}
								class="grid h-8 w-8 place-items-center rounded-lg text-zinc-500 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
							>
								<Trash2 size={15} />
							</button>
						</div>
					</td>
				</tr>
			{:else}
				<tr>
					<td colspan="6" class="px-4 py-8 text-center text-zinc-500 dark:text-zinc-400">{m.admin_distilleries_empty()}</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
