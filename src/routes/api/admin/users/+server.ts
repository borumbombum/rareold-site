import { json } from '@sveltejs/kit';
import { getAdmin, listUsers, setUserRole } from '$lib/server/admin';

export async function GET({ cookies }) {
	if (!(await getAdmin(cookies))) return json({ error: 'forbidden' }, { status: 403 });
	return json({ users: await listUsers() });
}

export async function PUT({ request, cookies }) {
	const admin = await getAdmin(cookies);
	if (!admin) return json({ error: 'forbidden' }, { status: 403 });
	const body = (await request.json().catch(() => ({}))) as {
		id?: string;
		role?: string;
	};
	const { id, role } = body;
	if (!id || (role !== 'admin' && role !== 'user')) {
		return json({ error: 'missing_required' }, { status: 400 });
	}
	if (id === admin.id && role !== 'admin') {
		return json({ error: 'cannot_demote_self' }, { status: 400 });
	}
	try {
		await setUserRole(id, role);
		return json({ ok: true });
	} catch (e) {
		return json({ error: (e as Error).message || 'update failed' }, { status: 400 });
	}
}
