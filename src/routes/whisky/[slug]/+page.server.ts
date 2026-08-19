import { error } from '@sveltejs/kit';
import { siteForLocale } from '$lib/server/env';
import { getProductBySlug, getProductVideos, getReviews, getRatingMap } from '$lib/server/data';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals, setHeaders }) => {
	const locale = locals.locale ?? 'es';
	const site = siteForLocale(locale);

	const product = await getProductBySlug(site, params.slug);
	if (!product) error(404, 'Product not found');

	const entityId = product.slug;
	const [ratingMap, reviews, videos] = await Promise.all([
		getRatingMap([entityId]),
		getReviews(product.id, site.countryCode),
		getProductVideos(product.id)
	]);
	const rating = ratingMap.get(entityId);

	setHeaders({
		'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=600'
	});

	return {
		countryCode: site.countryCode,
		product,
		videos,
		rating: rating
			? [{ slug: entityId, avg_rating: rating.avg_rating, review_count: rating.review_count }]
			: [],
		reviews
	};
};
