import { siteForLocale } from '$lib/server/env';
import { getCatalog, getRatingMap, getLatestActivity } from '$lib/server/data';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, setHeaders }) => {
	const locale = locals.locale ?? 'es';
	const site = siteForLocale(locale);

	const products = await getCatalog(site);
	const [ratingMap, activity] = await Promise.all([
		getRatingMap(products.map((p) => p.slug)),
		getLatestActivity(8)
	]);

	setHeaders({
		'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=600',
		'Vary': 'Cookie'
	});

	return {
		locale,
		countryCode: site.countryCode,
		products,
		activity,
		rating: [...ratingMap.values()].map((e) => ({
			slug: e.entity_id,
			avg_rating: e.avg_rating,
			review_count: e.review_count
		}))
	};
};
