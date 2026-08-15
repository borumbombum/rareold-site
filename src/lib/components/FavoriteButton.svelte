<script lang="ts">
	import { Heart } from 'lucide-svelte';
	import { ui } from '$lib/stores/ui.svelte';
	import { session } from '$lib/stores/session.svelte';
	import { favorites } from '$lib/stores/favorites.svelte';
	import { m } from '$lib/paraglide/messages';

	let { slug }: { slug: string } = $props();

	let busy = $state(false);

	const isFav = $derived(favorites.has(slug));

	async function toggle() {
		if (busy) return;
		if (!session.isAuthed) {
			ui.openLogin();
			return;
		}
		const next = !isFav;
		busy = true;
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
		}
	}
</script>

<button
	onclick={toggle}
	disabled={busy}
	title={m.favorite()}
	aria-pressed={isFav}
	class="inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition disabled:opacity-60 md:px-4 md:py-2 md:text-base {isFav
		? 'border-rose-400 bg-rose-400 text-white'
		: 'border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-white'}"
>
	<Heart size={18} fill={isFav ? 'currentColor' : 'none'} />
</button>
