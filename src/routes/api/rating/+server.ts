import { json } from '@sveltejs/kit';
import { getRatingMap, getUserReviewedSlugs } from '$lib/server/reviews';
import { getSessionUser } from '$lib/server/session';

export async function GET({ url, cookies }) {
	const slugs = (url.searchParams.get('slugs') ?? '').split(',').filter(Boolean);
	const user = await getSessionUser(cookies);

	const [map, reviewed] = await Promise.all([
		getRatingMap(slugs),
		user ? getUserReviewedSlugs(user.id, slugs) : Promise.resolve([])
	]);

	return json(
		{ items: [...map.values()], reviewed },
		{ headers: { 'Cache-Control': 'no-store' } }
	);
}
