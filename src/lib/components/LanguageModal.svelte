<script lang="ts">
	import { getLocale, setLocale } from '$lib/paraglide/runtime';
	import { LOCALE_CONFIG, LOCALES, type LocaleKey } from '$lib/utils/locales';
	import { ui } from '$lib/stores/ui.svelte';
	import { m } from '$lib/paraglide/messages';
	import Modal from './Modal.svelte';

	const locale = $derived(getLocale());

	const langs = LOCALES.map((key) => ({ key, ...LOCALE_CONFIG[key] }));

	function pick(l: LocaleKey) {
		if (l === locale) return;
		setLocale(l);
	}
</script>

<Modal open={ui.langOpen} onClose={() => ui.closeLang()} title={m.lang_title()} maxWidth="max-w-xs">
	<div class="grid grid-cols-2 gap-1 p-2">
		{#each langs as lang (lang.key)}
			<button
				onclick={() => pick(lang.key)}
				class="flex items-center gap-2 rounded-xl px-3 py-2.5 text-left transition {locale === lang.key
					? 'bg-accent/10 font-semibold text-accent'
					: 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900'}"
			>
				<span class="text-xl">{lang.flag}</span>
				<span class="text-sm">{lang.label}</span>
			</button>
		{/each}
	</div>
</Modal>
