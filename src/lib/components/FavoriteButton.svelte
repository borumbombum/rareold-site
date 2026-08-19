<script lang="ts">
	import { Heart } from '@lucide/svelte';
	import { ui } from '$lib/stores/ui.svelte';
	import { session } from '$lib/stores/session.svelte';
	import { favorites } from '$lib/stores/favorites.svelte';
	import { navigation } from '$lib/stores/navigation.svelte';
	import { m } from '$lib/paraglide/messages';

	let {
		slug,
		size = 'md',
		showLabel = true
	}: {
		slug: string;
		size?: 'sm' | 'md';
		showLabel?: boolean;
	} = $props();

	let busy = $state(false);

	const isFav = $derived(favorites.has(slug));

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
		const next = !isFav;
		busy = true;
		navigation.setLoading(true);
		if (next) favorites.add(slug);
		else favorites.remove(slug);
		try {
			const res = await fetch('/api/favorites', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ product_id: slug, on: next })
			});
			if (!res.ok) {
				if (next) favorites.remove(slug);
				else favorites.add(slug);
				ui.showToast(m.error_generic(), true);
			} else {
				ui.showToast(next ? m.favorite_added() : m.favorite_removed());
			}
		} catch {
			if (next) favorites.remove(slug);
			else favorites.add(slug);
			ui.showToast(m.error_generic(), true);
		} finally {
			busy = false;
			navigation.setLoading(false);
		}
	}
</script>

<button
	onclick={toggle}
	disabled={busy}
	title={m.favorite()}
	aria-pressed={isFav}
	class="inline-flex shrink-0 items-center rounded-full border font-medium transition disabled:opacity-60 {sizeClasses} {isFav
		? 'border-rose-400 bg-rose-400 text-white'
		: 'border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-white'}"
>
	<Heart size={iconSize} fill={isFav ? 'currentColor' : 'none'} />
	{#if showLabel}
		<span>{isFav ? m.favorite_remove() : m.favorite_add()}</span>
	{/if}
</button>
