import { json } from '@sveltejs/kit';
import { getAdmin, getStats } from '$lib/server/admin';

export async function GET({ cookies }) {
	if (!(await getAdmin(cookies))) return json({ error: 'forbidden' }, { status: 403 });
	return json(await getStats());
}
