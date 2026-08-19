import { error, redirect } from '@sveltejs/kit';
import { siteForLocale } from '$lib/server/env';
import { getCatalog, getRatingMap } from '$lib/server/data';
import originData from '$lib/data/origins.json';
import { resolveOriginSlug, originSlug } from '$lib/utils/origins';
import { localizeHref } from '$lib/paraglide/runtime';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals, setHeaders }) => {
	const locale = (locals.locale ?? 'es') as 'es' | 'pt' | 'en';
	const site = siteForLocale(locale);
	const slug = params.slug;

	const canonicalId = resolveOriginSlug(slug);
	if (!canonicalId) throw error(404, 'Origin not found');

	const expectedSlug = originSlug(canonicalId, locale);
	if (slug !== expectedSlug) {
		throw redirect(301, localizeHref(`/origen/${expectedSlug}`));
	}

	const origin = originData.find((o) => o.id === canonicalId);
	if (!origin) throw error(404, 'Origin not found');

	const allProducts = await getCatalog(site);
	const products = allProducts.filter((p) => p.origin === canonicalId);
	const ratingMap = await getRatingMap(products.map((p) => p.slug));

	setHeaders({
		'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=600',
		'Vary': 'Cookie'
	});

	return {
		locale,
		countryCode: site.countryCode,
		products,
		origin,
		slug: canonicalId,
		rating: [...ratingMap.values()].map((e) => ({
			slug: e.entity_id,
			avg_rating: e.avg_rating,
			review_count: e.review_count
		}))
	};
};
