<script lang="ts">
	import { ArrowUp } from '@lucide/svelte';
	import { m } from '$lib/paraglide/messages';

	let y = $state(0);

	const visible = $derived(y > 500);

	function scrollToTop(): void {
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}
</script>

<svelte:window bind:scrollY={y} />

<button
	type="button"
	onclick={scrollToTop}
	inert={!visible}
	aria-label={m.back_to_top()}
	title={m.back_to_top()}
	class="fixed bottom-6 right-6 z-40 grid h-12 w-12 place-items-center rounded-full border bg-zinc-900 text-white shadow-lg transition-all duration-300 hover:border-zinc-700 hover:bg-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-white {visible
		? 'translate-y-0 opacity-100'
		: 'pointer-events-none translate-y-2 opacity-0'}"
>
	<ArrowUp size={20} />
</button>
