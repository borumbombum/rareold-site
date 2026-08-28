<script lang="ts">
	import { Heart } from '@lucide/svelte';
	import { ui } from '$lib/stores/ui.svelte';
	import { session } from '$lib/stores/session.svelte';
	import { followedDistilleries, toggleFollow } from '$lib/stores/distillery-followers.svelte';
	import { navigation } from '$lib/stores/navigation.svelte';
	import { m } from '$lib/paraglide/messages';

	let {
		distilleryId,
		size = 'md',
		showLabel = true
	}: {
		distilleryId: string;
		size?: 'sm' | 'md';
		showLabel?: boolean;
	} = $props();

	let busy = $state(false);
	let popping = $state(false);

	const isFollowing = $derived(followedDistilleries.has(distilleryId));

	const sizeClasses = $derived(
		size === 'sm' ? 'gap-1 px-2 py-1 text-xs' : 'gap-1.5 px-3 py-1.5 text-sm'
	);

	const iconSize = $derived(size === 'sm' ? 14 : 18);

	async function toggle(e: MouseEvent) {
		if (busy) return;
		if (!session.isAuthed) {
			ui.openLogin();
			return;
		}
		const next = !isFollowing;
		busy = true;
		navigation.beginLoading();
		try {
			const ok = await toggleFollow(distilleryId, next);
			if (!ok) {
				ui.showToast(m.error_generic(), true);
			} else {
				ui.showToast(next ? m.distillery_followed() : m.distillery_unfollowed());
				if (next) {
					popping = true;
					setTimeout(() => {
						popping = false;
					}, 450);
				}
			}
		} finally {
			busy = false;
			navigation.endLoading();
		}
		void e;
	}
</script>

<button
	onclick={toggle}
	disabled={busy}
	title={isFollowing ? m.distillery_unfollow() : m.distillery_follow()}
	aria-pressed={isFollowing}
	class="inline-flex shrink-0 items-center rounded-full border font-medium transition disabled:opacity-60 {sizeClasses} {isFollowing
		? 'border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900'
		: 'border-zinc-200 bg-white/10 text-zinc-600 hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-white'} {popping ? 'animate-heart-pop' : ''}"
>
	<Heart size={iconSize} fill={isFollowing ? 'currentColor' : 'none'} />
	{#if showLabel}
		<span>{isFollowing ? m.distillery_unfollow() : m.distillery_follow()}</span>
	{/if}
</button>
