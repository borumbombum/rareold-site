import { siteForLocale } from '$lib/server/env';
import { getCatalog, getRatingMap } from '$lib/server/data';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, setHeaders }) => {
	const locale = (locals.locale ?? 'es') as 'es' | 'pt';
	const site = siteForLocale(locale);

	const products = await getCatalog(site);
	const ratingMap = await getRatingMap(products.map((p) => p.slug));

	setHeaders({
		'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=600',
		'Vary': 'Cookie'
	});

	return {
		locale,
		countryCode: site.countryCode,
		products,
		rating: [...ratingMap.values()].map((e) => ({
			slug: e.entity_id,
			avg_rating: e.avg_rating,
			review_count: e.review_count
		}))
	};
};
