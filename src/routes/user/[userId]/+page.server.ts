import { redirect } from '@sveltejs/kit';
import { localizeHref } from '$lib/paraglide/runtime';
import { getSessionUser } from '$lib/server/session';
import { listFavoriteIds } from '$lib/server/favorites';
import { getUserReviews, getUserReviewedSlugs } from '$lib/server/reviews';
import { getRatingMap } from '$lib/server/data';
import { getWhiskyBySlug } from '$lib/data/whiskies';
import { siteForLocale } from '$lib/server/env';
import type { Locale, Whisky } from '$lib/types';

export const load = async ({ params, locals, cookies }) => {
	const locale = (locals.locale ?? 'en') as Locale;
	const site = siteForLocale(locale);
	const user = await getSessionUser(cookies);
	if (!user || user.id !== params.userId) {
		redirect(307, localizeHref('/', { locale }));
	}

	const [favoriteSlugs, votedSlugs, reviews] = await Promise.all([
		listFavoriteIds(user.id),
		getUserReviewedSlugs(user.id),
		getUserReviews(user.id, 20)
	]);

	const unionSlugs = [...new Set([...favoriteSlugs, ...votedSlugs])];
	const products = unionSlugs
		.map((s) => getWhiskyBySlug(s))
		.filter((p): p is Whisky => Boolean(p));
	const ratingMap = await getRatingMap(unionSlugs);

	return {
		locale,
		countryCode: site.countryCode,
		user,
		favoriteSlugs,
		votedSlugs,
		reviews,
		products,
		rating: [...ratingMap.values()].map((e) => ({
			slug: e.entity_id,
			avg_rating: e.avg_rating,
			review_count: e.review_count
		}))
	};
};
