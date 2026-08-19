import { json } from '@sveltejs/kit';
import { getKarmaMap, getUserVotedSlugs } from '$lib/server/votes';
import { getSessionUser } from '$lib/server/session';

export async function GET({ url, cookies }) {
	const slugs = (url.searchParams.get('slugs') ?? '').split(',').filter(Boolean);
	const map = await getKarmaMap(slugs);

	const user = await getSessionUser(cookies);
	let voted: string[] = [];
	if (user) {
		voted = await getUserVotedSlugs(user.id, slugs);
	}

	return json(
		{ items: [...map.values()], voted },
		{ headers: { 'Cache-Control': 'no-store' } }
	);
}
