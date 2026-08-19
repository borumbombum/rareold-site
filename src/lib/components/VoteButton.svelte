<script lang="ts">
	import { Star } from '@lucide/svelte';
	import { ui } from '$lib/stores/ui.svelte';
	import { session } from '$lib/stores/session.svelte';
	import { karmaStore } from '$lib/stores/karma.svelte';
	import { votedStore } from '$lib/stores/voted.svelte';
	import { m } from '$lib/paraglide/messages';

	let {
		slug,
		country,
		alwaysShowLabel = false,
		size = 'md'
	}: {
		slug: string;
		country: string;
		alwaysShowLabel?: boolean;
		size?: 'sm' | 'md';
	} = $props();

	let busy = $state(false);

	const isVoted = $derived(votedStore.isVoted(slug));

	const sizeClasses = $derived(
		size === 'sm'
			? 'gap-1 px-2 py-1 text-xs'
			: 'gap-1.5 px-3 py-1.5 text-sm'
	);

	const iconSize = $derived(size === 'sm' ? 14 : 18);

	async function toggle() {
		if (busy) return;
		if (!session.isAuthed) {
			ui.openLogin();
			return;
		}
		const next = !isVoted;
		busy = true;
		votedStore.set(slug, next);
		karmaStore.applyDelta(slug, next ? 1 : -1, next ? 1 : -1);
		try {
			const res = await fetch('/api/vote', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ entity_id: slug, karma: next ? 1 : -1, country })
			});
			if (!res.ok) {
				votedStore.set(slug, !next);
				karmaStore.applyDelta(slug, next ? -1 : 1, next ? -1 : 1);
				ui.showToast(m.error_generic(), true);
			} else {
				ui.showToast(next ? m.voted() : m.vote());
			}
		} catch {
			votedStore.set(slug, !next);
			karmaStore.applyDelta(slug, next ? -1 : 1, next ? -1 : 1);
			ui.showToast(m.error_generic(), true);
		} finally {
			busy = false;
		}
	}
</script>

<button
	onclick={toggle}
	disabled={busy}
	title={isVoted ? m.unvote() : m.vote()}
	class="inline-flex shrink-0 items-center rounded-full border font-medium transition disabled:opacity-60 {sizeClasses} {isVoted
		? 'border-amber-400 bg-amber-400 text-zinc-900'
		: 'border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-white'}"
>
	<Star size={iconSize} fill={isVoted ? 'currentColor' : 'none'} />
	<span>{isVoted ? m.unvote() : m.vote()}</span>
</button>
