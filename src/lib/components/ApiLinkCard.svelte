<script lang="ts">
	import { Code2, Copy, Check, ExternalLink } from '@lucide/svelte';
	import { scale } from 'svelte/transition';
	import { m } from '$lib/paraglide/messages';
	import { ui } from '$lib/stores/ui.svelte';

	let { slug }: { slug: string } = $props();

	const path = $derived(`/api/v1/public/whiskies/${slug}?lang=all`);
	const absolute = $derived(
		typeof window !== 'undefined' ? window.location.origin + path : path
	);

	let copied = $state(false);
	let timer: ReturnType<typeof setTimeout> | null = null;

	function legacyCopy(text: string): boolean {
		try {
			const ta = document.createElement('textarea');
			ta.value = text;
			ta.setAttribute('readonly', '');
			ta.style.position = 'fixed';
			ta.style.opacity = '0';
			document.body.appendChild(ta);
			ta.select();
			const ok = document.execCommand('copy');
			document.body.removeChild(ta);
			return ok;
		} catch {
			return false;
		}
	}

	function markCopied() {
		copied = true;
		if (timer) clearTimeout(timer);
		timer = setTimeout(() => (copied = false), 3000);
	}

	async function copy() {
		try {
			if (navigator.clipboard?.writeText) {
				await navigator.clipboard.writeText(absolute);
				markCopied();
				return;
			}
		} catch {}
		if (legacyCopy(absolute)) {
			markCopied();
		} else {
			ui.showToast(m.api_copy_failed(), true);
		}
	}
</script>

<section
	class="mt-6 flex items-center gap-2 rounded-2xl border border-zinc-200 px-3 py-2 dark:border-zinc-800"
>
	<Code2 size={13} class="shrink-0 text-zinc-400" />
	<span class="shrink-0 text-[11px] font-medium uppercase tracking-wide text-zinc-400">
		{m.api_card_title()}
	</span>
	<code class="min-w-0 flex-1 truncate font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
		{absolute}
	</code>
	<button
		onclick={copy}
		class="flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium transition-all duration-300 {copied
			? 'text-green-600 dark:text-green-400'
			: 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white'}"
	>
		{#key copied}
			<span transition:scale={{ duration: 200, start: 0.6 }} class="flex items-center gap-1">
				{#if copied}
					<Check size={12} />
					{m.api_copied()}
				{:else}
					<Copy size={12} />
					{m.api_copy_link()}
				{/if}
			</span>
		{/key}
	</button>
	<a
		href={absolute}
		target="_blank"
		rel="noopener noreferrer"
		class="flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
	>
		<ExternalLink size={12} />
		{m.view()}
	</a>
</section>
