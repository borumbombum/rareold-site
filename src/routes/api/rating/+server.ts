import { json } from '@sveltejs/kit';
import { getRatingMap, getUserReviewedSlugs } from '$lib/server/reviews';
import { getSessionUser } from '$lib/server/session';

export async function GET({ url, cookies }) {
	const slugs = (url.searchParams.get('slugs') ?? '').split(',').filter(Boolean);
	const map = await getRatingMap(slugs);

	const user = await getSessionUser(cookies);
	let reviewed: string[] = [];
	if (user) {
		reviewed = await getUserReviewedSlugs(user.id, slugs);
	}

	return json(
		{ items: [...map.values()], reviewed },
		{ headers: { 'Cache-Control': 'no-store' } }
	);
}
