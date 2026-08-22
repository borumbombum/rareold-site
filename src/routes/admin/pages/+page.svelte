<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { localizeHref } from '$lib/paraglide/runtime';
	import { getLocale } from '$lib/paraglide/runtime';
	import { m } from '$lib/paraglide/messages';
	import { ui } from '$lib/stores/ui.svelte';
	import { Plus, Pencil, Trash2, X, Loader2, ExternalLink } from '@lucide/svelte';
	import TiptapEditor from '../products/TiptapEditor.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const inputClass =
		'w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white';

	const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

	const LOCALE_FIELDS = [
		{ label: 'ES', title: 'title', body: 'body' },
		{ label: 'PT', title: 'title_pt', body: 'body_pt' },
		{ label: 'EN', title: 'title_en', body: 'body_en' },
		{ label: 'JA', title: 'title_ja', body: 'body_ja' },
		{ label: 'FR', title: 'title_fr', body: 'body_fr' }
	] as const;

	type Editing = Record<(typeof LOCALE_FIELDS)[number]['title'] | (typeof LOCALE_FIELDS)[number]['body'], string> & {
		id: string;
		slug: string;
	};

	let editing = $state<Editing | null>(null);
	let isNew = $state(false);
	let busy = $state(false);
	let error = $state('');

	const pages = $derived(data.pages);

	function emptyPage(): Editing {
		return {
			id: crypto.randomUUID(),
			slug: '',
			title: '',
			body: '',
			title_pt: '',
			body_pt: '',
			title_en: '',
			body_en: '',
			title_ja: '',
			body_ja: '',
			title_fr: '',
			body_fr: ''
		};
	}

	function newPage() {
		isNew = true;
		error = '';
		editing = emptyPage();
	}

	function edit(p: (typeof pages)[number]) {
		isNew = false;
		error = '';
		editing = {
			id: p.id,
			slug: p.slug,
			title: p.title ?? '',
			body: p.body ?? '',
			title_pt: p.title_pt ?? '',
			body_pt: p.body_pt ?? '',
			title_en: p.title_en ?? '',
			body_en: p.body_en ?? '',
			title_ja: p.title_ja ?? '',
			body_ja: p.body_ja ?? '',
			title_fr: p.title_fr ?? '',
			body_fr: p.body_fr ?? ''
		};
	}

	function close() {
		editing = null;
	}

	function wordCount(html: string): number {
		return html.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).filter(Boolean).length;
	}

	function localeDone(p: (typeof pages)[number], f: (typeof LOCALE_FIELDS)[number]): boolean {
		return Boolean((p[f.title] ?? '').trim() && (p[f.body] ?? '').trim());
	}

	const canSave = $derived(
		Boolean(editing && SLUG_RE.test(editing.slug) && editing.title.trim() && editing.body.trim())
	);

	async function save() {
		if (!editing || !canSave) return;
		busy = true;
		error = '';
		try {
			const res = await fetch('/api/admin/pages', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(editing)
			});
			if (res.ok) {
				close();
				ui.showToast(m.admin_pages_saved());
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
		if (!confirm('Delete page?')) return;
		const res = await fetch(`/api/admin/pages?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
		if (res.ok) {
			ui.showToast(m.admin_pages_deleted());
			await invalidateAll();
		} else {
			ui.showToast(m.error_generic(), true);
		}
	}
</script>

<svelte:head>
	<title>{m.admin_title()} — {m.admin_nav_pages()}</title>
</svelte:head>

<div class="flex flex-wrap items-center justify-between gap-3">
	<div>
		<h1 class="font-display text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">{m.admin_nav_pages()}</h1>
		<p class="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{m.admin_pages_count({ count: pages.length })}</p>
	</div>
	<button
		onclick={newPage}
		class="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
	>
		<Plus size={15} />
		{m.admin_pages_new()}
	</button>
</div>

{#if editing}
	<div class="mt-5 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
		<div class="flex items-center justify-between">
			<h2 class="font-display text-base font-semibold text-zinc-900 dark:text-white">
				{isNew ? m.admin_pages_new() : m.admin_pages_edit()}
			</h2>
			<div class="flex items-center gap-1">
				{#if !isNew && editing.slug}
					<a
						href={localizeHref(`/${editing.slug}`, { locale: getLocale() })}
						target="_blank"
						rel="noopener noreferrer"
						title={m.admin_pages_preview()}
						class="grid h-8 w-8 place-items-center rounded-full text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white"
					>
						<ExternalLink size={15} />
					</a>
				{/if}
				<button
					onclick={close}
					class="grid h-8 w-8 place-items-center rounded-full text-zinc-500 transition hover:bg-zinc-100 dark:hover:bg-zinc-800"
					aria-label={m.drawer_close()}
				>
					<X size={16} />
				</button>
			</div>
		</div>

		<div class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
			<label class="block text-sm md:col-span-3">
				<span class="mb-1 block font-medium text-zinc-600 dark:text-zinc-300">Slug</span>
				<input bind:value={editing.slug} placeholder="about" class="{inputClass} {SLUG_RE.test(editing.slug) || !editing.slug ? '' : 'border-red-400'}" />
				<span class="mt-1 block text-xs text-zinc-400">{m.admin_pages_slug_hint()}</span>
			</label>
			{#each LOCALE_FIELDS as f (f.label)}
				<label class="block text-sm">
					<span class="mb-1 block font-medium text-zinc-600 dark:text-zinc-300">{m.admin_pages_title()} ({f.label})</span>
					<input bind:value={editing[f.title]} class={inputClass} />
				</label>
			{/each}
		</div>

		<div class="mt-4 flex flex-col gap-5">
			{#each LOCALE_FIELDS as f (f.label)}
				<div>
					<span class="mb-1 block text-sm font-medium text-zinc-600 dark:text-zinc-300">{m.admin_pages_body()} ({f.label})</span>
					<TiptapEditor
						value={editing[f.body] || null}
						placeholder={m.admin_pages_body()}
						onchange={(html) => {
							if (editing) editing[f.body] = html;
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
	<table class="w-full min-w-[720px] text-left text-sm">
		<thead class="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
			<tr>
				<th class="px-4 py-3 font-medium">{m.admin_table_name()}</th>
				<th class="px-4 py-3 font-medium">Locales</th>
				<th class="px-4 py-3 text-right font-medium">{m.admin_table_words()}</th>
				<th class="px-4 py-3 font-medium">{m.admin_table_updated()}</th>
				<th class="px-4 py-3 text-right font-medium">{m.admin_table_actions()}</th>
			</tr>
		</thead>
		<tbody class="divide-y divide-zinc-100 dark:divide-zinc-800">
			{#each pages as page (page.id)}
				<tr class="text-zinc-800 dark:text-zinc-200">
					<td class="max-w-[260px] px-4 py-2.5">
						<p class="truncate font-medium">/{page.slug}</p>
						<p class="truncate text-xs text-zinc-500 dark:text-zinc-400">{page.title}</p>
					</td>
					<td class="px-4 py-2.5">
						<div class="flex flex-wrap gap-1">
							{#each LOCALE_FIELDS as f (f.label)}
								<span
									class="rounded px-1 py-0.5 text-[10px] font-semibold {localeDone(page, f)
										? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
										: 'bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500'}"
								>
									{f.label}
								</span>
							{/each}
						</div>
					</td>
					<td class="px-4 py-2.5 text-right tabular-nums">{wordCount(page.body)}</td>
					<td class="whitespace-nowrap px-4 py-2.5 text-zinc-500 dark:text-zinc-400">
						{page.updated_at.slice(0, 10)}
					</td>
					<td class="px-4 py-2.5">
						<div class="flex justify-end gap-1">
							<a
								href={localizeHref(`/${page.slug}`, { locale: getLocale() })}
								target="_blank"
								rel="noopener noreferrer"
								title={m.admin_pages_preview()}
								class="grid h-8 w-8 place-items-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white"
							>
								<ExternalLink size={15} />
							</a>
							<button
								onclick={() => edit(page)}
								title={m.admin_pages_edit()}
								class="grid h-8 w-8 place-items-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white"
							>
								<Pencil size={15} />
							</button>
							<button
								onclick={() => remove(page.id)}
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
					<td colspan="5" class="px-4 py-8 text-center text-zinc-500 dark:text-zinc-400">—</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
