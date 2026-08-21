import { error } from '@sveltejs/kit';
import { siteForLocale } from '$lib/server/env';
import { getCatalog, getRatingMap, getDistilleryBySlug } from '$lib/server/data';
import { buildOrganizationSchema } from '$lib/server/schema';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals, url, setHeaders }) => {
	const locale = locals.locale ?? 'es';
	const site = siteForLocale(locale);

	const distillery = await getDistilleryBySlug(site, params.slug);
	if (!distillery) throw error(404, 'Distillery not found');

	const allProducts = await getCatalog(site);
	const products = allProducts.filter((p) => p.distillery?.id === distillery.id);
	const ratingMap = await getRatingMap(products.map((p) => p.slug));

	setHeaders({
		'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=600',
		'Vary': 'Cookie'
	});

	return {
		locale,
		countryCode: site.countryCode,
		distillery,
		products,
		schemaJson: buildOrganizationSchema(distillery, url.origin),
		rating: [...ratingMap.values()].map((e) => ({
			slug: e.entity_id,
			avg_rating: e.avg_rating,
			review_count: e.review_count
		}))
	};
};
