import { redirect } from '@sveltejs/kit';
import { localizeHref } from '$lib/paraglide/runtime';
import { getSessionUser } from '$lib/server/session';
import { listFavoriteIds } from '$lib/server/favorites';
import { getRatingMap } from '$lib/server/data';
import { getWhiskyBySlug } from '$lib/data/whiskies';
import { siteForLocale } from '$lib/server/env';
import type { Locale, Whisky } from '$lib/types';

export const load = async ({ params, locals, cookies }) => {
	const locale = (locals.locale ?? 'es') as Locale;
	const site = siteForLocale(locale);
	const user = await getSessionUser(cookies);
	if (!user || user.id !== params.userId) {
		redirect(307, localizeHref('/', { locale }));
	}

	const slugs = await listFavoriteIds(user.id);
	const products = slugs
		.map((s) => getWhiskyBySlug(s))
		.filter((p): p is Whisky => Boolean(p));
	const ratingMap = await getRatingMap(slugs);

	return {
		locale,
		countryCode: site.countryCode,
		user,
		products,
		rating: [...ratingMap.values()].map((e) => ({
			slug: e.entity_id,
			avg_rating: e.avg_rating,
			review_count: e.review_count
		}))
	};
};
