import { json, error } from '@sveltejs/kit';
import { getAdmin } from '$lib/server/admin';
import { listPages, upsertPage, deletePage } from '$lib/server/pages';

export async function GET({ cookies }) {
	await getAdmin(cookies);
	const pages = await listPages();
	return json(pages);
}

export async function PUT({ request, cookies }) {
	await getAdmin(cookies);
	const body = await request.json();
	if (!body.id || !body.slug) throw error(400, 'id and slug required');
	await upsertPage(body);
	return json({ ok: true });
}

export async function DELETE({ url, cookies }) {
	await getAdmin(cookies);
	const id = url.searchParams.get('id');
	if (!id) throw error(400, 'id required');
	await deletePage(id);
	return json({ ok: true });
}
