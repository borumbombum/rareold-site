<script lang="ts">
	import { page } from '$app/state';
	import { localizeHref, deLocalizeHref, getUrlOrigin } from '$lib/paraglide/runtime';
	import { buildHreflangAlternates } from '$lib/utils/seo';
	import SEO from '$lib/components/SEO.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const basePath = $derived(deLocalizeHref(page.url.pathname));
	const alternates = $derived(buildHreflangAlternates(basePath, getUrlOrigin()));
</script>

<SEO
	title="{data.title} — Rare Old"
	description={data.title}
	canonicalPath={localizeHref(basePath)}
	ogType="article"
	hreflangAlternates={alternates}
/>

<div class="mx-auto max-w-3xl px-4 py-12 sm:px-6">
	<h1 class="font-display text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
		{data.title}
	</h1>
	<div
		class="prose prose-zinc mt-6 max-w-none text-zinc-600 dark:prose-invert dark:text-zinc-300 [&_p]:mt-3 [&_h2]:mt-6 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-semibold [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:mt-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-accent [&_a]:underline"
	>
		{@html data.body}
	</div>
</div>
