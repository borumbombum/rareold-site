import { json, error } from '@sveltejs/kit';
import { getAdmin } from '$lib/server/admin';
import { listOrigins, getOriginById, upsertOrigin, deleteOrigin } from '$lib/server/origins';

const ID_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export async function GET({ url, cookies }) {
	if (!(await getAdmin(cookies))) return json({ error: 'forbidden' }, { status: 403 });
	const id = url.searchParams.get('id');
	if (id) {
		const origin = await getOriginById(id);
		if (!origin) throw error(404, 'origin not found');
		return json(origin);
	}
	return json(await listOrigins());
}

export async function PUT({ request, cookies }) {
	if (!(await getAdmin(cookies))) return json({ error: 'forbidden' }, { status: 403 });
	const body = await request.json();
	if (!body.id || !ID_RE.test(body.id)) throw error(400, 'id must be lowercase letters, numbers and hyphens');
	if (!String(body.name ?? '').trim()) throw error(400, 'name required');
	if ('sort_order' in body && body.sort_order !== null && !Number.isFinite(Number(body.sort_order)))
		throw error(400, 'sort_order must be a number');
	await upsertOrigin(body);
	return json({ ok: true });
}

export async function DELETE({ url, cookies }) {
	if (!(await getAdmin(cookies))) return json({ error: 'forbidden' }, { status: 403 });
	const id = url.searchParams.get('id');
	if (!id) throw error(400, 'id required');
	const result = await deleteOrigin(id);
	if (!result.ok) {
		throw error(409, `origin in use by ${result.reason}`);
	}
	return json({ ok: true });
}
