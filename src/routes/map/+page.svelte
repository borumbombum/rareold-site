<script lang="ts">
	import { localizeHref, getUrlOrigin } from '$lib/paraglide/runtime';
	import { buildAlternates } from '$lib/utils/seo';
	import SEO from '$lib/components/SEO.svelte';
	import Hero from '$lib/components/Hero.svelte';
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

<Hero
	imageUrl="/images/whisky.webp"
	title={m.map_title()}
	subtitle={m.map_subtitle()}
	count={m.map_distilleries({ count: String(located.length) })}
/>

<section class="mx-auto max-w-7xl px-4 pb-24 sm:px-6">
	<div class="pt-10">
		<DistilleryMap />
	</div>
</section>
