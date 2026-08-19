<script lang="ts">
	import { Star } from '@lucide/svelte';
	import Modal from './Modal.svelte';
	import { ui } from '$lib/stores/ui.svelte';
	import { reviewedStore } from '$lib/stores/reviewed.svelte';
	import { refreshRating } from '$lib/stores/rating.svelte';
	import { m } from '$lib/paraglide/messages';

	let score = $state(5);
	let comment = $state('');
	let posting = $state(false);

	const product = $derived(ui.reviewProduct);

	$effect(() => {
		if (product?.existingReview) {
			score = product.existingReview.score;
			comment = product.existingReview.comment ?? '';
		} else {
			score = 5;
			comment = '';
		}
	});

	async function submit() {
		if (!product) return;
		posting = true;
		try {
			const res = await fetch('/api/reviews', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					country: product.country,
					productId: product.slug,
					score,
					comment
				})
			});
			if (res.ok) {
				reviewedStore.refresh([product.slug]);
				refreshRating([product.slug]);
				ui.showToast(product.existingReview ? m.vote_change() : m.voted());
				ui.closeReview();
			} else {
				ui.showToast(m.error_generic(), true);
			}
		} catch {
			ui.showToast(m.error_generic(), true);
		} finally {
			posting = false;
		}
	}
</script>

<Modal
	open={ui.reviewOpen}
	onClose={() => ui.closeReview()}
	title={product?.existingReview ? m.vote_change() : m.vote()}
	maxWidth="max-w-md"
>
	<div class="flex flex-col gap-4 p-5">
		{#if product}
			<div class="flex items-center gap-3">
				{#if product.productImage}
					<img
						src={product.productImage}
						alt={product.productName}
						class="h-12 w-12 rounded-xl object-contain"
					/>
				{/if}
				<p class="text-sm font-semibold text-zinc-900 dark:text-white">
					{product.productName}
				</p>
			</div>
		{/if}

		<div class="flex items-center justify-center gap-1">
			{#each [1, 2, 3, 4, 5] as n}
				<button
					type="button"
					onclick={() => (score = n)}
					aria-label={`${n}`}
					class="p-0.5 transition {n <= score ? 'text-amber-500' : 'text-zinc-300 dark:text-zinc-700'}"
				>
					<Star size={28} fill="currentColor" />
				</button>
			{/each}
		</div>

		<textarea
			bind:value={comment}
			placeholder={m.reviews_placeholder()}
			rows={3}
			class="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-600 dark:focus:ring-zinc-800"
		></textarea>

		<button
			type="button"
			onclick={() => void submit()}
			disabled={posting}
			class="self-end rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
		>
			{posting ? m.loading() : product?.existingReview ? m.vote_change() : m.vote()}
		</button>
	</div>
</Modal>
