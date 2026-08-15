import { siteForLocale } from '$lib/server/env';
import { getCatalog, getKarmaMap } from '$lib/server/data';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, setHeaders }) => {
	const locale = (locals.locale ?? 'es') as 'es' | 'pt';
	const site = siteForLocale(locale);

	const products = await getCatalog(site);
	const karmaMap = await getKarmaMap(products.map((p) => p.slug));

	setHeaders({
		'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=600'
	});

	return {
		locale,
		countryCode: site.countryCode,
		products,
		karma: [...karmaMap.values()].map((e) => ({
			slug: e.entity_id,
			karma: e.karma,
			votes: e.vote_count
		}))
	};
};
