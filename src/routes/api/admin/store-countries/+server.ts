import { json, error } from '@sveltejs/kit';
import { getAdmin } from '$lib/server/admin';
import { listStoreCountries, upsertStoreCountry, deleteStoreCountry } from '$lib/server/stores';

const CODE_RE = /^[A-Z]{2}$/;

export async function GET({ cookies }) {
	if (!(await getAdmin(cookies))) return json({ error: 'forbidden' }, { status: 403 });
	return json(await listStoreCountries());
}

export async function PUT({ request, cookies }) {
	if (!(await getAdmin(cookies))) return json({ error: 'forbidden' }, { status: 403 });
	const body = await request.json();
	if (!body.code || !CODE_RE.test(String(body.code)))
		throw error(400, 'code must be two uppercase letters (ISO 3166-1 alpha-2)');
	if (!String(body.name ?? '').trim()) throw error(400, 'name required');
	if (!String(body.currency ?? '').trim()) throw error(400, 'currency required');
	await upsertStoreCountry(body);
	return json({ ok: true });
}

export async function DELETE({ url, cookies }) {
	if (!(await getAdmin(cookies))) return json({ error: 'forbidden' }, { status: 403 });
	const code = url.searchParams.get('id');
	if (!code) throw error(400, 'id required');
	const result = await deleteStoreCountry(code);
	if (!result.ok) throw error(409, 'country in use by stores');
	return json({ ok: true });
}