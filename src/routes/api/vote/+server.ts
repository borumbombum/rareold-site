import { json } from '@sveltejs/kit';
import { applyVote } from '$lib/server/votes';
import { getSessionUser } from '$lib/server/session';
import { invalidateKarma } from '$lib/server/data';
import type { CountryCode } from '$lib/types';

export async function POST({ request, cookies }) {
	const body = await request.json().catch(() => ({}));
	const { entity_id, karma, country } = body as {
		entity_id?: string;
		karma?: number;
		country?: CountryCode;
	};
	if (!entity_id || typeof karma !== 'number' || karma === 0) {
		return json({ error: 'missing_params' }, { status: 400 });
	}
	const user = await getSessionUser(cookies);
	if (!user) return json({ error: 'not_authed' }, { status: 401 });

	try {
		await applyVote({ entity_id, user_id: user.id, country: country ?? 'UY', value: karma });
		invalidateKarma();
		return json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
	} catch (e) {
		return json({ error: (e as Error).message || 'vote failed' }, { status: 400 });
	}
}
