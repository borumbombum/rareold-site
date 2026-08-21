<script lang="ts">
	import { getLocale } from '$lib/paraglide/runtime';
	import { ChevronDown } from '@lucide/svelte';
	import { ui } from '$lib/stores/ui.svelte';
	import { m } from '$lib/paraglide/messages';
	import { LOCALE_CONFIG } from '$lib/utils/locales';

	let { compact = false, flagsOnly = false }: { compact?: boolean; flagsOnly?: boolean } = $props();

	const locale = $derived(getLocale());
	const localeCfg = $derived(LOCALE_CONFIG[locale] ?? LOCALE_CONFIG.es);
</script>

{#if flagsOnly}
	<button
		onclick={() => ui.openLang()}
		aria-label={m.lang_switch()}
		class="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-zinc-200 text-base leading-none text-zinc-600 transition hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:text-white"
	>
		{localeCfg.flag}
	</button>
{:else}
	<button
		onclick={() => ui.openLang()}
		aria-label={m.lang_switch()}
		class="flex items-center gap-2 rounded-full border border-zinc-200 text-zinc-600 transition hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:text-white {compact
			? 'h-9 px-3 text-sm'
			: 'h-9 px-3 text-sm'}"
	>
		<span class="text-base leading-none">{localeCfg.flag}</span>
		<span>{localeCfg.label}</span>
		<ChevronDown size={14} class="shrink-0" />
	</button>
{/if}
