<script lang="ts">
	import { BadgeCheck, Star } from '@lucide/svelte';
	import { onMount } from 'svelte';
	import { ui } from '$lib/stores/ui.svelte';
	import { session } from '$lib/stores/session.svelte';
	import { m } from '$lib/paraglide/messages';
	import { getLocale } from '$lib/paraglide/runtime';
	import { formatDate } from '$lib/utils/format';
	import type { Review } from '$lib/types';

	let {
		productId,
		countryCode,
		initial
	}: {
		productId: string;
		countryCode: string;
		initial: Review[];
	} = $props();

	const locale = $derived(getLocale());

	let reviews = $state<Review[]>(initial);
	let score = $state(5);
	let comment = $state('');
	let posting = $state(false);
	let reload = $state(0);

	$effect(() => {
		if (reload === 0) return;
		void load();
	});

	async function load() {
		try {
			const res = await fetch(`/api/reviews?productId=${productId}&country=${countryCode}`);
			const data = await res.json();
			reviews = data.items ?? [];
		} catch {
			/* keep */
		}
	}

	async function submit() {
		if (!session.isAuthed) {
			ui.openLogin();
			return;
		}
		posting = true;
		try {
			const res = await fetch('/api/reviews', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ country: countryCode, productId, score, comment })
			});
			if (res.ok) {
				comment = '';
				reload++;
			} else {
				ui.showToast(m.error_generic(), true);
			}
		} catch {
			ui.showToast(m.error_generic(), true);
		} finally {
			posting = false;
		}
	}

	const inputCls =
		'w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-600 dark:focus:ring-zinc-800';
</script>

<section class="mt-10">
	<h2 class="font-display text-2xl font-semibold text-zinc-900 dark:text-white">
		{m.reviews_title()}
	</h2>

	{#if session.isAuthed}
		<form
			class="mt-4 flex flex-col gap-3 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800"
			onsubmit={(e) => {
				e.preventDefault();
				void submit();
			}}
		>
			<div class="flex items-center gap-1">
				{#each [1, 2, 3, 4, 5] as n}
					<button
						type="button"
						onclick={() => (score = n)}
						aria-label={`${n}`}
						class="p-0.5 {n <= score ? 'text-amber-500' : 'text-zinc-300 dark:text-zinc-700'}"
					>
						<Star size={20} fill="currentColor" />
					</button>
				{/each}
			</div>
			<textarea
				bind:value={comment}
				placeholder={m.reviews_placeholder()}
				rows={3}
				class={inputCls}
			></textarea>
			<button
				type="submit"
				disabled={posting}
				class="self-end rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
			>
				{posting ? m.loading() : m.reviews_submit()}
			</button>
		</form>
	{:else}
		<button
			onclick={() => ui.openLogin()}
			class="mt-4 rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-600 transition hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:text-white"
		>
			{m.reviews_login_first()}
		</button>
	{/if}

	<div class="mt-6 flex flex-col gap-4">
		{#if reviews.length === 0}
			<p class="py-6 text-sm text-zinc-500 dark:text-zinc-400">{m.reviews_empty()}</p>
		{:else}
			{#each reviews as review (review.id)}
				<article class="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
					<div class="flex items-start gap-3">
						<div class="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-zinc-100 text-sm font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
							{#if review.user_avatar}
								<img src={review.user_avatar} alt="" class="h-full w-full object-cover" />
							{:else}
								{(review.user_name ?? '?').slice(0, 1).toUpperCase()}
							{/if}
						</div>
						<div class="min-w-0 flex-1">
							<div class="flex flex-wrap items-center gap-x-2 gap-y-1">
								<p class="text-sm font-semibold text-zinc-900 dark:text-white">
									{review.user_name ?? 'Anónimo'}
								</p>
								{#if review.is_verified_purchase}
									<span class="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
										<BadgeCheck size={13} />
										{m.reviews_verified()}
									</span>
								{/if}
								<span class="text-xs text-zinc-400">{formatDate(review.created_at, locale)}</span>
							</div>
							<div class="mt-1 flex items-center gap-1">
								{#each [1, 2, 3, 4, 5] as n}
									<Star
										size={13}
										class={n <= review.score ? 'text-amber-500' : 'text-zinc-300 dark:text-zinc-700'}
										fill="currentColor"
									/>
								{/each}
							</div>
							{#if review.comment}
								<p class="mt-2 text-sm text-zinc-700 dark:text-zinc-300">{review.comment}</p>
							{/if}
						</div>
					</div>
				</article>
			{/each}
		{/if}
	</div>
</section>
