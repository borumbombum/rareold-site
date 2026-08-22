<script lang="ts">
	import { page } from '$app/state';
	import { m } from '$lib/paraglide/messages';
	import { ui } from '$lib/stores/ui.svelte';
	import SEO from '$lib/components/SEO.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let email = $state('');
	let busy = $state(false);
	let sent = $state(false);

	async function request() {
		if (!email.trim()) return;
		busy = true;
		try {
			const res = await fetch('/api/download/request', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email })
			});
			if (res.ok) {
				sent = true;
				ui.showToast(m.download_request_sent());
			} else {
				ui.showToast(m.error_generic(), true);
			}
		} finally {
			busy = false;
		}
	}

	const stats = $derived([
		{ label: m.download_stat_whiskies(), value: data.counts.whiskies },
		{ label: m.download_stat_distilleries(), value: data.counts.distilleries },
		{ label: m.download_stat_origins(), value: data.counts.origins },
		{ label: m.download_stat_regions(), value: data.counts.regions },
		{ label: m.download_stat_videos(), value: data.counts.videos }
	]);

	const faqs = $derived([
		{ q: m.download_faq1_q(), a: m.download_faq1_a() },
		{ q: m.download_faq2_q(), a: m.download_faq2_a() },
		{ q: m.download_faq3_q(), a: m.download_faq3_a() }
	]);
</script>

<svelte:head>
	<title>{m.download_title()} — Rare Old</title>
</svelte:head>

<SEO title="{m.download_title()} — Rare Old" description={m.download_subtitle()} canonicalPath="/download" />

<div class="mx-auto max-w-3xl px-4 py-12 sm:px-6">
	<h1 class="font-display text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
		{m.download_title()}
	</h1>
	<p class="mt-3 text-zinc-600 dark:text-zinc-300">{m.download_subtitle()}</p>

	<section class="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
		<h2 class="font-display text-lg font-semibold text-zinc-900 dark:text-white">{m.download_whats_inside()}</h2>
		<dl class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
			{#each stats as s (s.label)}
				<div class="rounded-xl bg-zinc-50 px-3 py-2.5 text-center dark:bg-zinc-950">
					<dt class="order-2 mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{s.label}</dt>
					<dd class="font-display text-xl font-semibold tabular-nums text-zinc-900 dark:text-white">{s.value}</dd>
				</div>
			{/each}
		</dl>
	</section>

	<section class="mt-6 rounded-2xl border border-accent/30 bg-accent/5 p-6">
		<div class="flex flex-wrap items-center justify-between gap-4">
			<div>
				<h2 class="font-display text-lg font-semibold text-zinc-900 dark:text-white">$29 USD</h2>
				<p class="text-sm text-zinc-600 dark:text-zinc-400">{m.download_price_note()}</p>
			</div>
			{#if sent}
				<p class="rounded-lg bg-emerald-100 px-4 py-2 text-sm font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
					{m.download_request_sent()}
				</p>
			{:else}
				<form
					class="flex w-full max-w-md gap-2"
					onsubmit={(e) => {
						e.preventDefault();
						request();
					}}
				>
					<input
						type="email"
						required
						bind:value={email}
						placeholder="you@example.com"
						class="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
					/>
					<button
						type="submit"
						disabled={busy}
						class="shrink-0 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-60 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
					>
						{busy ? '…' : m.download_request_cta()}
					</button>
				</form>
			{/if}
		</div>
		<p class="mt-3 text-xs text-zinc-500 dark:text-zinc-400">{m.download_request_body()}</p>
	</section>

	{#if page.url.searchParams.get('e')}
		<p class="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:bg-red-950/40 dark:text-red-400">
			{m.download_invalid_link()}
		</p>
	{/if}

	<section class="mt-10">
		<h2 class="font-display text-lg font-semibold text-zinc-900 dark:text-white">{m.download_faq_heading()}</h2>
		<div class="mt-4 space-y-4">
			{#each faqs as faq (faq.q)}
				<details class="group rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
					<summary class="cursor-pointer list-none text-sm font-medium text-zinc-900 marker:hidden dark:text-white">
						{faq.q}
					</summary>
					<p class="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{faq.a}</p>
				</details>
			{/each}
		</div>
	</section>
</div>
