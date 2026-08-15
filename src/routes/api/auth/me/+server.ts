import { json } from '@sveltejs/kit';
import { getSessionUser } from '$lib/server/session';

export async function GET({ cookies }) {
	const user = await getSessionUser(cookies);
	return json({ user }, { headers: { 'Cache-Control': 'no-store' } });
}
