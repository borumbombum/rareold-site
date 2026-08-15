import { json } from '@sveltejs/kit';
import { getKarmaMap } from '$lib/server/votes';

export async function GET({ url }) {
	const slugs = (url.searchParams.get('slugs') ?? '').split(',').filter(Boolean);
	const map = await getKarmaMap(slugs);
	return json({ items: [...map.values()] }, { headers: { 'Cache-Control': 'no-store' } });
}
