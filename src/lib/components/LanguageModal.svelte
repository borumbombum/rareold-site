<script lang="ts">
	import { getLocale, setLocale } from '$lib/paraglide/runtime';
	import type { Locale } from '$lib/types';
	import { ui } from '$lib/stores/ui.svelte';
	import { m } from '$lib/paraglide/messages';
	import Modal from './Modal.svelte';

	const locale = $derived(getLocale());

	const langs: { key: Locale; flag: string; label: string }[] = [
		{ key: 'es', flag: '🇺🇾', label: 'Español' },
		{ key: 'pt', flag: '🇧🇷', label: 'Português' },
		{ key: 'en', flag: '🇺🇸', label: 'English' }
	];

	function pick(l: Locale) {
		if (l === locale) return;
		setLocale(l);
	}
</script>

<Modal open={ui.langOpen} onClose={() => ui.closeLang()} title={m.lang_title()} maxWidth="max-w-xs">
	<div class="p-2">
		{#each langs as lang (lang.key)}
			<button
				onclick={() => pick(lang.key)}
				class="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition {locale === lang.key
					? 'bg-accent/10 font-semibold text-accent'
					: 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900'}"
			>
				<span class="text-xl">{lang.flag}</span>
				<span class="text-sm">{lang.label}</span>
			</button>
		{/each}
	</div>
</Modal>
