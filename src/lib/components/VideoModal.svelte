<script lang="ts">
	import Modal from './Modal.svelte';
	import { ChevronLeft, ChevronRight } from '@lucide/svelte';
	import { m } from '$lib/paraglide/messages';
	import { ui } from '$lib/stores/ui.svelte';
	import { parseVideoUrl } from '$lib/utils/format';

	const url = $derived(ui.videoUrl);
	const video = $derived(url ? parseVideoUrl(url) : null);
	const list = $derived(ui.videoList);
	const index = $derived(ui.videoIndex);
	const total = $derived(list.length);
	const label = $derived(total > 0 ? list[index].label : '');
</script>

<Modal open={Boolean(url)} onClose={() => ui.closeVideo()} bare width="w-[90vw] lg:w-[80vw]" maxWidth="max-w-full">
	{#if video}
		<div class="relative">
			<div class="aspect-video max-h-[calc(92dvh_-_3rem)] w-full bg-black">
				{#if video.provider === 'instagram'}
					<iframe
						src={video.embedUrl}
						class="h-full w-full"
						frameborder="0"
						allowfullscreen
						title="Video"
					></iframe>
				{:else}
					<iframe
						src={video.embedUrl}
						class="h-full w-full"
						frameborder="0"
						allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
						allowfullscreen
						title="Video"
					></iframe>
				{/if}
			</div>
			{#if total > 1}
				<div class="flex items-center justify-between gap-2 bg-white px-3 py-2 dark:bg-zinc-950">
					<button
						onclick={() => ui.setVideoIndex(index - 1)}
						disabled={index === 0}
						class="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-40 dark:text-zinc-200 dark:hover:bg-zinc-800"
					>
						<ChevronLeft size={16} />
						<span class="hidden sm:inline">{m.video_prev()}</span>
					</button>
					<span class="min-w-0 flex-1 truncate text-center text-xs text-zinc-500 dark:text-zinc-400" title={label}>
						{#if label}{label} · {/if}{index + 1} / {total}
					</span>
					<button
						onclick={() => ui.setVideoIndex(index + 1)}
						disabled={index === total - 1}
						class="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-40 dark:text-zinc-200 dark:hover:bg-zinc-800"
					>
						<span class="hidden sm:inline">{m.video_next()}</span>
						<ChevronRight size={16} />
					</button>
				</div>
			{/if}
		</div>
	{/if}
</Modal>
