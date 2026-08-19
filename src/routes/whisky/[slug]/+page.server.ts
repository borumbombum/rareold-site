import { error } from '@sveltejs/kit';
import { siteForLocale } from '$lib/server/env';
import { getKarmaMap, getProductBySlug, getProductVideos, getReviews } from '$lib/server/data';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals, setHeaders }) => {
	const locale = (locals.locale ?? 'es') as 'es' | 'pt';
	const site = siteForLocale(locale);

	const product = await getProductBySlug(site, params.slug);
	if (!product) error(404, 'Product not found');

	const entityId = product.slug;
	const [karmaMap, reviews, videos] = await Promise.all([
		getKarmaMap([entityId]),
		getReviews(product.id, site.countryCode),
		getProductVideos(product.id)
	]);
	const karma = karmaMap.get(entityId);

	setHeaders({
		'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=600'
	});

	return {
		countryCode: site.countryCode,
		product,
		videos,
		karma: karma
			? [{ slug: entityId, karma: karma.karma, votes: karma.vote_count }]
			: [],
		reviews
	};
};
