<script lang="ts">
	import { Play } from '@lucide/svelte';
	import { m } from '$lib/paraglide/messages';
	import { ui } from '$lib/stores/ui.svelte';
	import type { ProductVideo } from '$lib/types';

	let {
		videos,
		size = 'md',
		className = ''
	}: {
		videos: ProductVideo[];
		size?: 'sm' | 'md';
		className?: string;
	} = $props();

	function open(e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		ui.openVideo(videos[0].url, videos);
	}
</script>

{#if videos.length > 0}
	<button
		onclick={open}
		class="grid place-items-center rounded-full bg-white/90 text-zinc-900 shadow-sm backdrop-blur transition hover:scale-110 dark:bg-zinc-900/90 dark:text-white {size === 'sm'
			? 'h-6 w-6'
			: 'h-8 w-8'} {className}"
		aria-label={m.video_play()}
		title={m.video_play()}
	>
		<Play size={size === 'sm' ? 11 : 14} fill="currentColor" />
	</button>
{/if}
