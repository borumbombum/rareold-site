<script lang="ts">
	import { goto } from '$app/navigation';
	import { localizeHref } from '$lib/paraglide/runtime';
	import { m } from '$lib/paraglide/messages';
	import { getLocale } from '$lib/paraglide/runtime';
	import { ui } from '$lib/stores/ui.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let pages = $state(data.pages);
	let editing = $state<any>(null);
	let saving = $state(false);

	function newPage() {
		editing = { id: crypto.randomUUID(), slug: '', title: '', body: '', title_pt: '', body_pt: '', title_en: '', body_en: '', title_ja: '', body_ja: '', title_fr: '', body_fr: '' };
	}

	function edit(p: any) {
		editing = { ...p };
	}

	async function save() {
		if (!editing?.slug) return;
		saving = true;
		try {
			const res = await fetch('/api/admin/pages', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(editing)
			});
			if (res.ok) {
				editing = null;
				ui.showToast(m.admin_pages_saved());
				goto(localizeHref('/admin/pages', { locale: getLocale() }));
			} else {
				ui.showToast(m.error_generic(), true);
			}
		} finally {
			saving = false;
		}
	}

	async function remove(id: string) {
		if (!confirm('Delete page?')) return;
		const res = await fetch(`/api/admin/pages?id=${id}`, { method: 'DELETE' });
		if (res.ok) {
			pages = pages.filter((p) => p.id !== id);
			ui.showToast(m.admin_pages_deleted());
		} else {
			ui.showToast(m.error_generic(), true);
		}
	}
</script>

<div class="mx-auto max-w-4xl px-4 py-8 sm:px-6">
	<div class="flex items-center justify-between">
		<h1 class="font-display text-2xl font-semibold text-zinc-900 dark:text-white">Pages</h1>
		<button onclick={newPage} class="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900">
			New page
		</button>
	</div>

	{#if editing}
		<div class="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
			<h2 class="font-display text-lg font-semibold text-zinc-900 dark:text-white">{editing.id ? 'Edit' : 'New'} page</h2>
			<div class="mt-4 flex flex-col gap-4">
				<div>
					<label class="text-sm font-medium text-zinc-700 dark:text-zinc-300">Slug</label>
					<input bind:value={editing.slug} class="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-white" />
				</div>
				<div>
					<label class="text-sm font-medium text-zinc-700 dark:text-zinc-300">Title (ES)</label>
					<input bind:value={editing.title} class="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-white" />
				</div>
				<div>
					<label class="text-sm font-medium text-zinc-700 dark:text-zinc-300">Body (ES)</label>
					<textarea bind:value={editing.body} rows="10" class="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm font-mono dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"></textarea>
				</div>
				<div>
					<label class="text-sm font-medium text-zinc-700 dark:text-zinc-300">Title (PT)</label>
					<input bind:value={editing.title_pt} class="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-white" />
				</div>
				<div>
					<label class="text-sm font-medium text-zinc-700 dark:text-zinc-300">Body (PT)</label>
					<textarea bind:value={editing.body_pt} rows="10" class="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm font-mono dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"></textarea>
				</div>
				<div>
					<label class="text-sm font-medium text-zinc-700 dark:text-zinc-300">Title (EN)</label>
					<input bind:value={editing.title_en} class="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-white" />
				</div>
				<div>
					<label class="text-sm font-medium text-zinc-700 dark:text-zinc-300">Body (EN)</label>
					<textarea bind:value={editing.body_en} rows="10" class="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm font-mono dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"></textarea>
				</div>
				<div>
					<label class="text-sm font-medium text-zinc-700 dark:text-zinc-300">Title (JA)</label>
					<input bind:value={editing.title_ja} class="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-white" />
				</div>
				<div>
					<label class="text-sm font-medium text-zinc-700 dark:text-zinc-300">Body (JA)</label>
					<textarea bind:value={editing.body_ja} rows="10" class="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm font-mono dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"></textarea>
				</div>
				<div>
					<label class="text-sm font-medium text-zinc-700 dark:text-zinc-300">Title (FR)</label>
					<input bind:value={editing.title_fr} class="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-white" />
				</div>
				<div>
					<label class="text-sm font-medium text-zinc-700 dark:text-zinc-300">Body (FR)</label>
					<textarea bind:value={editing.body_fr} rows="10" class="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm font-mono dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"></textarea>
				</div>
				<div class="flex gap-3">
					<button onclick={save} disabled={saving} class="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900">
						{saving ? 'Saving...' : 'Save'}
					</button>
					<button onclick={() => (editing = null)} class="rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 hover:border-zinc-300 dark:border-zinc-800 dark:text-zinc-400">
						Cancel
					</button>
				</div>
			</div>
		</div>
	{/if}

	<div class="mt-6 divide-y divide-zinc-100 dark:divide-zinc-800">
		{#each pages as page (page.id)}
			<div class="flex items-center justify-between gap-4 py-3">
				<div>
					<p class="font-medium text-zinc-900 dark:text-white">/{page.slug}</p>
					<p class="text-sm text-zinc-500 dark:text-zinc-400">{page.title}</p>
				</div>
				<div class="flex gap-2">
					<button onclick={() => edit(page)} class="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white">Edit</button>
					<button onclick={() => remove(page.id)} class="text-sm text-red-500 hover:text-red-700">Delete</button>
				</div>
			</div>
		{/each}
	</div>
</div>
