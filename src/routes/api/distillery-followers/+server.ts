import { json } from '@sveltejs/kit';
import { listFollowedDistilleryIds, toggleDistilleryFollow } from '$lib/server/distillery-followers';
import { getSessionUser } from '$lib/server/session';

export async function GET({ cookies }) {
	const user = await getSessionUser(cookies);
	if (!user) return json({ error: 'not_authed' }, { status: 401 });
	const distilleryIds = await listFollowedDistilleryIds(user.id);
	return json({ distilleryIds }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST({ request, cookies }) {
	const body = await request.json().catch(() => ({}));
	const { distillery_id, on } = body as { distillery_id?: string; on?: boolean };
	if (!distillery_id || typeof on !== 'boolean') {
		return json({ error: 'missing_params' }, { status: 400 });
	}
	const user = await getSessionUser(cookies);
	if (!user) return json({ error: 'not_authed' }, { status: 401 });

	try {
		await toggleDistilleryFollow(user.id, distillery_id, on);
		return json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
	} catch (e) {
		return json({ error: (e as Error).message || 'follow failed' }, { status: 400 });
	}
}
