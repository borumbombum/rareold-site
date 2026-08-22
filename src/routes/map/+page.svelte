<script lang="ts">
	import { localizeHref, getUrlOrigin } from '$lib/paraglide/runtime';
	import { buildAlternates } from '$lib/utils/seo';
	import SEO from '$lib/components/SEO.svelte';
	import DistilleryMap from '$lib/components/DistilleryMap.svelte';
	import { m } from '$lib/paraglide/messages';
	import { getLocale } from '$lib/paraglide/runtime';
	import { DISTILLERIES } from '$lib/data/distilleries';
	import type { LocaleKey } from '$lib/utils/locales';

	const locale = $derived(getLocale());
	const alternates = $derived(buildAlternates((lc: LocaleKey) => '/map', getUrlOrigin()));
	const located = $derived(
		DISTILLERIES.filter((d) => typeof d.latitude === 'number' && typeof d.longitude === 'number')
	);
</script>

<SEO
	title={m.map_title()}
	description={m.map_subtitle()}
	canonicalPath={localizeHref('/map', { locale })}
	ogImage={getUrlOrigin() + '/images/whisky.webp'}
	hreflangAlternates={alternates}
/>

<section class="mx-auto max-w-7xl px-4 pb-24 pt-10 sm:px-6">
	<h1 class="font-display text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
		{m.map_title()}
	</h1>
	<p class="mt-2 text-zinc-600 dark:text-zinc-400">{m.map_subtitle()}</p>
	<p class="mt-1 text-sm text-zinc-500 dark:text-zinc-500">
		{m.map_distilleries({ count: String(located.length) })}
	</p>
	<div class="mt-8">
		<DistilleryMap />
	</div>
</section>
