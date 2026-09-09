import { json, error } from '@sveltejs/kit';
import { getAdmin } from '$lib/server/admin';
import { listStores, upsertStore, deleteStore } from '$lib/server/stores';

const ID_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CODE_RE = /^[A-Z]{2}$/;
const URL_RE = /^https?:\/\/.+/i;

export async function GET({ url, cookies }) {
	if (!(await getAdmin(cookies))) return json({ error: 'forbidden' }, { status: 403 });
	const country = url.searchParams.get('country');
	const stores = country ? await listStores(country.toUpperCase()) : await listStores(null);
	return json(stores);
}

export async function PUT({ request, cookies }) {
	if (!(await getAdmin(cookies))) return json({ error: 'forbidden' }, { status: 403 });
	const body = await request.json();
	if (!body.id || !ID_RE.test(body.id))
		throw error(400, 'id must be lowercase letters, numbers and hyphens');
	if (!body.store_country_code || !CODE_RE.test(String(body.store_country_code)))
		throw error(400, 'store_country_code must be two uppercase letters');
	if (!String(body.name ?? '').trim()) throw error(400, 'name required');
	if (!String(body.url ?? '').trim() || !URL_RE.test(String(body.url))) throw error(400, 'url required');
	await upsertStore(body);
	return json({ ok: true });
}

export async function DELETE({ url, cookies }) {
	if (!(await getAdmin(cookies))) return json({ error: 'forbidden' }, { status: 403 });
	const id = url.searchParams.get('id');
	if (!id) throw error(400, 'id required');
	const result = await deleteStore(id);
	if (!result.ok) throw error(409, 'store in use by products');
	return json({ ok: true });
}