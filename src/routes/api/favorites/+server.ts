import { json } from '@sveltejs/kit';
import { listFavoriteIds, toggleFavorite } from '$lib/server/favorites';
import { getSessionUser } from '$lib/server/session';

export async function GET({ cookies }) {
	const user = await getSessionUser(cookies);
	if (!user) return json({ error: 'not_authed' }, { status: 401 });
	const slugs = await listFavoriteIds(user.id);
	return json({ slugs }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST({ request, cookies }) {
	const body = await request.json().catch(() => ({}));
	const { product_id, on } = body as { product_id?: string; on?: boolean };
	if (!product_id || typeof on !== 'boolean') {
		return json({ error: 'missing_params' }, { status: 400 });
	}
	const user = await getSessionUser(cookies);
	if (!user) return json({ error: 'not_authed' }, { status: 401 });

	try {
		await toggleFavorite(user.id, product_id, on);
		return json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
	} catch (e) {
		return json({ error: (e as Error).message || 'favorite failed' }, { status: 400 });
	}
}
