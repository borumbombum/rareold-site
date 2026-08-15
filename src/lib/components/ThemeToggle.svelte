<script lang="ts">
	import { Moon, Sun } from 'lucide-svelte';
	import { theme } from '$lib/stores/theme.svelte';

	const isDark = $derived(theme.current === 'dark');
</script>

<button
	onclick={() => theme.toggle()}
	aria-label="Toggle theme"
	class="grid h-9 w-9 place-items-center rounded-full border border-zinc-200 text-zinc-600 transition hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:text-white"
>
	{#if isDark}
		<Sun size={16} />
	{:else}
		<Moon size={16} />
	{/if}
</button>
