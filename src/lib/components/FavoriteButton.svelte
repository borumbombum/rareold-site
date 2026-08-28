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
	let popping = $state(false);

	const isFav = $derived(favorites.has(slug));

	const sizeClasses = $derived(
		size === 'sm'
			? 'gap-1 px-2 py-1 text-xs'
			: 'gap-1.5 px-3 py-1.5 text-sm'
	);

	const iconSize = $derived(size === 'sm' ? 14 : 18);

	const PARTICLE_COLORS = ['#f43f5e', '#fb7185', '#fda4af', '#e11d48', '#f43f5e'];

	function burst(x: number, y: number) {
		const count = 10;
		for (let i = 0; i < count; i++) {
			const el = document.createElement('span');
			el.className = 'heart-particle';
			const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
			const distance = 32 + Math.random() * 40;
			const tx = Math.cos(angle) * distance;
			const ty = Math.sin(angle) * distance - 10;
			el.style.setProperty('--tx', tx + 'px');
			el.style.setProperty('--ty', ty + 'px');
			el.style.left = x + 'px';
			el.style.top = y + 'px';
			el.style.background = PARTICLE_COLORS[i % PARTICLE_COLORS.length];
			document.body.appendChild(el);
			setTimeout(() => {
				if (el.parentNode) el.parentNode.removeChild(el);
			}, 700);
		}
	}

	async function toggle(e: MouseEvent) {
		if (busy) return;
		if (!session.isAuthed) {
			ui.openLogin();
			return;
		}
		const btn = e.currentTarget as HTMLElement;
		const next = !isFav;
		busy = true;
		navigation.beginLoading();
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
				if (next && btn) {
					popping = true;
					const rect = btn.getBoundingClientRect();
					burst(rect.left + rect.width / 2, rect.top + rect.height / 2);
					setTimeout(() => { popping = false; }, 450);
				}
			}
		} catch {
			if (next) favorites.remove(slug);
			else favorites.add(slug);
			ui.showToast(m.error_generic(), true);
		} finally {
			busy = false;
			navigation.endLoading();
		}
	}
</script>

<button
	onclick={toggle}
	disabled={busy}
	title={m.favorite()}
	aria-pressed={isFav}
	class="inline-flex shrink-0 items-center rounded-full border font-medium transition overflow-visible disabled:opacity-60 {sizeClasses} {isFav
		? 'border-rose-400 bg-rose-400 text-white'
		: 'border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-white'} {popping ? 'animate-heart-pop' : ''}"
>
	<Heart size={iconSize} fill={isFav ? 'currentColor' : 'none'} />
	{#if showLabel}
		<span>{isFav ? m.favorite_remove() : m.favorite_add()}</span>
	{/if}
</button>
