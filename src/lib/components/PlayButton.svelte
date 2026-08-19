<script lang="ts">
	import { Play } from '@lucide/svelte';
	import { ui } from '$lib/stores/ui.svelte';
	import { m } from '$lib/paraglide/messages';

	let {
		url,
		size = 'md',
		className = ''
	}: {
		url: string;
		size?: 'sm' | 'md';
		className?: string;
	} = $props();

	function open(event: MouseEvent): void {
		event.preventDefault();
		event.stopPropagation();
		ui.openVideo(url);
	}
</script>

<button
	type="button"
	onclick={open}
	aria-label={m.video_play()}
	title={m.video_play()}
	class="grid place-items-center rounded-full bg-white/90 text-zinc-900 shadow-lg backdrop-blur transition hover:scale-105 hover:bg-white {size === 'sm'
		? 'h-9 w-9'
		: 'h-11 w-11'} {className}"
>
	<Play size={size === 'sm' ? 16 : 20} fill="currentColor" />
</button>
