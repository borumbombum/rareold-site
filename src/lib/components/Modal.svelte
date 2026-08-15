<script lang="ts">
	import { X } from 'lucide-svelte';
	import { m } from '$lib/paraglide/messages';

	let {
		open,
		onClose,
		title = '',
		maxWidth = 'max-w-lg',
		bare = false,
		children
	}: {
		open: boolean;
		onClose: () => void;
		title?: string;
		maxWidth?: string;
		bare?: boolean;
		children?: import('svelte').Snippet;
	} = $props();

	$effect(() => {
		if (!open) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onClose();
		};
		window.addEventListener('keydown', onKey);
		const prev = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		return () => {
			window.removeEventListener('keydown', onKey);
			document.body.style.overflow = prev;
		};
	});
</script>

{#if open}
	<div
		class="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
		role="dialog"
		aria-modal="true"
		tabindex="-1"
		onmouseup={(e) => {
			if (e.target === e.currentTarget) onClose();
		}}
	>
		<div
			class={`animate-rise-in no-scrollbar flex max-h-[92dvh] w-full ${maxWidth} flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950`}
		>
			{#if !bare}
				<div class="flex items-center justify-between gap-4 border-b border-zinc-200 px-5 py-3.5 dark:border-zinc-800">
					<h3 class="font-display text-lg text-zinc-900 dark:text-zinc-100">{title}</h3>
					<button
						onclick={onClose}
						aria-label={m.video_close()}
						class="grid h-9 w-9 place-items-center rounded-full text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
					>
						<X size={18} />
					</button>
				</div>
			{/if}
			<div class="no-scrollbar overflow-y-auto">
				{@render children?.()}
			</div>
		</div>
	</div>
{/if}
