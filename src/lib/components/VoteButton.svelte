<script lang="ts">
	import { Star } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { ui } from '$lib/stores/ui.svelte';
	import { session } from '$lib/stores/session.svelte';
	import { karmaStore } from '$lib/stores/karma.svelte';
	import { m } from '$lib/paraglide/messages';
	import { getLocale } from '$lib/paraglide/runtime';
	import { formatNumber } from '$lib/utils/format';

	let {
		slug,
		country,
		label,
		alwaysShowLabel = false
	}: {
		slug: string;
		country: string;
		label?: string;
		alwaysShowLabel?: boolean;
	} = $props();
	const locale = $derived(getLocale());

	let votedMap = $state<Record<string, boolean>>({});
	let busy = $state(false);

	onMount(() => {
		try {
			votedMap = JSON.parse(localStorage.getItem('rareold.votes') ?? '{}');
		} catch {
			/* ignore */
		}
	});

	function persist(): void {
		try {
			localStorage.setItem('rareold.votes', JSON.stringify(votedMap));
		} catch {
			/* ignore */
		}
	}

	const isVoted = $derived(Boolean(votedMap[slug]));
	const votes = $derived(karmaStore.get(slug).votes);

	async function toggle() {
		if (busy) return;
		if (!session.isAuthed) {
			ui.openLogin();
			return;
		}
		const next = !isVoted;
		busy = true;
		votedMap[slug] = next;
		persist();
		karmaStore.applyDelta(slug, next ? 1 : -1, next ? 1 : -1);
		try {
			const res = await fetch('/api/vote', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ entity_id: slug, karma: next ? 1 : -1, country })
			});
			if (!res.ok) {
				votedMap[slug] = !next;
				persist();
				karmaStore.applyDelta(slug, next ? -1 : 1, next ? -1 : 1);
				ui.showToast(m.error_generic(), true);
			} else {
				ui.showToast(next ? m.voted() : m.vote());
			}
		} catch {
			votedMap[slug] = !next;
			persist();
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
	title={m.vote()}
	class="inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition disabled:opacity-60 md:gap-2 md:px-4 md:py-2 md:text-base {isVoted
		? 'border-amber-400 bg-amber-400 text-zinc-900'
		: 'border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-white'}"
>
	<Star size={18} fill={isVoted ? 'currentColor' : 'none'} />
	{#if label}
		<span class={alwaysShowLabel ? '' : 'hidden md:inline'}>{label}</span>
	{/if}
	<span>{formatNumber(votes, locale)}</span>
</button>
