<script lang="ts">
	import { ArrowLeft, ClipboardList, Store, ExternalLink, Share2, Star } from '@lucide/svelte';
	import { getLocale, localizeHref } from '$lib/paraglide/runtime';
	import { ratingStore, refreshRating, seedRating } from '$lib/stores/rating.svelte';
	import { originFlag, originLabel } from '$lib/utils/origins';
	import { l10n } from '$lib/utils/l10n';
	import { formatPrice } from '$lib/utils/format';
	import { resellersFor } from '$lib/utils/resellers';
	import { ui } from '$lib/stores/ui.svelte';
	import { m } from '$lib/paraglide/messages';
	import FavoriteButton from '$lib/components/FavoriteButton.svelte';
	import InfluencerVideos from '$lib/components/InfluencerVideos.svelte';
	import ReviewSection from '$lib/components/ReviewSection.svelte';
	import type { CountryCode } from '$lib/types';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	seedRating(data.countryCode, data.rating);
	const product = $derived(data.product);
	const videos = $derived(data.videos ?? []);
	const slug = $derived(product.slug);
	const locale = $derived(getLocale());
	const flag = $derived(originFlag(product));
	const name = $derived(l10n(product, 'name') ?? product.name);
	const description = $derived(l10n(product, 'description') ?? product.description);
	const homeHref = $derived(localizeHref('/'));
	const country = $derived(data.countryCode as CountryCode);

	$effect(() => {
		refreshRating([slug]);
	});

	const ratingEntry = $derived(ratingStore.get(slug));
	const avgRating = $derived(ratingEntry.avg_rating);
	const reviewCount = $derived(ratingEntry.review_count);

	const fullStars = $derived(Math.floor(avgRating));
	const hasHalf = $derived(avgRating - fullStars >= 0.3);

	const schemaJson = $derived(data.schemaJson);

	async function share() {
		const url = window.location.origin + localizeHref(`/whisky/${slug}`);
		try {
			if (navigator.share) {
				await navigator.share({ title: name, text: description?.slice(0, 160) ?? '', url });
			} else {
				await navigator.clipboard.writeText(url);
				ui.showToast(m.share_copied());
			}
		} catch {
			try {
				await navigator.clipboard.writeText(url);
				ui.showToast(m.share_copied());
			} catch {}
		}
	}

	const specs = $derived.by(() => {
		const list: { label: string; value: string }[] = [];
		if (product.region) list.push({ label: m.spec_region(), value: product.region });
		if (product.age != null) list.push({ label: m.spec_age(), value: String(product.age) });
		if (product.abv != null) list.push({ label: m.spec_abv(), value: `${product.abv}%` });
		if (product.volume) list.push({ label: m.spec_volume(), value: product.volume });
		if (product.cask) list.push({ label: m.spec_cask(), value: product.cask });
		return list;
	});

	const resellers = $derived(resellersFor(product, country));
	const resellerCurrency = $derived(country === 'BR' ? 'BRL' : 'UYU');
</script>

<svelte:head>
	<title>{m.seo_product_title({ name })}</title>
	<meta
		name="description"
		content={(description ?? '').slice(0, 160)}
	/>
	{#if schemaJson}
		{@html `<script type="application/ld+json">${JSON.stringify(schemaJson)}</script>`}
	{/if}
</svelte:head>

<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6">
	<a
		href={homeHref}
		class="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
	>
		<ArrowLeft size={15} />
		{m.detail_back()}
	</a>

	<div class="mt-6 grid min-w-0 gap-10 lg:grid-cols-2 lg:gap-14">
		<div class="min-w-0 lg:sticky lg:top-24 lg:self-start">
			<InfluencerVideos {videos} />
			<div class="relative grid aspect-square place-items-center overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-50 dark:border-zinc-200 dark:bg-white">
				{#if product.image}
					<img src={product.image} alt={name} class="h-full w-full object-contain" />
				{:else}
					<span class="text-8xl opacity-60">🥃</span>
				{/if}
				<button
					onclick={share}
					class="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/90 text-zinc-700 shadow-sm backdrop-blur transition hover:bg-white hover:text-zinc-900 dark:bg-zinc-900/90 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-white"
					aria-label={m.share()}
				>
					<Share2 size={18} />
				</button>
			</div>
		</div>

		<div class="min-w-0">
			<p class="text-sm font-medium uppercase tracking-wide text-zinc-400">
				{flag} {originLabel(product.origin)}
			</p>
			<h1 class="font-display mt-1 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
				{name}
			</h1>
			{#if product.distillery}
				<p class="mt-1 text-zinc-500 dark:text-zinc-400">{l10n(product.distillery, 'name')}</p>
			{/if}

			{#if description}
				<section class="mt-6">
					<h2 class="font-display text-xl font-semibold text-zinc-900 dark:text-white">
						{m.detail_description()}
					</h2>
					<div
						class="mt-2 text-zinc-600 dark:text-zinc-300 [&_p]:mt-2 [&_h2]:mt-3 [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-semibold [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:mt-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-accent [&_a]:underline"
					>
						{@html description}
					</div>
				</section>
			{/if}

			<div class="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-zinc-50 px-5 py-4 dark:border-zinc-800 dark:bg-zinc-900">
				<div class="flex flex-wrap items-center gap-3">
					<FavoriteButton {slug} />
				</div>
				<div class="text-right">
					<div class="flex items-center justify-end gap-1">
						{#each [1, 2, 3, 4, 5] as n}
							<Star
								size={22}
								class={n <= fullStars
									? 'text-amber-500'
									: n === fullStars + 1 && hasHalf
										? 'text-amber-500'
										: 'text-zinc-300 dark:text-zinc-700'}
								fill="currentColor"
							/>
						{/each}
					</div>
					<span class="mt-1 block text-sm text-zinc-500 dark:text-zinc-400">
						{avgRating > 0 ? avgRating.toFixed(1) : '—'} · {reviewCount} {m.reviews_count()}
					</span>
				</div>
			</div>

			<section class="mt-8">
				<h2 class="flex items-center gap-2 font-display text-xl font-semibold text-zinc-900 dark:text-white">
					<Store size={20} class="text-accent" />
					{m.stores_title()}
				</h2>
				<p class="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{m.stores_note()}</p>
				<div class="mt-4 flex flex-col gap-3">
					{#each resellers as reseller (reseller.url)}
						<a
							href={reseller.url}
							target="_blank"
							rel="noopener noreferrer sponsored"
							class="group flex items-center justify-between gap-3 rounded-2xl border border-zinc-200 px-4 py-3.5 transition hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:hover:border-zinc-700"
						>
							<span class="font-medium text-zinc-900 dark:text-white">{reseller.name}</span>
							<span class="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
								{#if reseller.price != null}
									<span class="font-semibold text-zinc-900 dark:text-white">
										{formatPrice(reseller.price, resellerCurrency, locale)}
									</span>
								{/if}
								<span class="flex items-center gap-1 text-zinc-400 transition group-hover:text-accent">
									{m.view()}
									<ExternalLink size={14} />
								</span>
							</span>
						</a>
					{/each}
				</div>
			</section>

		<ReviewSection productId={product.id} countryCode={country} initial={data.reviews} />

		{#if specs.length > 0}
				<section class="mt-8">
					<h2 class="flex items-center gap-2 font-display text-xl font-semibold text-zinc-900 dark:text-white">
						<ClipboardList size={20} class="text-accent" />
						{m.detail_specs()}
					</h2>
					<dl class="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
						{#each specs as spec}
							<div class="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-900">
								<dt class="text-[11px] font-medium uppercase tracking-wide text-zinc-400">
									{spec.label}
								</dt>
								<dd class="mt-0.5 text-sm font-medium text-zinc-900 dark:text-zinc-100">
									{spec.value}
								</dd>
							</div>
						{/each}
					</dl>
				</section>
			{/if}
		</div>
	</div>
</div>
