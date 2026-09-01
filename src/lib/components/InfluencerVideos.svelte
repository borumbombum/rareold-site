<script lang="ts">
	import { Play, Camera } from '@lucide/svelte';
	import { m } from '$lib/paraglide/messages';
	import { ui } from '$lib/stores/ui.svelte';
	import { LOCALE_CONFIG, type LocaleKey } from '$lib/utils/locales';
	import type { ProductVideo } from '$lib/types';

	let { videos }: { videos: ProductVideo[] } = $props();

	function flag(language: string | undefined): string {
		return (language && language in LOCALE_CONFIG ? LOCALE_CONFIG[language as LocaleKey].flag : '') ?? '';
	}

	function thumb(url: string): string | null {
		const match =
			url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{6,})/) ?? null;
		return match ? `https://i.ytimg.com/vi/${match[1]}/hqdefault.jpg` : null;
	}

	function open(v: ProductVideo) {
		ui.openVideo(v.url, videos);
	}
</script>

{#if videos.length > 0}
	<div class="mb-3 w-full min-w-0">
		<h2 class="flex items-center gap-2 font-display text-sm font-semibold text-zinc-900 dark:text-white">
			<Play size={14} class="text-accent" />
			{m.videos_title()}
		</h2>
		<div class="mt-2 flex w-full min-w-0 snap-x gap-2 overflow-x-auto pb-1">
			{#each videos as v, i (v.url)}
				<button
					onclick={() => open(v)}
					class="relative aspect-video w-[38vw] max-w-[150px] shrink-0 snap-start rounded-xl border border-zinc-200 bg-zinc-100 transition hover:border-zinc-300 hover:shadow-md dark:border-zinc-200 dark:bg-white"
					aria-label={m.video_play()}
					title={v.label || m.video_play()}
				>
					<span class="absolute inset-0 overflow-hidden rounded-[inherit]">
					{#if v.platform === 'youtube' && thumb(v.url)}
						<img
							src={thumb(v.url)!}
							alt={v.label || 'video'}
							loading="lazy"
							class="h-full w-full object-cover"
						/>
					{:else if v.platform === 'instagram'}
						<span class="grid h-full w-full place-items-center bg-gradient-to-br from-pink-50 to-orange-50 text-pink-500">
							<Camera size={22} />
						</span>
					{:else}
						<span class="grid h-full w-full place-items-center bg-zinc-200 text-zinc-500">
							<Play size={20} />
						</span>
					{/if}
					</span>
					{#if flag(v.language)}
						<span
							class="absolute right-1 top-1 z-10 rounded bg-white/80 px-1 text-sm leading-none shadow-sm"
						>
							{flag(v.language)}
						</span>
					{/if}
					{#if videos.length > 1}
						<span class="absolute bottom-1 right-1 rounded-full bg-black/60 px-1.5 text-[10px] font-semibold text-white">
							{i + 1}/{videos.length}
						</span>
					{/if}
					<span class="absolute inset-0 grid place-items-center">
						<span class="grid h-8 w-8 place-items-center rounded-full bg-white/90 text-zinc-900 shadow transition group-hover:scale-110">
							<Play size={15} />
						</span>
					</span>
				</button>
			{/each}
		</div>
	</div>
{/if}
