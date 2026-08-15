<script lang="ts">
	import Modal from './Modal.svelte';
	import { ui } from '$lib/stores/ui.svelte';
	import { parseVideoUrl } from '$lib/utils/format';

	const url = $derived(ui.videoUrl);
	const video = $derived(url ? parseVideoUrl(url) : null);
</script>

<Modal open={Boolean(url)} onClose={() => ui.closeVideo()} bare maxWidth="max-w-2xl">
	{#if video}
		<div class="aspect-video w-full bg-black">
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
	{/if}
</Modal>
