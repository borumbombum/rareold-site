<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { Plus, Pencil, Trash2, X, Loader2, Star, MonitorPlay, Camera, ExternalLink } from '@lucide/svelte';
	import { m } from '$lib/paraglide/messages';
	import { getLocale, localizeHref } from '$lib/paraglide/runtime';
	import { ui } from '$lib/stores/ui.svelte';
	import { LOCALE_CONFIG } from '$lib/utils/locales';
	import originData from '$lib/data/origins.json';
	import regionData from '$lib/data/regions.json';
	import distilleryData from '$lib/data/distilleries.json';
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
	interface DistilleryRow {
		id: string;
		name: string;
	}

	const ORIGINS = originData as OriginRow[];
	const REGIONS = regionData as RegionRow[];
	const DISTILLERIES = (distilleryData as DistilleryRow[]).slice().sort((a, b) => a.name.localeCompare(b.name));

	const inputClass =
		'w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white';

	const LOCALE_DESCRIPTIONS = $derived([
		{ label: m.admin_products_desc_es(), field: 'description' as const },
		{ label: m.admin_products_desc_pt(), field: 'description_pt' as const },
		{ label: m.admin_products_desc_en(), field: 'description_en' as const },
		{ label: m.admin_products_desc_ja(), field: 'description_ja' as const },
		{ label: m.admin_products_desc_fr(), field: 'description_fr' as const }
	]);

	let query = $state('');
	let form = $state<Partial<ProductForm> | null>(null);
	let editingId = $state<string | null>(null);
	let busy = $state(false);
	let error = $state('');

	interface ProductForm {
		id: string;
		name: string;
		description: string | null;
		image: string | null;
		origin_id: string | null;
		region_id: string | null;
		age: number | null;
		volume: string | null;
		abv: number | null;
		cask: string | null;
		distillery_id: string | null;
		featured: boolean;
		name_pt: string | null;
		description_pt: string | null;
		name_en: string | null;
		description_en: string | null;
		name_ja: string | null;
		description_ja: string | null;
		name_fr: string | null;
		description_fr: string | null;
	}

	const filtered = $derived(
		data.products.filter((p) =>
			`${p.name} ${p.distillery_name ?? ''}`.toLowerCase().includes(query.trim().toLowerCase())
		)
	);

	const isNew = $derived(editingId === null);

	interface AdminVideo {
		language: string;
		platform: 'youtube' | 'instagram';
		url: string;
		label: string;
	}

	const LANGS = Object.entries(LOCALE_CONFIG).map(([code, cfg]) => ({ code, ...cfg }));
	let videoLang = $state<string>('en');
	let videos = $state<AdminVideo[]>([]);
	let videosBusy = $state(false);
	let newVideoUrl = $state('');
	let newVideoLabel = $state('');
	let newVideoPlatform = $state<'youtube' | 'instagram'>('youtube');

	const langVideos = $derived(videos.filter((v) => v.language === videoLang));

	async function loadVideos(productId: string) {
		videosBusy = true;
		try {
			const res = await fetch(`/api/admin/videos?productId=${encodeURIComponent(productId)}`);
			videos = res.ok ? await res.json() : [];
		} catch {
			videos = [];
		} finally {
			videosBusy = false;
		}
	}

	async function addVideo() {
		if (!editingId || !newVideoUrl.trim()) return;
		videosBusy = true;
		try {
			const res = await fetch('/api/admin/videos', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					productId: editingId,
					language: videoLang,
					platform: newVideoPlatform,
					url: newVideoUrl.trim(),
					label: newVideoLabel.trim()
				})
			});
			if (res.ok) {
				newVideoUrl = '';
				newVideoLabel = '';
				ui.showToast(m.admin_products_saved());
				await loadVideos(editingId);
			} else {
				ui.showToast(m.admin_products_save_failed(), true);
			}
		} finally {
			videosBusy = false;
		}
	}

	async function removeVideo(url: string) {
		if (!editingId) return;
		const res = await fetch('/api/admin/videos', {
			method: 'DELETE',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ productId: editingId, language: videoLang, url })
		});
		if (res.ok) {
			ui.showToast(m.admin_products_deleted());
			await loadVideos(editingId);
		} else {
			ui.showToast(m.error_generic(), true);
		}
	}

	const regionsFor = (originId: string | null | undefined) =>
		REGIONS.filter((r) => r.origin_id === originId).sort((a, b) => a.name.localeCompare(b.name));

	function openNew() {
		error = '';
		editingId = null;
		form = {
			id: '',
			name: '',
			description: null,
			image: null,
			origin_id: null,
			region_id: null,
			age: null,
			volume: null,
			abv: null,
			cask: null,
			distillery_id: null,
			featured: false,
			name_pt: null,
			description_pt: null,
			name_en: null,
			description_en: null,
			name_ja: null,
			description_ja: null,
			name_fr: null,
			description_fr: null
		};
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	function openEdit(id: string) {
		error = '';
		editingId = id;
		const p = data.products.find((x) => x.id === id);
		if (!p) return;
		form = {
			id: p.id,
			name: p.name,
			description: p.description,
			image: p.image,
			origin_id: p.origin_id,
			region_id: p.region_id,
			age: p.age,
			volume: p.volume,
			abv: p.abv,
			cask: p.cask,
			distillery_id: p.distillery_id,
			featured: p.featured,
			name_pt: p.name_pt,
			description_pt: p.description_pt,
			name_en: p.name_en,
			description_en: p.description_en,
			name_ja: p.name_ja,
			description_ja: p.description_ja,
			name_fr: p.name_fr,
			description_fr: p.description_fr
		};
		window.scrollTo({ top: 0, behavior: 'smooth' });
		loadVideos(id);
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
				const msg = (body as { error?: string }).error ?? m.admin_products_save_failed();
				error = msg;
				ui.showToast(msg, true);
				return;
			}
			form = null;
			ui.showToast(m.admin_products_saved());
			await invalidateAll();
		} catch {
			error = m.admin_products_network_error();
			ui.showToast(m.admin_products_network_error(), true);
		} finally {
			busy = false;
		}
	}

	async function remove(id: string) {
		if (!confirm(m.admin_products_confirm_delete())) return;
		const res = await fetch(`/api/admin/products?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
		if (res.ok) {
			ui.showToast(m.admin_products_deleted());
			await invalidateAll();
		} else {
			ui.showToast(m.error_generic(), true);
		}
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
			<div class="flex items-center gap-2">
				<h2 class="font-display text-base font-semibold text-zinc-900 dark:text-white">
					{isNew ? m.admin_products_new_title() : `${m.admin_products_edit_title()} ${form.name ?? ''}`}
				</h2>
				{#if !isNew && form.id}
					<a
						href={localizeHref(`/whisky/${form.id}`, { locale: getLocale() })}
						target="_blank"
						rel="noopener noreferrer"
						title={m.admin_pages_preview()}
						class="grid h-8 w-8 place-items-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white"
					>
						<ExternalLink size={15} />
					</a>
				{/if}
			</div>
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
				<span class="mb-1 block font-medium text-zinc-600 dark:text-zinc-300">{m.admin_products_image_url()}</span>
				<input bind:value={form.image} placeholder="https://…" class={inputClass} />
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
				<span class="mb-1 block font-medium text-zinc-600 dark:text-zinc-300">{m.admin_products_distillery()}</span>
				<select bind:value={form.distillery_id} class={inputClass}>
					<option value={null}>—</option>
					{#each DISTILLERIES as d (d.id)}
						<option value={d.id}>{d.name}</option>
					{/each}
				</select>
			</label>
			<label class="flex items-center gap-3 text-sm md:col-span-2">
				<input type="checkbox" bind:checked={form.featured} class="h-4 w-4 rounded border-zinc-300 text-zinc-900 accent-zinc-900 dark:border-zinc-600 dark:accent-white" />
				<span class="font-medium text-zinc-600 dark:text-zinc-300">⭐ {m.admin_products_featured()}</span>
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
			<label class="block text-sm">
				<span class="mb-1 block font-medium text-zinc-600 dark:text-zinc-300">{m.admin_products_name_fr()}</span>
				<input bind:value={form.name_fr} placeholder="Nom" class={inputClass} />
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

		{#if !isNew}
			<div class="mt-6 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
				<div class="flex flex-wrap items-center justify-between gap-2">
					<h3 class="font-display text-sm font-semibold text-zinc-900 dark:text-white">{m.admin_videos_title()}</h3>
					<select bind:value={videoLang} class="{inputClass} w-auto">
						{#each LANGS as l (l.code)}
							<option value={l.code}>{l.flag} {l.label}</option>
						{/each}
					</select>
				</div>

				<ul class="mt-3 divide-y divide-zinc-100 dark:divide-zinc-800">
					{#each langVideos as v (v.url)}
						<li class="flex items-center gap-2 py-2 text-sm">
							{#if v.platform === 'youtube'}
								<MonitorPlay size={15} class="shrink-0 text-red-600" />
							{:else}
								<Camera size={15} class="shrink-0 text-pink-500" />
							{/if}
							<a href={v.url} target="_blank" rel="noopener noreferrer" class="min-w-0 flex-1 truncate text-zinc-700 hover:underline dark:text-zinc-300">
								{v.label || v.url}
							</a>
							<span class="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] uppercase text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">{v.language}</span>
							<button
								onclick={() => removeVideo(v.url)}
								class="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-zinc-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
								title={m.admin_products_delete()}
							>
								<Trash2 size={14} />
							</button>
						</li>
					{:else}
						<li class="py-2 text-sm text-zinc-500 dark:text-zinc-400">{m.admin_videos_none()}</li>
					{/each}
				</ul>

				<div class="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-[auto_1fr_1fr_auto]">
					<select bind:value={newVideoPlatform} class={inputClass}>
						<option value="youtube">YouTube</option>
						<option value="instagram">Instagram</option>
					</select>
					<input bind:value={newVideoUrl} placeholder={m.admin_videos_url()} class={inputClass} />
					<input bind:value={newVideoLabel} placeholder={m.admin_videos_label()} class={inputClass} />
					<button
						onclick={addVideo}
						disabled={videosBusy || !newVideoUrl.trim()}
						class="inline-flex items-center justify-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-60 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
					>
						<Plus size={14} />
						{m.admin_videos_add()}
					</button>
				</div>
			</div>
		{/if}

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
	<table class="w-full min-w-[760px] text-left text-sm">
		<thead class="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
			<tr>
				<th class="px-4 py-3 font-medium">{m.admin_table_name()}</th>
				<th class="px-4 py-3 font-medium">{m.admin_table_distillery()}</th>
				<th class="px-4 py-3 font-medium">{m.admin_table_origin()}</th>
				<th class="px-4 py-3 text-right font-medium">{m.admin_table_score()}</th>
				<th class="px-4 py-3 text-right font-medium">{m.admin_table_reviews()}</th>
				<th class="px-4 py-3 text-right font-medium">{m.admin_table_actions()}</th>
			</tr>
		</thead>
		<tbody class="divide-y divide-zinc-100 dark:divide-zinc-800">
			{#each filtered as p (p.id)}
				<tr class="text-zinc-800 dark:text-zinc-200">
					<td class="max-w-[220px] truncate px-4 py-2.5 font-medium">
						{p.name}
						{#if p.featured}
							<Star size={12} class="mb-0.5 ml-1 inline fill-amber-400 text-amber-400" aria-label={m.admin_products_featured()} />
						{/if}
					</td>
						<td class="max-w-[180px] truncate px-4 py-2.5 text-zinc-500 dark:text-zinc-400">{p.distillery_name ?? '—'}</td>
					<td class="px-4 py-2.5 text-zinc-500 dark:text-zinc-400">{p.origin_id ?? '—'}</td>
				<td class="px-4 py-2.5 text-right tabular-nums">
					{#if p.avg_rating > 0}
						<span class="inline-flex items-center gap-1"><Star size={12} class="fill-amber-400 text-amber-400" />{p.avg_rating}</span>
					{:else}
						—
					{/if}
				</td>
				<td class="px-4 py-2.5 text-right tabular-nums">{p.review_count || '—'}</td>
					<td class="px-4 py-2.5">
						<div class="flex justify-end gap-1">
							<a
								href={localizeHref(`/whisky/${p.id}`, { locale: getLocale() })}
								target="_blank"
								rel="noopener noreferrer"
								title={m.admin_pages_preview()}
								class="grid h-8 w-8 place-items-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white"
							>
								<ExternalLink size={15} />
							</a>
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
